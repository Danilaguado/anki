import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    const ranges = ["Configuración!A:B", "Master_Palabras!A:L"];
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const configData = response.data.valueRanges[0].values;
    const wordsData = response.data.valueRanges[1].values;

    // Procesar configuración
    const config = configData.slice(1).reduce((acc, row) => {
      acc[row[0]] = row[1];
      return acc;
    }, {});

    // Procesar palabras
    const wordHeaders = wordsData[0];
    const words = wordsData.slice(1).map((row) => {
      const word = {};
      wordHeaders.forEach((header, index) => {
        word[header] = row[index];
      });
      return word;
    });

    res.status(200).json({ success: true, config, words });
  } catch (error) {
    console.error("Error al obtener datos de Google Sheet:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error del servidor al obtener datos.",
        error: error.message,
      });
  }
}
