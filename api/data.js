// /api/data.js - CORREGIDO para hojas sin prefijo u_
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }
  const { userId } = req.query;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "UserID es requerido." });
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

    // CORRECCIÓN: Extraer ID limpio para buscar la hoja
    const cleanUserId = userId.startsWith("u_") ? userId.substring(2) : userId;
    console.log(
      `[DATA] Buscando datos para userId: ${userId}, hoja: ${cleanUserId}`
    );

    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const userSheetExists = spreadsheetInfo.data.sheets.some(
      (s) => s.properties.title === cleanUserId // ← Usar cleanUserId
    );

    if (!userSheetExists) {
      console.log(`[DATA] Hoja ${cleanUserId} no existe`);
      return res.status(200).json({ success: true, userExists: false });
    }

    const ranges = [
      `Master_Palabras!A:C`,
      `${cleanUserId}!A:I`, // ← Usar cleanUserId en el rango
      `Decks!A:E`,
    ];

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const [masterWordsRows, userProgressRows, decksRows] =
      response.data.valueRanges.map((r) => r.values || []);

    const masterWords = masterWordsRows
      .slice(1)
      .map((row) => ({ ID_Palabra: row[0], Inglés: row[1], Español: row[2] }));

    const userProgressHeaders = userProgressRows[0];
    const userProgressData = userProgressRows.slice(1);

    const combinedWords = userProgressData.map((progressRow) => {
      const progressObj = {};
      userProgressHeaders.forEach(
        (header, i) => (progressObj[header] = progressRow[i])
      );
      const masterWord = masterWords.find(
        (mw) => mw.ID_Palabra === progressObj.ID_Palabra
      );
      return { ...masterWord, ...progressObj };
    });

    // Procesar mazos del usuario (aquí SÍ usamos el userId completo para filtrar)
    const decksHeaders = decksRows[0];
    const decksData = decksRows.slice(1);
    const userDecks = decksData
      .filter((row) => row[decksHeaders.indexOf("UserID")] === userId) // ← Usar userId completo
      .map((deckRow) => {
        const deckObj = {};
        decksHeaders.forEach((header, i) => {
          deckObj[header] = deckRow[i];
        });
        if (!deckObj.Estado) {
          deckObj.Estado = "Activo";
        }
        return deckObj;
      });

    console.log(
      `[DATA] Datos cargados: ${combinedWords.length} palabras, ${userDecks.length} mazos`
    );

    res.status(200).json({
      success: true,
      userExists: true,
      data: {
        words: combinedWords,
        decks: userDecks,
      },
    });
  } catch (error) {
    console.error("Error al obtener datos de Google Sheet:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor al obtener datos.",
      error: error.message,
    });
  }
}
