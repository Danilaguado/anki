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

    // 1. Comprobar si el usuario existe
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Users!A:A",
    });
    const userExists = (usersResponse.data.values || [])
      .flat()
      .includes(userId);
    if (!userExists) {
      return res.status(200).json({ success: true, userExists: false });
    }

    // 2. Obtener todos los datos relevantes
    const ranges = [
      "Master_Palabras!A:C",
      "User_Words!A:H",
      "Decks!A:D",
      "Study_Sessions!A:H",
    ];
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const [masterWordsRows, userWordsRows, decksRows, sessionsRows] =
      response.data.valueRanges.map((r) => r.values || []);

    // 3. Combinar Master_Palabras con User_Words para el usuario actual
    const masterWords = masterWordsRows
      .slice(1)
      .map((row) => ({ ID_Palabra: row[0], Inglés: row[1], Español: row[2] }));
    const userWordsData = userWordsRows
      .slice(1)
      .filter((row) => row[0] === userId);

    const combinedWords = userWordsData.map((userWordRow) => {
      const masterWord = masterWords.find(
        (mw) => mw.ID_Palabra === userWordRow[1]
      );
      return {
        ...masterWord,
        UserID: userWordRow[0],
        Estado: userWordRow[2],
        Intervalo_SRS: userWordRow[3],
        Fecha_Proximo_Repaso: userWordRow[4],
        Factor_Facilidad: userWordRow[5],
        Total_Aciertos: userWordRow[6],
        Total_Errores: userWordRow[7],
      };
    });

    const decks = decksRows
      .slice(1)
      .filter((row) => row[1] === userId)
      .map((row) => ({
        ID_Mazo: row[0],
        Fecha_Creacion: row[2],
        Cantidad_Palabras: row[3],
      }));
    const sessions = sessionsRows
      .slice(1)
      .filter((row) => row[2] === userId)
      .map((row) => ({
        ID_Sesion: row[0],
        ID_Mazo: row[1],
        Timestamp_Inicio: row[3],
      }));

    res
      .status(200)
      .json({
        success: true,
        userExists: true,
        data: { words: combinedWords, decks, sessions },
      });
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
