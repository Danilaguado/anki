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

    // ========== BUSCAR SI EL NÚMERO YA EXISTE ==========
    let existingRow = null;
    let existingRowIndex = -1;

    for (let i = rows.length - 1; i > 0; i--) {
      const row = rows[i];
      if (row[phoneColumnIndex] === phone) {
        existingRow = row;
        existingRowIndex = i;
        break;
      }
    }

    // ========== APLICAR LÓGICA ==========

    // Caso 1: Existe número SIN nombre/correo (lead abierto)
    if (existingRow && (!existingRow[1] || !existingRow[2])) {
      console.log(
        `✅ Lead abierto encontrado para ${phone}. Se trabajará sobre esta fila.`
      );
      return res.status(200).json({
        success: true,
        message: "Lead abierto ya existente.",
        phone: phone,
      });
    }

    // Caso 2: Existe número CON nombre/correo (ya compró)
    if (existingRow && existingRow[1] && existingRow[2]) {
      console.log(
        `📋 Número ${phone} ya tiene una compra. Creando nueva fila...`
      );
      const newRow = [
        new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" }),
        "", // Nombre vacío
        "", // Correo vacío
        "", // Referencia vacía
        phone, // Teléfono
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        resource: { values: [newRow] },
      });

      return res.status(200).json({
        success: true,
        message: "Nuevo lead registrado (número con compra anterior).",
        phone: phone,
      });
    }

    // Caso 3: No existe el número
    console.log(`🆕 Número ${phone} no existe. Registrando nuevo lead...`);
    const newRow = [
      new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" }),
      "", // Nombre vacío
      "", // Correo vacío
      "", // Referencia vacía
      phone, // Teléfono
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [newRow] },
    });

    return res.status(200).json({
      success: true,
      message: "Nuevo lead registrado exitosamente",
      phone: phone,
    });
  } catch (error) {
    console.error("Error en /api/register-lead:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
}
