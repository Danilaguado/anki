import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido" });
  }

  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res
      .status(400)
      .json({ success: false, message: "Correo electrónico es requerido." });
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
    const sheetName = "Newsletter";
    const range = `${sheetName}!A:B`;

    // Verificar si la hoja "Newsletter" existe, si no, crearla
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheetInfo.data.sheets.some(
      (s) => s.properties.title === sheetName
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:B1`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [["Fecha de Suscripción", "Correo Electrónico"]],
        },
      });
    }

    // Verificar si el correo ya existe
    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = getRows.data.values || [];
    const emailExists = rows.slice(1).some((row) => row[1] === email);

    if (emailExists) {
      return res
        .status(200)
        .json({ success: true, message: "Este correo ya está suscrito." });
    }

    // Agregar nueva fila
    const newRow = [
      new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" }),
      email,
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [newRow] },
    });

    return res
      .status(200)
      .json({ success: true, message: "Suscripción exitosa" });
  } catch (error) {
    console.error("Error en /api/subscribe-newsletter:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
}
