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
    const range = `${sheetName}!A:E`; // Asumimos que el teléfono está en la columna E

    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = getRows.data.values || [];

    // Si la hoja está vacía, crea los encabezados
    if (rows.length === 0) {
      const HEADERS = [
        "Fecha",
        "Nombre",
        "Correo",
        "Referencia (últimos 4)",
        "Telefono",
      ];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [HEADERS] },
      });
    }

    const phoneColumnIndex = 4; // Columna E

    // Busca si ya existe un "lead" abierto (teléfono registrado pero sin nombre/correo)
    const hasOpenLead = rows
      .slice(1)
      .some((row) => row[phoneColumnIndex] === phone && (!row[1] || !row[2]));

    if (hasOpenLead) {
      console.log(
        `Ya existe un lead abierto para ${phone}. No se agrega uno nuevo.`
      );
      // Si ya hay un lead abierto, no hacemos nada y permitimos que el siguiente paso lo actualice.
      return res
        .status(200)
        .json({ success: true, message: "Lead abierto ya existente." });
    }

    // Si no hay un lead abierto (ya sea porque no existe o porque todas sus compras están completas),
    // creamos una nueva fila de lead.
    console.log(`Creando nuevo lead para ${phone}.`);
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
      resource: { values: [[newRow]] },
    });

    return res
      .status(200)
      .json({ success: true, message: "Nuevo lead registrado exitosamente" });
  } catch (error) {
    console.error("Error en /api/register-lead:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error al procesar la solicitud" });
  }
}
