// ===== /api/decks/complete.js =====
// Propósito: Marcar un mazo como 'Completado' en la hoja de Google Sheets.

import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { userId, deckId } = req.body;

  if (!userId || !deckId) {
    return res
      .status(400)
      .json({ success: false, message: "UserID y DeckID son requeridos." });
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

    // 1. Encontrar la fila del mazo a actualizar
    const range = "Decks!A:E"; // ID_Mazo hasta Estado
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];
    const headers = rows[0];
    const idColIndex = headers.indexOf("ID_Mazo");
    const userColIndex = headers.indexOf("UserID");

    let rowIndexToUpdate = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIndex] === deckId && rows[i][userColIndex] === userId) {
        rowIndexToUpdate = i + 1; // +1 porque los rangos de Sheets son 1-based
        break;
      }
    }

    if (rowIndexToUpdate === -1) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Mazo no encontrado para este usuario.",
        });
    }

    // 2. Actualizar la columna 'Estado' a 'Completado'
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Decks!E${rowIndexToUpdate}`, // Columna E es 'Estado'
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [["Completado"]],
      },
    });

    res
      .status(200)
      .json({
        success: true,
        message: `Mazo ${deckId} marcado como completado.`,
      });
  } catch (error) {
    console.error("Error al completar el mazo:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error del servidor al completar el mazo.",
        error: error.message,
      });
  }
}
