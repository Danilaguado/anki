// ===== /api/setup.js =====
// Reescrito para crear una hoja nueva por cada usuario.

import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }
  const { email, masterWords, userId } = req.body;
  if (!email || !masterWords || !userId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Email, words, and userId are required.",
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

    // 1. Crear una nueva hoja con el nombre del UserID
    const addSheetRequest = { addSheet: { properties: { title: userId } } };
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: { requests: [addSheetRequest] },
    });

    // 2. Preparar los datos para la nueva hoja del usuario
    const userSheetHeaders = [
      "ID_Palabra",
      "Estado",
      "Intervalo_SRS",
      "Fecha_Proximo_Repaso",
      "Factor_Facilidad",
      "Total_Aciertos",
      "Total_Errores",
    ];
    const userSheetRows = masterWords.map((word) => [
      word.id,
      word.status,
      1,
      null,
      2.5,
      0,
      0,
    ]);

    // 3. Escribir los encabezados y las 1000 filas de estado inicial en la hoja del usuario
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${userId}!A1`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [userSheetHeaders, ...userSheetRows],
      },
    });

    // 4. (Opcional) Registrar al usuario en una hoja 'Users' para referencia
    const userRow = [userId, email, new Date().toISOString()];
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Users!A:C",
        valueInputOption: "USER_ENTERED",
        resource: { values: [userRow] },
      });
    } catch (e) {
      console.log("No 'Users' sheet found, skipping user registration log.");
    }

    res
      .status(200)
      .json({
        success: true,
        message: `Hoja para el usuario ${userId} creada exitosamente.`,
      });
  } catch (error) {
    console.error(
      `Error al configurar la hoja para el usuario ${userId}:`,
      error
    );
    res
      .status(500)
      .json({
        success: false,
        message: "Error del servidor al configurar la hoja del usuario.",
        error: error.message,
      });
  }
}
