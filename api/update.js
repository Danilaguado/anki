import { google } from "googleapis";

function calculateNextReview(word, srsFeedback) {
  let interval = parseInt(word.Intervalo_SRS, 10) || 1;
  let easeFactor = parseFloat(word.Factor_Facilidad) || 2.5;
  if (srsFeedback === "again") {
    interval = 1;
    easeFactor -= 0.2;
  } else {
    if (srsFeedback === "hard") {
      interval = Math.round(interval * 1.2);
      easeFactor -= 0.15;
    } else if (srsFeedback === "good") {
      interval = Math.round(interval * easeFactor);
    } else if (srsFeedback === "easy") {
      interval = Math.round(interval * easeFactor * 1.3);
      easeFactor += 0.15;
    }
  }
  easeFactor = Math.max(1.3, easeFactor);
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  return {
    newInterval: interval,
    newEaseFactor: easeFactor.toFixed(2),
    nextReviewDate: nextReviewDate.toISOString().split("T")[0],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }
  const { userId, results, sentiment, sessionInfo } = req.body;
  if (!userId || !results || !sessionInfo) {
    return res
      .status(400)
      .json({
        success: false,
        message: "UserID, results y session info son requeridos.",
      });
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
    const sessionId = `Sesion-${Date.now()}`;

    const sessionRow = [
      sessionId,
      sessionInfo.deckId,
      userId,
      sessionInfo.startTime,
      new Date().toISOString(),
      sessionInfo.duration,
      sessionInfo.status,
      sentiment,
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Study_Sessions!A:H",
      valueInputOption: "USER_ENTERED",
      resource: { values: [sessionRow] },
    });

    const logRows = results.map((r) => [
      sessionId,
      r.wordId,
      r.isCorrect ? "Correcto" : "Incorrecto",
      r.responseTime,
      r.srsFeedback,
    ]);
    if (logRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Log_Estudio!A:E",
        valueInputOption: "USER_ENTERED",
        resource: { values: logRows },
      });
    }

    const userWordsRange = "User_Words!A:H";
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: userWordsRange,
    });
    const rows = response.data.values || [];
    const headers = rows[0];
    const dataToUpdate = [];
    const today = new Date().toISOString().split("T")[0];

    results.forEach((result) => {
      const rowIndex = rows.findIndex(
        (row) =>
          row[headers.indexOf("UserID")] === userId &&
          row[headers.indexOf("ID_Palabra")] === result.wordId
      );
      if (rowIndex > -1) {
        const wordData = {};
        headers.forEach((header, i) => (wordData[header] = rows[rowIndex][i]));
        const { newInterval, newEaseFactor, nextReviewDate } =
          calculateNextReview(wordData, result.srsFeedback);

        dataToUpdate.push({
          range: `User_Words!D${rowIndex + 1}`,
          values: [[newInterval]],
        });
        dataToUpdate.push({
          range: `User_Words!E${rowIndex + 1}`,
          values: [[nextReviewDate]],
        });
        dataToUpdate.push({
          range: `User_Words!F${rowIndex + 1}`,
          values: [[newEaseFactor]],
        });

        const currentAciertos = parseInt(wordData.Total_Aciertos, 10) || 0;
        const currentErrores = parseInt(wordData.Total_Errores, 10) || 0;
        if (result.isCorrect) {
          dataToUpdate.push({
            range: `User_Words!G${rowIndex + 1}`,
            values: [[currentAciertos + 1]],
          });
        } else {
          dataToUpdate.push({
            range: `User_Words!H${rowIndex + 1}`,
            values: [[currentErrores + 1]],
          });
        }
      }
    });

    if (dataToUpdate.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: { valueInputOption: "USER_ENTERED", data: dataToUpdate },
      });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Resultados guardados y SRS actualizado.",
      });
  } catch (error) {
    console.error("Error al actualizar Google Sheet:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error del servidor al guardar los resultados.",
        error: error.message,
      });
  }
}
