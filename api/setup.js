import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }
  const { email, masterWords } = req.body;
  if (!email || !masterWords || masterWords.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Email and words are required." });
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
    const sheetsToEnsure = [
      { title: "Dashboard", headers: [] },
      { title: "Configuración", headers: ["Clave", "Valor"] },
      {
        title: "Master_Palabras",
        headers: [
          "ID_Palabra",
          "Inglés",
          "Español",
          "ID_Mazo",
          "Estado",
          "Intervalo_SRS",
          "Fecha_Proximo_Repaso",
          "Factor_Facilidad",
          "Fecha_Ultimo_Repaso",
          "Total_Aciertos",
          "Total_Errores",
          "Tiempo_Respuesta_Promedio_ms",
        ],
      },
      {
        title: "Log_Estudio",
        headers: [
          "Timestamp",
          "Tipo_Evento",
          "ID_Palabra",
          "Resultado",
          "Tiempo_Respuesta_ms",
          "Sentimiento_Reportado",
          "Dificultad_Reportada",
        ],
      },
      {
        title: "Log_Decisiones",
        headers: [
          "Timestamp",
          "Decision",
          "Detalles",
          "Rendimiento_Previo_24h",
          "Ultimo_Sentimiento_Reportado",
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
    }
    if (!existingSheets.includes("Configuración")) {
      const dataToWrite = [];
      dataToWrite.push({
        range: "Configuración!A1",
        values: [
          ["Clave", "Valor"],
          ["Email de Usuario", email],
          ["Próximo ID de Mazo", 1],
        ],
      });
      const masterWordsHeaders = sheetsToEnsure.find(
        (s) => s.title === "Master_Palabras"
      ).headers;
      const masterWordsRows = masterWords.map((word) => [
        word.id,
        word.english,
        word.spanish,
        "",
        word.status,
        word.srsInterval,
        word.srsNextReview,
        word.srsEaseFactor,
        "",
        word.totalCorrect,
        word.totalIncorrect,
        "",
      ]);
      dataToWrite.push({
        range: "Master_Palabras!A1",
        values: [masterWordsHeaders, ...masterWordsRows],
      });
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: { valueInputOption: "USER_ENTERED", data: dataToWrite },
      });
    }
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
