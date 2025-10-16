// api/register-lead.js
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido" });
  }

  const { phone } = req.body;

  if (!phone) {
    return res
      .status(400)
      .json({ success: false, message: "Número de teléfono es requerido." });
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
    const sheetName = "Leads"; // Usaremos una nueva hoja llamada "Leads"
    const range = `${sheetName}!A:A`; // Asumimos que los teléfonos están en la columna A

    // 1. Verificar si la hoja "Leads" existe, si no, crearla.
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
      // Opcional: Añadir encabezado a la nueva hoja
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [["Telefono"]] },
      });
    }

    // 2. Obtener todos los números de teléfono existentes para verificar duplicados
    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const existingPhones = getRows.data.values
      ? getRows.data.values.flat()
      : [];

    // 3. Si el número no existe, lo agregamos.
    if (!existingPhones.includes(phone)) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:A`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[phone]],
        },
      });
    }

    // 4. Responder con éxito en cualquier caso (ya sea que se agregó o ya existía)
    return res
      .status(200)
      .json({ success: true, message: "Lead procesado exitosamente" });
  } catch (error) {
    console.error("Error al registrar el lead:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
}
