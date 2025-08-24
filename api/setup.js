// ===== /api/setup.js =====
// Reescrito para crear TODAS las hojas necesarias, incluyendo la hoja personal del usuario.

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

    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheetInfo.data.sheets.map(
      (s) => s.properties.title
    );

    // 1. Definir todas las hojas, incluyendo la del usuario
    const sheetsToEnsure = [
      {
        title: "Master_Palabras",
        headers: ["ID_Palabra", "Inglés", "Español"],
      },
      {
        title: "Decks",
        headers: ["ID_Mazo", "UserID", "Fecha_Creacion", "Cantidad_Palabras"],
      },
      {
        title: "Study_Sessions",
        headers: [
          "ID_Sesion",
          "ID_Mazo",
          "UserID",
          "Timestamp_Inicio",
          "Timestamp_Fin",
          "Duracion_Total_ms",
          "Estado_Final",
          "Sentimiento_Reportado",
        ],
      },
      {
        title: "Log_Estudio",
        headers: [
          "ID_Sesion",
          "ID_Palabra",
          "Resultado",
          "Tiempo_Respuesta_ms",
          "SRS_Feedback",
        ],
      },
      { title: "Users", headers: ["UserID", "Email", "Fecha_Creacion"] },
      {
        title: userId,
        headers: [
          "ID_Palabra",
          "Estado",
          "Intervalo_SRS",
          "Fecha_Proximo_Repaso",
          "Factor_Facilidad",
          "Total_Aciertos",
          "Total_Errores",
        ],
      },
    ];

    const newSheetsToCreate = sheetsToEnsure.filter(
      (s) => !existingSheets.includes(s.title)
    );
    if (newSheetsToCreate.length > 0) {
      const requests = newSheetsToCreate.map((sheet) => ({
        addSheet: { properties: { title: sheet.title } },
      }));
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests },
      });

      const dataToWrite = newSheetsToCreate.map((sheet) => ({
        range: `${sheet.title}!A1`,
        values: [sheet.headers],
      }));
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: { valueInputOption: "USER_ENTERED", data: dataToWrite },
      });
    }

    // 2. Poblar las tablas con los datos iniciales
    if (!existingSheets.includes("Master_Palabras")) {
      const masterWordsRows = masterWords.map((word) => [
        word.id,
        word.english,
        word.spanish,
      ]);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Master_Palabras!A:C",
        valueInputOption: "USER_ENTERED",
        resource: { values: masterWordsRows },
      });
    }

    const userRow = [userId, email, new Date().toISOString()];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Users!A:C",
      valueInputOption: "USER_ENTERED",
      resource: { values: [userRow] },
    });

    const userSheetRows = masterWords.map((word) => [
      word.id,
      word.status,
      1,
      null,
      2.5,
      0,
      0,
    ]);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${userId}!A:G`,
      valueInputOption: "USER_ENTERED",
      resource: { values: userSheetRows },
    });

    res
      .status(200)
      .json({
        success: true,
        message: "Google Sheet configurado exitosamente.",
      });
  } catch (error) {
    console.error("Error al configurar Google Sheet:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error del servidor al configurar la hoja de cálculo.",
        error: error.message,
      });
  }
}
