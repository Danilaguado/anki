// ===== /api/create-deck.js =====
// Ahora actualiza el estado 'Aprendiendo' en la hoja específica del usuario y registra el mazo.

import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }
  const { userId, wordIds } = req.body;
  if (!userId || !wordIds) {
    return res
      .status(400)
      .json({
        success: false,
        message: "UserID y IDs de palabras son requeridos.",
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

    const decksRange = "Decks!A:A";
    const decksResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: decksRange,
    });
    const nextDeckIdNum = (decksResponse.data.values || []).length;
    const newDeckId = `Mazo-${nextDeckIdNum}`;

    const newDeckRow = [
      newDeckId,
      userId,
      new Date().toISOString(),
      wordIds.length,
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Decks!A:D",
      valueInputOption: "USER_ENTERED",
      resource: { values: [newDeckRow] },
    });

    const userSheetRange = `${userId}!A:B`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: userSheetRange,
    });
    const rows = response.data.values || [];

    const dataToUpdate = [];
    rows.forEach((row, index) => {
      if (wordIds.includes(row[0])) {
        dataToUpdate.push({
          range: `${userId}!B${index + 1}`,
          values: [["Aprendiendo"]],
        });
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
        message: `${newDeckId} creado con ${wordIds.length} palabras.`,
      });
  } catch (error) {
    console.error("Error al crear el mazo:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error del servidor al crear el mazo.",
        error: error.message,
      });
  }
}
