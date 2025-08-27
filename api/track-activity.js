// /api/track-activity.js - Versión final con la lógica de "Dominada" integrada

import { google } from "googleapis";

// --- Funciones de Utilidad y SRS ---

function generateShortId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}-${random}`;
}

// Algoritmo de Repetición Espaciada (SRS)
function calculateSRSInterval(previousInterval, difficulty, easeFactor) {
  let newInterval = previousInterval || 1;
  let newEaseFactor = easeFactor || 2.5;

  switch (difficulty) {
    case "again": // Mal
      newInterval = 1;
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
      break;
    case "hard": // Difícil
      newInterval = Math.max(1, Math.round(newInterval * 1.2));
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.15);
      break;
    case "good": // Bien
      newInterval = Math.round(newInterval * newEaseFactor);
      break;
    case "easy": // Fácil
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

//=============== ESTE ES EL CÓDIGO CORRECTO Y COMPLETO ===============

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { action, userId, sessionData, cardData, voiceData, finalResults } =
    req.body;

  if (!userId || !action) {
    return res
      .status(400)
      .json({ success: false, message: "UserID y action son requeridos." });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const timestamp = new Date().toISOString();

    switch (action) {
      case "start_session": {
        // Tu lógica original se mantiene
        const sessionId = generateShortId();
        const sessionRow = [
          sessionId,
          sessionData.deckId || "Custom",
          userId,
          timestamp,
          null,
          null,
          "En_Progreso",
          null,
          null,
          null,
          null,
        ];
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Study_Sessions!A:K",
          valueInputOption: "USER_ENTERED",
          resource: { values: [sessionRow] },
        });
        await updateDailyActivity(
          sheets,
          spreadsheetId,
          userId,
          timestamp,
          "session_start"
        );
        return res
          .status(200)
          .json({ success: true, sessionId, message: "Sesión iniciada." });
      }

      // --- NUEVA LÓGICA SEPARADA ---
      case "check_answer": {
        const { wordId, isCorrect } = cardData;
        await updateWordCorrectness(
          sheets,
          spreadsheetId,
          userId,
          wordId,
          isCorrect,
          "text"
        );
        return res
          .status(200)
          .json({ success: true, message: "Resultado registrado." });
      }

      case "rate_memory": {
        const { wordId, difficulty, sessionId } = cardData; // Asumimos que sessionId se envía
        await updateWordSRS(sheets, spreadsheetId, userId, wordId, difficulty);

        if (difficulty === "again" || difficulty === "hard") {
          await schedulePracticeReview(
            sheets,
            spreadsheetId,
            userId,
            wordId,
            difficulty
          );
        }

        // También registramos la interacción completa para tener un log
        const interactionRow = [
          generateShortId(),
          sessionId,
          wordId,
          userId,
          timestamp,
          "SRS_Feedback",
          null,
          null,
          null,
          difficulty,
        ];
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Card_Interactions!A:J",
          valueInputOption: "USER_ENTERED",
          resource: { values: [interactionRow] },
        });

        return res
          .status(200)
          .json({
            success: true,
            message: "Evaluación de memoria registrada.",
          });
      }

      case "voice_interaction": {
        // Tu lógica original se mantiene, pero ahora usa la nueva función auxiliar
        const {
          sessionId,
          wordId,
          detectedText,
          expectedText,
          isVoiceCorrect,
        } = voiceData;
        const voiceInteractionRow = [
          generateShortId(),
          sessionId,
          wordId,
          userId,
          timestamp,
          detectedText,
          expectedText,
          isVoiceCorrect,
          calculateSimilarityPercentage(detectedText, expectedText),
        ];
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Voice_Interactions!A:I",
          valueInputOption: "USER_ENTERED",
          resource: { values: [voiceInteractionRow] },
        });

        await updateWordCorrectness(
          sheets,
          spreadsheetId,
          userId,
          wordId,
          isVoiceCorrect,
          "voice"
        );

        return res
          .status(200)
          .json({ success: true, message: "Interacción de voz registrada." });
      }

      case "end_session": {
        // Tu lógica original se mantiene
        const { sessionId, sentiment, results } = finalResults;
        const correctAnswers = results.filter((r) => r.isCorrect).length;
        const totalAnswers = results.length;
        const accuracy =
          totalAnswers > 0
            ? ((correctAnswers / totalAnswers) * 100).toFixed(2)
            : 0;
        const rowNumber = await getSessionRowNumber(
          sheets,
          spreadsheetId,
          sessionId
        );
        if (rowNumber === -1)
          throw new Error("ID de sesión no encontrado para finalizar.");

        const sessionResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `Study_Sessions!D${rowNumber}`,
        });
        const startTime = sessionResponse.data.values[0][0];
        const durationMs =
          new Date(timestamp).getTime() - new Date(startTime).getTime();
        const updateData = [
          { range: `Study_Sessions!E${rowNumber}`, values: [[timestamp]] },
          { range: `Study_Sessions!F${rowNumber}`, values: [[durationMs]] },
          { range: `Study_Sessions!G${rowNumber}`, values: [["Completada"]] },
          { range: `Study_Sessions!H${rowNumber}`, values: [[sentiment]] },
          { range: `Study_Sessions!I${rowNumber}`, values: [[correctAnswers]] },
          { range: `Study_Sessions!J${rowNumber}`, values: [[totalAnswers]] },
          { range: `Study_Sessions!K${rowNumber}`, values: [[accuracy]] },
        ];
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          resource: { valueInputOption: "USER_ENTERED", data: updateData },
        });
        await updateDailyActivity(
          sheets,
          spreadsheetId,
          userId,
          timestamp,
          "session_end",
          {
            duration: durationMs,
            wordsCount: totalAnswers,
            accuracy: parseFloat(accuracy),
          }
        );
        return res
          .status(200)
          .json({ success: true, message: "Sesión completada." });
      }

      case "abandon_session": {
        // Tu lógica original se mantiene
        const { sessionId } = sessionData;
        const rowNumber = await getSessionRowNumber(
          sheets,
          spreadsheetId,
          sessionId
        );
        if (rowNumber === -1)
          throw new Error("ID de sesión no encontrado para abandonar.");

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Study_Sessions!G${rowNumber}`,
          valueInputOption: "USER_ENTERED",
          resource: { values: [["Abandonada"]] },
        });
        await updateDailyActivity(
          sheets,
          spreadsheetId,
          userId,
          timestamp,
          "session_abandon"
        );
        return res
          .status(200)
          .json({ success: true, message: "Sesión abandonada." });
      }

      default:
        return res
          .status(400)
          .json({ success: false, message: "Acción no válida." });
    }
  } catch (error) {
    console.error("Error en track-activity:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor.",
      error: error.message,
    });
  }
}

// --- Funciones Auxiliares Completas ---

async function updateWordStatistics(
  sheets,
  spreadsheetId,
  userId,
  wordId,
  interactionData
) {
  const { isCorrect, responseTime, difficulty, type } = interactionData;
  // IMPORTANTE: Asegúrate que la hoja de la que lees es la hoja INDIVIDUAL del usuario
  // y que contiene todas las columnas que necesitas.
  // Si tus columnas (Estado, Intervalo_SRS, etc.) están en `User_${userId}`
  // deberías cambiar el 'range' aquí. Por ahora, asumiré que están en "Word_Statistics".
  const range = `User_${userId}!A:M`; // <--- AJUSTADO PARA APUNTAR A LA HOJA DE USUARIO

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const rows = response.data.values || [];
  const headers = rows[0] || [];

  // Encontrar los índices de las columnas que nos interesan
  const wordIdIndex = headers.indexOf("ID_Palabra");
  if (wordIdIndex === -1)
    throw new Error("La columna 'ID_Palabra' no se encontró.");

  const rowIndex = rows.findIndex((row) => row[wordIdIndex] === wordId);

  let stats = {};
  if (rowIndex > 0) {
    const currentRow = rows[rowIndex];
    headers.forEach((header, i) => (stats[header] = currentRow[i]));
  } else {
    // Si la palabra no existe, no podemos actualizarla.
    // Esto previene crear filas nuevas desde aquí. La creación debe ser en otro proceso.
    console.log(
      `Palabra ${wordId} no encontrada para usuario ${userId}. Se omite la actualización.`
    );
    return;
  }

  // Lógica de actualización de contadores
  stats.Total_Aciertos = parseInt(stats.Total_Aciertos) || 0;
  stats.Total_Errores = parseInt(stats.Total_Errores) || 0;
  stats.Total_Voz_Aciertos = parseInt(stats.Total_Voz_Aciertos) || 0;
  stats.Total_Voz_Errores = parseInt(stats.Total_Voz_Errores) || 0;

  if (type === "text") {
    if (isCorrect) stats.Total_Aciertos++;
    else stats.Total_Errores++;
  } else if (type === "voice") {
    if (isCorrect) stats.Total_Voz_Aciertos++;
    else stats.Total_Voz_Errores++;
  }

  // Lógica de SRS
  const { newInterval, newEaseFactor } = calculateSRSInterval(
    parseInt(stats.Intervalo_SRS),
    difficulty,
    parseFloat(stats.Factor_Facilidad)
  );
  stats.Intervalo_SRS = newInterval;
  stats.Factor_Facilidad = newEaseFactor.toFixed(2);
  stats.Fecha_Proximo_Repaso = calculateNextReview(newInterval);

  // ******************************************************
  // ***** INICIO: LÓGICA PARA PALABRA "DOMINADA" *****
  // ******************************************************

  const DOMINADA_THRESHOLD = 30; // Umbral de 30 días

  // Asegúrate de que tu hoja de usuario tiene una columna llamada "Estado"
  if (headers.includes("Estado")) {
    if (newInterval > DOMINADA_THRESHOLD) {
      stats.Estado = "Dominada";
    }
  }

  // ******************************************************
  // ****** FIN: LÓGICA PARA PALABRA "DOMINADA" ******
  // ******************************************************

  const newRowData = headers.map((header) => stats[header] || null);

  if (rowIndex > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `User_${userId}!A${rowIndex + 1}`, // Apunta a la fila correcta en la hoja de usuario
      valueInputOption: "USER_ENTERED",
      resource: { values: [newRowData] },
    });
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
  const range = "Daily_Activity!A:J";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const rows = response.data.values || [];
  const headers = rows[0] || [];
  const rowIndex = rows.findIndex(
    (row) => row[0] === userId && row[1] === today
  );

  let dailyData = {};
  if (rowIndex > 0) {
    headers.forEach((h, i) => (dailyData[h] = rows[rowIndex][i]));
  } else {
    dailyData = { UserID: userId, Date: today };
  }

  dailyData.Last_Activity_Timestamp = timestamp;
  if (activityType === "session_start") {
    dailyData.Total_Sessions_Started =
      (parseInt(dailyData.Total_Sessions_Started) || 0) + 1;
  }
  if (activityType === "session_end") {
    dailyData.Total_Sessions_Completed =
      (parseInt(dailyData.Total_Sessions_Completed) || 0) + 1;
    dailyData.Total_Study_Time_ms =
      (parseInt(dailyData.Total_Study_Time_ms) || 0) + extraData.duration;
    dailyData.Total_Words_Practiced =
      (parseInt(dailyData.Total_Words_Practiced) || 0) + extraData.wordsCount;
  }

  const newRow = headers.map((h) => dailyData[h] || null);

  if (rowIndex > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Daily_Activity!A${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [newRow] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [newRow] },
    });
  }
}

async function schedulePracticeReview(
  sheets,
  spreadsheetId,
  userId,
  wordId,
  difficulty
) {
  const reviewDate =
    difficulty === "again"
      ? new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 horas
      : new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 horas

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
}

async function getSessionRowNumber(sheets, spreadsheetId, sessionId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Study_Sessions!A:A",
  });
  const rows = response.data.values || [];
  const index = rows.findIndex((row) => row[0] === sessionId);
  return index !== -1 ? index + 1 : -1;
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
