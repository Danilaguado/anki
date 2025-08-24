// ===== /api/setup.js =====
// Reescrito para crear la nueva estructura de hojas normalizada.

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

    // 1. Definir y crear las hojas si no existen
    const sheetsToEnsure = [
      { title: "Users", headers: ["UserID", "Email", "Fecha_Creacion"] },
      {
        title: "Master_Palabras",
        headers: ["ID_Palabra", "Inglés", "Español"],
      },
      {
        title: "User_Words",
        headers: [
          "UserID",
          "ID_Palabra",
          "Estado",
          "Intervalo_SRS",
          "Fecha_Proximo_Repaso",
          "Factor_Facilidad",
        ],
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
    ];

    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheetInfo.data.sheets.map(
      (s) => s.properties.title
    );
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
      // Escribir encabezados en las hojas recién creadas
      const dataToWrite = newSheetsToCreate.map((sheet) => ({
        range: `${sheet.title}!A1`,
        values: [sheet.headers],
      }));
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: { valueInputOption: "USER_ENTERED", data: dataToWrite },
      });
    }

    // 2. Poblar las tablas
    const userRow = [userId, email, new Date().toISOString()];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Users!A:C",
      valueInputOption: "USER_ENTERED",
      resource: { values: [userRow] },
    });

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

    const userWordsRows = masterWords.map((word) => [
      userId,
      word.id,
      word.status,
      1,
      null,
      2.5,
    ]);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "User_Words!A:F",
      valueInputOption: "USER_ENTERED",
      resource: { values: userWordsRows },
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
