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
    const sheetName = "Pagos";

    // ========== VERIFICAR SI LA HOJA EXISTE ==========
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheetInfo.data.sheets.some(
      (s) => s.properties.title === sheetName
    );

    if (!sheetExists) {
      // Crear la hoja si no existe
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });

      // Agregar headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:E1`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [
            ["Fecha", "Nombre", "Correo", "Referencia (últimos 4)", "Teléfono"],
          ],
        },
      });
    }
    // ========== FIN VERIFICACIÓN DE HOJA ==========

    const range = `${sheetName}!A:E`;

    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = getRows.data.values || [];

    const phoneColumnIndex = 4; // Columna E

    // Busca si ya existe un "lead" abierto (teléfono registrado pero sin nombre/correo)
    const hasOpenLead = rows
      .slice(1) // Saltar header
      .some((row) => row[phoneColumnIndex] === phone && (!row[1] || !row[2]));

    if (hasOpenLead) {
      console.log(
        `Ya existe un lead abierto para ${phone}. No se agrega uno nuevo.`
      );
      // Si ya hay un lead abierto, permitir que el siguiente paso lo actualice
      return res
        .status(200)
        .json({ success: true, message: "Lead abierto ya existente." });
    }

    // Si no hay un lead abierto, crear una nueva fila
    console.log(`Creando nuevo lead para ${phone}.`);
    const newRow = [
      new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" }),
      "", // Nombre vacío
      "", // Correo vacío
      "", // Referencia vacía
      phone, // Teléfono
    ];

    // CORRECCIÓN: Agregar correctamente el array
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [newRow] }, // newRow ya es un array, no necesita doble array
    });

    return res
      .status(200)
      .json({ success: true, message: "Nuevo lead registrado exitosamente" });
  } catch (error) {
    console.error("Error en /api/register-lead:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message, // Para debug
    });
  }
}
