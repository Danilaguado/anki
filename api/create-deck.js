import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }
  const { userId, wordIds, deckSize } = req.body;
  if (!userId || !wordIds || !deckSize) {
    return res
      .status(400)
      .json({
        success: false,
        message: "UserID, IDs de palabras y tamaño del mazo son requeridos.",
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

    const newDeckRow = [newDeckId, userId, new Date().toISOString(), deckSize];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Decks!A:D",
      valueInputOption: "USER_ENTERED",
      resource: { values: [newDeckRow] },
    });

    const userWordsRange = "User_Words!A:C";
    const userWordsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: userWordsRange,
    });
    const userWordsRows = userWordsResponse.data.values || [];
    const dataToUpdate = [];
    userWordsRows.forEach((row, index) => {
      if (row[0] === userId && wordIds.includes(row[1])) {
        dataToUpdate.push({
          range: `User_Words!C${index + 1}`,
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
        message: `${newDeckId} creado con ${deckSize} palabras.`,
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
