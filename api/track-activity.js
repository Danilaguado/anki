// /api/track-activity.js - COMPLETAMENTE CORREGIDO
import { google } from "googleapis";

function generateShortId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}-${random}`;
}

function calculateSRSInterval(previousInterval, difficulty, easeFactor) {
  let newInterval = previousInterval || 1;
  let newEaseFactor = easeFactor || 2.5;

  switch (difficulty) {
    case "again":
      newInterval = 1;
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
      break;
    case "hard":
      newInterval = Math.max(1, Math.round(newInterval * 1.2));
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.15);
      break;
    case "good":
      newInterval = Math.round(newInterval * newEaseFactor);
      break;
    case "easy":
      newInterval = Math.round(newInterval * newEaseFactor * 1.3);
      newEaseFactor = Math.min(2.5, newEaseFactor + 0.15);
      break;
  }
  return { newInterval, newEaseFactor };
}

function calculateNextReview(interval) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  return nextDate.toISOString().split("T")[0];
}

async function authorize() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return auth;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido" });
  }

  try {
    const { userId, action, sessionData, cardData, voiceData, finalResults } =
      req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        message: "Faltan parámetros obligatorios: userId y action.",
      });
    }

    const auth = await authorize();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log(`[TRACK-ACTIVITY] Acción: ${action} para usuario: ${userId}`);

    switch (action) {
      case "start_session": {
        const newSessionId = `session_${generateShortId()}`;
        const currentTime = new Date().toISOString();

        // Registrar en Study_Sessions
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Study_Sessions!A:K",
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              [
                newSessionId, // ID_Sesion
                sessionData?.deckId || "general", // ID_Mazo
                userId, // UserID
                currentTime, // Timestamp_Inicio
                "", // Timestamp_Fin
                "", // Duracion_Total_ms
                "En progreso", // Estado_Final
                "", // Sentimiento_Reportado
                "", // Palabras_Correctas
                "", // Palabras_Totales
                "", // Porcentaje_Acierto
              ],
            ],
          },
        });

        // Actualizar Daily_Activity
        await updateDailyActivity(
          sheets,
          spreadsheetId,
          userId,
          currentTime,
          "session_start"
        );

        console.log(`[TRACK-ACTIVITY] Sesión iniciada: ${newSessionId}`);

        return res.status(200).json({
          success: true,
          message: "Sesión iniciada correctamente.",
          sessionId: newSessionId,
        });
      }

      case "check_answer": {
        const { wordId, isCorrect } = cardData;

        // Actualizar estadísticas de la palabra del usuario
        await updateWordCorrectness(
          sheets,
          spreadsheetId,
          userId,
          wordId,
          isCorrect,
          "text"
        );

        // Actualizar Word_Statistics
        await updateWordStatistics(
          sheets,
          spreadsheetId,
          userId,
          wordId,
          isCorrect,
          "text"
        );

        console.log(
          `[TRACK-ACTIVITY] Respuesta registrada: ${wordId} = ${isCorrect}`
        );

        return res.status(200).json({
          success: true,
          message: "Respuesta registrada.",
        });
      }

      case "rate_memory": {
        const { sessionId, wordId, difficulty } = cardData;
        const currentTime = new Date().toISOString();

        // REGISTRAR EN Card_Interactions
        const interactionId = `interaction_${generateShortId()}`;
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Card_Interactions!A:K",
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              [
                interactionId, // ID_Interaccion
                sessionId, // ID_Sesion
                wordId, // ID_Palabra
                userId, // UserID
                currentTime, // Timestamp
                "Text", // Tipo_Interaccion
                "", // Respuesta_Usuario (vacío para memory rating)
                "", // Es_Correcto (se registró antes)
                "", // Tiempo_Respuesta_ms
                difficulty, // SRS_Difficulty
                "", // Proximo_Repaso (se calculará después)
              ],
            ],
          },
        });

        // Actualizar SRS del usuario
        await updateWordSRS(sheets, spreadsheetId, userId, wordId, difficulty);

        // Programar próxima práctica
        await schedulePracticeReview(
          sheets,
          spreadsheetId,
          userId,
          wordId,
          difficulty
        );

        console.log(
          `[TRACK-ACTIVITY] Memoria evaluada: ${wordId} = ${difficulty}`
        );

        return res.status(200).json({
          success: true,
          message: "Evaluación de memoria registrada.",
        });
      }

      case "voice_interaction": {
        const {
          sessionId,
          wordId,
          detectedText,
          expectedText,
          isVoiceCorrect,
        } = voiceData;
        const currentTime = new Date().toISOString();

        // REGISTRAR EN Voice_Interactions
        const voiceId = `voice_${generateShortId()}`;
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Voice_Interactions!A:I",
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              [
                voiceId, // ID_Voz
                sessionId, // ID_Sesion
                wordId, // ID_Palabra
                userId, // UserID
                currentTime, // Timestamp
                detectedText, // Texto_Detectado
                expectedText, // Texto_Esperado
                isVoiceCorrect, // Es_Correcto
                calculateSimilarityPercentage(detectedText, expectedText), // Precision_Porcentaje
              ],
            ],
          },
        });

        // Actualizar estadísticas de voz
        await updateWordCorrectness(
          sheets,
          spreadsheetId,
          userId,
          wordId,
          isVoiceCorrect,
          "voice"
        );
        await updateWordStatistics(
          sheets,
          spreadsheetId,
          userId,
          wordId,
          isVoiceCorrect,
          "voice"
        );

        console.log(
          `[TRACK-ACTIVITY] Interacción de voz registrada: ${wordId}`
        );

        return res.status(200).json({
          success: true,
          message: "Interacción de voz registrada.",
        });
      }

      case "end_session": {
        const {
          sessionId,
          sentiment, // ESTE ES EL SENTIMIENTO REAL DEL USUARIO
          sessionDuration,
          correctAnswers,
          totalAnswers,
          accuracy,
        } = finalResults;

        const currentTime = new Date().toISOString();

        console.log(`[TRACK-ACTIVITY] Finalizando sesión: ${sessionId}`);
        console.log(`[TRACK-ACTIVITY] Datos finales:`, {
          sentiment,
          sessionDuration,
          correctAnswers,
          totalAnswers,
          accuracy,
        });

        // Buscar la fila de la sesión
        const rowNumber = await getSessionRowNumber(
          sheets,
          spreadsheetId,
          sessionId
        );
        if (rowNumber === -1) {
          throw new Error("ID de sesión no encontrado para finalizar.");
        }

        // ACTUALIZAR Study_Sessions CON TODOS LOS DATOS
        const updateData = [
          { range: `Study_Sessions!E${rowNumber}`, values: [[currentTime]] }, // Timestamp_Fin
          {
            range: `Study_Sessions!F${rowNumber}`,
            values: [[sessionDuration]],
          }, // Duracion_Total_ms
          { range: `Study_Sessions!G${rowNumber}`, values: [["Completada"]] }, // Estado_Final
          { range: `Study_Sessions!H${rowNumber}`, values: [[sentiment]] }, // Sentimiento_Reportado (CORRECTO)
          { range: `Study_Sessions!I${rowNumber}`, values: [[correctAnswers]] }, // Palabras_Correctas
          { range: `Study_Sessions!J${rowNumber}`, values: [[totalAnswers]] }, // Palabras_Totales
          { range: `Study_Sessions!K${rowNumber}`, values: [[accuracy]] }, // Porcentaje_Acierto
        ];

        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          resource: { valueInputOption: "USER_ENTERED", data: updateData },
        });

        // Actualizar actividad diaria
        await updateDailyActivity(
          sheets,
          spreadsheetId,
          userId,
          currentTime,
          "session_end",
          {
            duration: sessionDuration,
            wordsCount: totalAnswers,
            accuracy: parseFloat(accuracy),
          }
        );

        console.log(`[TRACK-ACTIVITY] Sesión completada exitosamente`);

        return res.status(200).json({
          success: true,
          message: "Sesión completada y registrada.",
        });
      }

      case "abandon_session": {
        const sessionId = req.body.sessionId;

        if (!sessionId) {
          console.log("[TRACK-ACTIVITY] No sessionId para abandonar");
          return res
            .status(200)
            .json({ success: true, message: "Sin sesión activa" });
        }

        const currentTime = new Date().toISOString();
        const rowNumber = await getSessionRowNumber(
          sheets,
          spreadsheetId,
          sessionId
        );

        if (rowNumber !== -1) {
          const updateData = [
            { range: `Study_Sessions!E${rowNumber}`, values: [[currentTime]] }, // Timestamp_Fin
            { range: `Study_Sessions!G${rowNumber}`, values: [["Abandonada"]] }, // Estado_Final
          ];

          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            resource: { valueInputOption: "USER_ENTERED", data: updateData },
          });
        }

        await updateDailyActivity(
          sheets,
          spreadsheetId,
          userId,
          currentTime,
          "session_abandon"
        );

        return res.status(200).json({
          success: true,
          message: "Sesión abandonada registrada.",
        });
      }
      case "daily_checkin": {
        // Solo actualizar actividad diaria
        await updateDailyActivity(
          sheets,
          spreadsheetId,
          userId,
          new Date().toISOString(),
          "daily_checkin"
        );

        return res.status(200).json({
          success: true,
          message: "Check-in diario registrado.",
        });
      }

      default:
        return res.status(400).json({
          success: false,
          message: `Acción no válida: ${action}`,
        });
    }
  } catch (error) {
    console.error("Error en track-activity API:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar la actividad.",
      error: error.message,
    });
  }
}

// ===== FUNCIONES AUXILIARES =====

async function updateWordCorrectness(
  sheets,
  spreadsheetId,
  userId,
  wordId,
  isCorrect,
  type
) {
  // CORRECCIÓN: Usar ID limpio sin prefijo para el nombre de hoja
  const cleanUserId = userId.startsWith("user_") ? userId.substring(5) : userId;
  const range = `${cleanUserId}!A:I`;

  console.log(
    `[updateWordCorrectness] Actualizando ${wordId} en hoja ${cleanUserId}, tipo: ${type}, correcto: ${isCorrect}`
  );

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.error(`No hay datos en la hoja ${cleanUserId}`);
      return;
    }

    const headers = rows[0];
    const wordIdIndex = headers.indexOf("ID_Palabra");
    const dataRows = rows.slice(1);
    const rowIndex = dataRows.findIndex((row) => row[wordIdIndex] === wordId);

    if (rowIndex === -1) {
      console.error(
        `Palabra ${wordId} no encontrada en la hoja ${cleanUserId}.`
      );
      return;
    }

    const actualRowNumber = rowIndex + 2;
    const rowData = dataRows[rowIndex];

    if (type === "text") {
      const correctIndex = headers.indexOf("Total_Aciertos");
      const incorrectIndex = headers.indexOf("Total_Errores");

      let totalCorrect = parseInt(rowData[correctIndex] || 0);
      let totalIncorrect = parseInt(rowData[incorrectIndex] || 0);

      if (isCorrect) {
        totalCorrect++;
      } else {
        totalIncorrect++;
      }

      const correctCol = String.fromCharCode("A".charCodeAt(0) + correctIndex);
      const incorrectCol = String.fromCharCode(
        "A".charCodeAt(0) + incorrectIndex
      );

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          valueInputOption: "USER_ENTERED",
          data: [
            {
              range: `${cleanUserId}!${correctCol}${actualRowNumber}`,
              values: [[totalCorrect]],
            },
            {
              range: `${cleanUserId}!${incorrectCol}${actualRowNumber}`,
              values: [[totalIncorrect]],
            },
          ],
        },
      });

      console.log(
        `[updateWordCorrectness] Actualizado texto - Aciertos: ${totalCorrect}, Errores: ${totalIncorrect}`
      );
    } else if (type === "voice") {
      const voiceCorrectIndex = headers.indexOf("Total_Voz_Aciertos");
      const voiceIncorrectIndex = headers.indexOf("Total_Voz_Errores");

      let voiceCorrect = parseInt(rowData[voiceCorrectIndex] || 0);
      let voiceIncorrect = parseInt(rowData[voiceIncorrectIndex] || 0);

      if (isCorrect) {
        voiceCorrect++;
      } else {
        voiceIncorrect++;
      }

      const voiceCorrectCol = String.fromCharCode(
        "A".charCodeAt(0) + voiceCorrectIndex
      );
      const voiceIncorrectCol = String.fromCharCode(
        "A".charCodeAt(0) + voiceIncorrectIndex
      );

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          valueInputOption: "USER_ENTERED",
          data: [
            {
              range: `${cleanUserId}!${voiceCorrectCol}${actualRowNumber}`,
              values: [[voiceCorrect]],
            },
            {
              range: `${cleanUserId}!${voiceIncorrectCol}${actualRowNumber}`,
              values: [[voiceIncorrect]],
            },
          ],
        },
      });

      console.log(
        `[updateWordCorrectness] Actualizado voz - Aciertos: ${voiceCorrect}, Errores: ${voiceIncorrect}`
      );
    }
  } catch (error) {
    console.error(`Error al actualizar acierto/error para ${userId}:`, error);
  }
}

async function updateWordSRS(
  sheets,
  spreadsheetId,
  userId,
  wordId,
  difficulty
) {
  // AGREGAR ESTA LÍNEA:
  const cleanUserId = userId.startsWith("user_") ? userId.substring(5) : userId;
  const range = `${cleanUserId}!A:I`;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return;

    const headers = rows[0];
    const wordIdIndex = headers.indexOf("ID_Palabra");
    const dataRows = rows.slice(1);
    const rowIndex = dataRows.findIndex((row) => row[wordIdIndex] === wordId);

    if (rowIndex === -1) {
      console.error(`Palabra ${wordId} no encontrada para SRS en ${userId}.`);
      return;
    }

    const actualRowNumber = rowIndex + 2;
    const rowData = dataRows[rowIndex];

    const intervalIndex = headers.indexOf("Intervalo_SRS");
    const easeFactorIndex = headers.indexOf("Factor_Facilidad");
    const nextReviewIndex = headers.indexOf("Fecha_Proximo_Repaso");
    const stateIndex = headers.indexOf("Estado");

    const currentInterval = parseInt(rowData[intervalIndex] || 1);
    const easeFactor = parseFloat(rowData[easeFactorIndex] || 2.5);
    const { newInterval, newEaseFactor } = calculateSRSInterval(
      currentInterval,
      difficulty,
      easeFactor
    );
    const nextReviewDate = calculateNextReview(newInterval);

    let newStatus = rowData[stateIndex] || "Aprendiendo";
    if (newInterval > 30) {
      newStatus = "Dominada";
    }

    const intervalCol = String.fromCharCode("A".charCodeAt(0) + intervalIndex);
    const easeFactorCol = String.fromCharCode(
      "A".charCodeAt(0) + easeFactorIndex
    );
    const nextReviewCol = String.fromCharCode(
      "A".charCodeAt(0) + nextReviewIndex
    );
    const stateCol = String.fromCharCode("A".charCodeAt(0) + stateIndex);

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: `${cleanUserId}!${intervalCol}${actualRowNumber}`,
            values: [[newInterval]],
          },
          {
            range: `${cleanUserId}!${easeFactorCol}${actualRowNumber}`,
            values: [[newEaseFactor.toFixed(2)]],
          },
          {
            range: `${cleanUserId}!${nextReviewCol}${actualRowNumber}`,
            values: [[nextReviewDate]],
          },
          {
            range: `${cleanUserId}!${stateCol}${actualRowNumber}`,
            values: [[newStatus]],
          },
        ],
      },
    });

    console.log(
      `[updateWordSRS] SRS actualizado - Intervalo: ${newInterval}, Estado: ${newStatus}`
    );
  } catch (error) {
    console.error(`Error al actualizar SRS para ${userId}:`, error);
  }
}

async function updateWordStatistics(
  sheets,
  spreadsheetId,
  userId,
  wordId,
  isCorrect,
  type
) {
  console.log(
    `[updateWordStatistics] Actualizando stats ${wordId} para ${userId}`
  );

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Word_Statistics!A:M",
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      console.log(
        `[updateWordStatistics] Hoja Word_Statistics vacía o solo headers`
      );
      // Crear nuevo registro
      const newRow = [
        userId,
        wordId,
        1, // Total_Veces_Practicada
        type === "text" && isCorrect ? 1 : 0, // Total_Aciertos_Texto
        type === "text" && !isCorrect ? 1 : 0, // Total_Errores_Texto
        type === "voice" && isCorrect ? 1 : 0, // Total_Aciertos_Voz
        type === "voice" && !isCorrect ? 1 : 0, // Total_Errores_Voz
        0, // Mejor_Tiempo_Respuesta
        0, // Peor_Tiempo_Respuesta
        0, // Promedio_Tiempo_Respuesta
        2, // Dificultad_Promedio
        new Date().toISOString().split("T")[0], // Ultima_Practica
        null, // Proxima_Revision
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Word_Statistics!A:M",
        valueInputOption: "USER_ENTERED",
        resource: { values: [newRow] },
      });

      console.log(
        `[updateWordStatistics] Nuevo registro creado para ${wordId}`
      );
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const rowIndex = dataRows.findIndex(
      (row) => row[0] === userId && row[1] === wordId
    );

    if (rowIndex === -1) {
      // Crear nuevo registro
      const newRow = [
        userId,
        wordId,
        1, // Total_Veces_Practicada
        type === "text" && isCorrect ? 1 : 0, // Total_Aciertos_Texto
        type === "text" && !isCorrect ? 1 : 0, // Total_Errores_Texto
        type === "voice" && isCorrect ? 1 : 0, // Total_Aciertos_Voz
        type === "voice" && !isCorrect ? 1 : 0, // Total_Errores_Voz
        0, // Mejor_Tiempo_Respuesta
        0, // Peor_Tiempo_Respuesta
        0, // Promedio_Tiempo_Respuesta
        2, // Dificultad_Promedio
        new Date().toISOString().split("T")[0], // Ultima_Practica
        null, // Proxima_Revision
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Word_Statistics!A:M",
        valueInputOption: "USER_ENTERED",
        resource: { values: [newRow] },
      });

      console.log(
        `[updateWordStatistics] Nuevo registro creado para ${wordId}`
      );
    } else {
      // Actualizar registro existente
      const actualRowNumber = rowIndex + 2;
      const rowData = dataRows[rowIndex];

      let totalPracticed = parseInt(rowData[2] || 0) + 1;
      let textCorrect = parseInt(rowData[3] || 0);
      let textIncorrect = parseInt(rowData[4] || 0);
      let voiceCorrect = parseInt(rowData[5] || 0);
      let voiceIncorrect = parseInt(rowData[6] || 0);

      if (type === "text") {
        if (isCorrect) textCorrect++;
        else textIncorrect++;
      } else if (type === "voice") {
        if (isCorrect) voiceCorrect++;
        else voiceIncorrect++;
      }

      const updateData = [
        {
          range: `Word_Statistics!C${actualRowNumber}`,
          values: [[totalPracticed]],
        },
        {
          range: `Word_Statistics!D${actualRowNumber}`,
          values: [[textCorrect]],
        },
        {
          range: `Word_Statistics!E${actualRowNumber}`,
          values: [[textIncorrect]],
        },
        {
          range: `Word_Statistics!F${actualRowNumber}`,
          values: [[voiceCorrect]],
        },
        {
          range: `Word_Statistics!G${actualRowNumber}`,
          values: [[voiceIncorrect]],
        },
        {
          range: `Word_Statistics!L${actualRowNumber}`,
          values: [[new Date().toISOString().split("T")[0]]],
        },
      ];

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: { valueInputOption: "USER_ENTERED", data: updateData },
      });

      console.log(
        `[updateWordStatistics] Estadísticas actualizadas para ${wordId}`
      );
    }
  } catch (error) {
    console.error(`Error al actualizar estadísticas de palabra:`, error);
  }
}

async function updateDailyActivity(
  sheets,
  spreadsheetId,
  userId,
  timestamp,
  activityType,
  extraData = {}
) {
  const today = new Date(timestamp).toISOString().split("T")[0];
  const timeOnly = timestamp.split("T")[1].substring(0, 8);

  console.log(
    `[updateDailyActivity] Actualizando actividad diaria para ${userId}, tipo: ${activityType}`
  );

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Daily_Activity!A:J",
    });

    const rows = response.data.values || [];
    const headers =
      rows.length > 0
        ? rows[0]
        : [
            "UserID",
            "Fecha",
            "Primera_Sesion",
            "Ultima_Sesion",
            "Total_Sesiones_Dia",
            "Total_Tiempo_Estudio_ms",
            "Sesiones_Completadas",
            "Sesiones_Abandonadas",
            "Palabras_Practicadas",
            "Porcentaje_Acierto_Dia",
          ];

    const dataRows = rows.slice(1);
    const rowIndex = dataRows.findIndex(
      (row) => row[0] === userId && row[1] === today
    );

    let dailyData = {
      UserID: userId,
      Fecha: today,
      Primera_Sesion: timeOnly,
      Ultima_Sesion: timeOnly,
      Total_Sesiones_Dia: 0,
      Total_Tiempo_Estudio_ms: 0,
      Sesiones_Completadas: 0,
      Sesiones_Abandonadas: 0,
      Palabras_Practicadas: 0,
      Porcentaje_Acierto_Dia: 0,
    };

    if (rowIndex !== -1) {
      // Cargar datos existentes
      const existingData = dataRows[rowIndex];
      headers.forEach((header, i) => {
        if (existingData[i] !== undefined) {
          dailyData[header] = existingData[i];
        }
      });
      // Mantener la primera sesión del día
      dailyData.Primera_Sesion = existingData[2] || timeOnly;
    }

    // Actualizar según tipo de actividad
    switch (activityType) {
      case "session_start":
      case "daily_checkin":
        dailyData.Total_Sesiones_Dia =
          parseInt(dailyData.Total_Sesiones_Dia || 0) + 1;
        break;
      case "session_end":
        dailyData.Sesiones_Completadas =
          parseInt(dailyData.Sesiones_Completadas || 0) + 1;
        dailyData.Total_Tiempo_Estudio_ms =
          parseInt(dailyData.Total_Tiempo_Estudio_ms || 0) +
          (extraData.duration || 0);
        dailyData.Palabras_Practicadas;
        dailyData.Palabras_Practicadas =
          parseInt(dailyData.Palabras_Practicadas || 0) +
          (extraData.wordsCount || 0);
        break;
      case "session_abandon":
        dailyData.Sesiones_Abandonadas =
          parseInt(dailyData.Sesiones_Abandonadas || 0) + 1;
        break;
    }

    dailyData.Ultima_Sesion = timeOnly;

    const newRow = headers.map((header) => dailyData[header] || "");

    if (rowIndex !== -1) {
      // Actualizar fila existente
      const actualRowNumber = rowIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Daily_Activity!A${actualRowNumber}:J${actualRowNumber}`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [newRow] },
      });
      console.log(`[updateDailyActivity] Actividad diaria actualizada`);
    } else {
      // Crear nueva fila
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Daily_Activity!A:J",
        valueInputOption: "USER_ENTERED",
        resource: { values: [newRow] },
      });
      console.log(`[updateDailyActivity] Nueva actividad diaria creada`);
    }
  } catch (error) {
    console.error(`Error al actualizar actividad diaria:`, error);
  }
}

async function schedulePracticeReview(
  sheets,
  spreadsheetId,
  userId,
  wordId,
  difficulty
) {
  try {
    const intervalHours =
      difficulty === "again" ? 4 : difficulty === "hard" ? 12 : 24;
    const reviewDate = new Date(Date.now() + intervalHours * 60 * 60 * 1000);

    const practiceRow = [
      userId,
      wordId,
      reviewDate.toISOString().split("T")[0],
      reviewDate.toISOString().split("T")[1].substring(0, 5),
      "Pendiente",
      null,
      null,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Practice_Schedule!A:G",
      valueInputOption: "USER_ENTERED",
      resource: { values: [practiceRow] },
    });

    console.log(`[schedulePracticeReview] Práctica programada para ${wordId}`);
  } catch (error) {
    console.error(`Error programando práctica:`, error);
  }
}

async function getSessionRowNumber(sheets, spreadsheetId, sessionId) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Study_Sessions!A:A",
    });
    const rows = response.data.values || [];
    const index = rows.findIndex((row) => row[0] === sessionId);
    return index !== -1 ? index + 1 : -1;
  } catch (error) {
    console.error(`Error buscando sesión ${sessionId}:`, error);
    return -1;
  }
}

function calculateSimilarityPercentage(detected, expected) {
  if (!detected || !expected) return 0;
  const detectedLower = detected.toLowerCase().trim();
  const expectedLower = expected.toLowerCase().trim();
  if (detectedLower === expectedLower) return 100;
  const longer =
    detectedLower.length > expectedLower.length ? detectedLower : expectedLower;
  if (longer.length === 0) return 100;
  const editDistance = levenshteinDistance(detectedLower, expectedLower);
  return Math.round((1 - editDistance / longer.length) * 100);
}

function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}
