// ===== /api/update.js =====
// Propósito: Guardar los resultados del quiz y actualizar las palabras con la lógica de repetición espaciada.

import { google } from "googleapis";

// --- Lógica del Algoritmo de Repetición Espaciada (SRS) ---
function calculateNextReview(word, srsFeedback) {
  let interval = parseInt(word.Intervalo_SRS, 10) || 1;
  let easeFactor = parseFloat(word.Factor_Facilidad) || 2.5;

  if (srsFeedback === "again") {
    interval = 1; // Reiniciar el intervalo
  } else {
    if (srsFeedback === "hard") {
      easeFactor -= 0.15;
    } else if (srsFeedback === "easy") {
      easeFactor += 0.15;
    }
    // 'good' no cambia el factor de facilidad

    interval = Math.round(interval * easeFactor);
  }

  // Asegurarse de que el factor de facilidad no sea menor a 1.3
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

  const { results, sentiment } = req.body;

  if (!results || results.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Results are required." });
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

    // 1. Añadir entradas al Log_Estudio
    const logRows = results.map((r) => [
      r.timestamp,
      "Respuesta Quiz",
      r.wordId,
      r.isCorrect ? "Correcto" : "Incorrecto",
      r.responseTime,
      sentiment,
      r.srsFeedback,
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Log_Estudio!A:G",
      valueInputOption: "USER_ENTERED",
      resource: { values: logRows },
    });

    // 2. Actualizar la hoja Master_Palabras con la nueva lógica SRS
    const range = "Master_Palabras!A:L";
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];
    const headers = rows[0];

    const dataToUpdate = [];
    const today = new Date().toISOString().split("T")[0];

    results.forEach((result) => {
      const rowIndex = rows.findIndex(
        (row) => row[headers.indexOf("ID_Palabra")] === result.wordId
      );
      if (rowIndex > -1) {
        const wordData = {};
        headers.forEach((header, i) => (wordData[header] = rows[rowIndex][i]));

        const { newInterval, newEaseFactor, nextReviewDate } =
          calculateNextReview(wordData, result.srsFeedback);

        // Preparamos las actualizaciones para esta fila
        dataToUpdate.push({
          range: `Master_Palabras!F${rowIndex + 1}`, // Intervalo_SRS
          values: [[newInterval]],
        });
        dataToUpdate.push({
          range: `Master_Palabras!G${rowIndex + 1}`, // Fecha_Proximo_Repaso
          values: [[nextReviewDate]],
        });
        dataToUpdate.push({
          range: `Master_Palabras!H${rowIndex + 1}`, // Factor_Facilidad
          values: [[newEaseFactor]],
        });
        dataToUpdate.push({
          range: `Master_Palabras!I${rowIndex + 1}`, // Fecha_Ultimo_Repaso
          values: [[today]],
        });

        const currentAciertos = parseInt(wordData.Total_Aciertos, 10) || 0;
        const currentErrores = parseInt(wordData.Total_Errores, 10) || 0;
        if (result.isCorrect) {
          dataToUpdate.push({
            range: `Master_Palabras!J${rowIndex + 1}`,
            values: [[currentAciertos + 1]],
          });
        } else {
          dataToUpdate.push({
            range: `Master_Palabras!K${rowIndex + 1}`,
            values: [[currentErrores + 1]],
          });
        }
      }
    });

    if (dataToUpdate.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          valueInputOption: "USER_ENTERED",
          data: dataToUpdate,
        },
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
