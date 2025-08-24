import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { results, sentiment } = req.body;

  if (!results || results.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Results are required." });
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

    // 1. Añadir entradas al Log_Estudio
    const logRows = results.map((r) => [
      r.timestamp,
      "Respuesta Quiz",
      r.wordId,
      r.isCorrect ? "Correcto" : "Incorrecto",
      r.responseTime,
      sentiment,
      "", // Placeholder para dificultad
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Log_Estudio!A:G",
      valueInputOption: "USER_ENTERED",
      resource: { values: logRows },
    });

    // 2. Actualizar la hoja Master_Palabras (esto es más complejo y se puede optimizar)
    // Por ahora, solo es un placeholder para la lógica de actualización del SRS.
    // En una implementación real, se leería la hoja, se modificarían los valores y se volverían a escribir.

    res
      .status(200)
      .json({ success: true, message: "Resultados guardados exitosamente." });
  } catch (error) {
    console.error("Error al actualizar Google Sheet:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error del servidor al guardar los resultados.",
        error: error.message,
      });
  }
}
