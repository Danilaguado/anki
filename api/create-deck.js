// ===== /api/create-deck.js =====
// Ahora crea una entrada en la nueva hoja 'Decks'.

import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }
  const { wordIds, deckSize } = req.body;
  if (!wordIds || !deckSize) {
    return res
      .status(400)
      .json({
        success: false,
        message: "IDs de palabras y tamaño del mazo son requeridos.",
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

    // 1. Obtener el próximo ID de Mazo desde 'Configuración'
    const configRange = "Configuración!B2";
    const configResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: configRange,
    });
    const nextDeckIdNum = parseInt(configResponse.data.values[0][0], 10);
    const newDeckId = `Mazo-${nextDeckIdNum}`;

    // 2. Crear la nueva fila para la hoja 'Decks'
    const newDeckRow = [
      newDeckId,
      new Date().toISOString(),
      deckSize,
      wordIds.join(","),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Decks!A:D",
      valueInputOption: "USER_ENTERED",
      resource: { values: [newDeckRow] },
    });

    // 3. Actualizar el estado de las palabras en 'Master_Palabras'
    const masterRange = "Master_Palabras!A:D";
    const masterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: masterRange,
    });
    const masterRows = masterResponse.data.values || [];
    const dataToUpdate = [];
    masterRows.forEach((row, index) => {
      if (wordIds.includes(row[0])) {
        // Compara con ID_Palabra en columna A
        dataToUpdate.push({
          range: `Master_Palabras!D${index + 1}`,
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

    // 4. Incrementar el 'Próximo ID de Mazo' en 'Configuración'
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: configRange,
      valueInputOption: "USER_ENTERED",
      resource: { values: [[nextDeckIdNum + 1]] },
    });

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
