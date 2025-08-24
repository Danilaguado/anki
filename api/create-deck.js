// ===== /api/create-deck.js =====
// Propósito: Actualizar el estado de las palabras en Google Sheets cuando se crea un nuevo mazo.

import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { wordIds } = req.body;

  if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Se requiere un array de IDs de palabras.",
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

    // 1. Leer la hoja 'Master_Palabras' para encontrar las filas a actualizar
    const range = "Master_Palabras!A:E"; // ID_Palabra y Estado
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];
    const headers = rows[0];
    const idColIndex = headers.indexOf("ID_Palabra");
    const statusColIndex = headers.indexOf("Estado");

    if (idColIndex === -1 || statusColIndex === -1) {
      throw new Error(
        "No se encontraron las columnas 'ID_Palabra' o 'Estado'."
      );
    }

    // 2. Preparar las actualizaciones
    const dataToUpdate = [];
    rows.forEach((row, index) => {
      const wordId = row[idColIndex];
      // Si el ID de la palabra está en la lista que recibimos, preparamos su actualización
      if (wordIds.includes(wordId)) {
        dataToUpdate.push({
          range: `Master_Palabras!E${index + 1}`, // La columna 'E' es 'Estado'
          values: [["Aprendiendo"]],
        });
      }
    });

    // 3. Enviar las actualizaciones a Google Sheets en un solo lote
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
        message: `${dataToUpdate.length} palabras actualizadas a 'Aprendiendo'.`,
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
