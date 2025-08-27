// /api/track-activity.js - Versión final con la lógica de "Dominada" integrada
import { google } from "googleapis";

// --- Funciones de Utilidad y SRS (Tu código original) ---

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

// --- Handler Principal de la API (Corregido y Reestructurado) ---

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

      // --- LÓGICA SEPARADA PARA INTERACCIONES DE TARJETA ---
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
        const { wordId, difficulty, sessionId } = cardData;
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

// --- NUEVAS FUNCIONES AUXILIARES SEPARADAS ---

async function updateWordCorrectness(
  sheets,
  spreadsheetId,
  userId,
  wordId,
  isCorrect,
  type
) {
  const range = `u_${userId}!A:M`; // <-- CORRECCIÓN CRÍTICA

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];
    if (rows.length === 0) return;

    const headers = rows[0];
    const wordIdIndex = headers.indexOf("ID_Palabra");
    const rowIndex = rows.findIndex((row) => row[wordIdIndex] === wordId);

    if (rowIndex === -1) {
      console.error(`Palabra ${wordId} no encontrada para ${userId}.`);
      return;
    }

    const rowData = rows[rowIndex];

    if (type === "text") {
      const correctIndex = headers.indexOf("Total_Aciertos");
      const incorrectIndex = headers.indexOf("Total_Errores");
      let totalCorrect = parseInt(rowData[correctIndex]) || 0;
      let totalIncorrect = parseInt(rowData[incorrectIndex]) || 0;
      if (isCorrect) totalCorrect++;
      else totalIncorrect++;

      const colLetter = String.fromCharCode("A".charCodeAt(0) + correctIndex);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `u_${userId}!${colLetter}${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [[totalCorrect, totalIncorrect]] },
      });
    } else if (type === "voice") {
      const voiceCorrectIndex = headers.indexOf("Total_Voz_Aciertos");
      const voiceIncorrectIndex = headers.indexOf("Total_Voz_Errores");
      let voiceCorrect = parseInt(rowData[voiceCorrectIndex]) || 0;
      let voiceIncorrect = parseInt(rowData[voiceIncorrectIndex]) || 0;
      if (isCorrect) voiceCorrect++;
      else voiceIncorrect++;

      const colLetter = String.fromCharCode(
        "A".charCodeAt(0) + voiceCorrectIndex
      );
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `u_${userId}!${colLetter}${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [[voiceCorrect, voiceIncorrect]] },
      });
    }
  } catch (error) {
    console.error(`Error al actualizar acierto/error para u_${userId}:`, error);
  }
}

async function updateWordSRS(
  sheets,
  spreadsheetId,
  userId,
  wordId,
  difficulty
) {
  const range = `u_${userId}!A:M`; // <-- CORRECCIÓN CRÍTICA

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];
    if (rows.length === 0) return;

    const headers = rows[0];
    const wordIdIndex = headers.indexOf("ID_Palabra");
    const rowIndex = rows.findIndex((row) => row[wordIdIndex] === wordId);

    if (rowIndex === -1) {
      console.error(`Palabra ${wordId} no encontrada para ${userId}.`);
      return;
    }

    const rowData = rows[rowIndex];
    const intervalIndex = headers.indexOf("Intervalo_SRS");
    const easeFactorIndex = headers.indexOf("Factor_Facilidad");
    const nextReviewIndex = headers.indexOf("Fecha_Proximo_Repaso");
    const stateIndex = headers.indexOf("Estado");

    const currentInterval = parseInt(rowData[intervalIndex]) || 1;
    const easeFactor = parseFloat(rowData[easeFactorIndex]) || 2.5;
    const { newInterval, newEaseFactor } = calculateSRSInterval(
      currentInterval,
      difficulty,
      easeFactor
    );
    const nextReviewDate = calculateNextReview(newInterval);

    let newStatus = rowData[stateIndex];
    if (newInterval > 30) {
      newStatus = "Dominada";
    }

    const srsUpdateData = [
      newInterval,
      newEaseFactor.toFixed(2),
      nextReviewDate,
      newStatus,
    ];
    const startColLetter = String.fromCharCode(
      "A".charCodeAt(0) + intervalIndex
    );

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `u_${userId}!${startColLetter}${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [srsUpdateData] },
    });
  } catch (error) {
    console.error(`Error al actualizar SRS para u_${userId}:`, error);
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
