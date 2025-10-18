import { google } from "googleapis";
import nodemailer from "nodemailer";

// --- Funciones de notificación por correo ---
async function notifyAdminRejectedPayment(transporter, data) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const attachments = [];
  if (data.comprobanteBase64) {
    const base64Data = data.comprobanteBase64.replace(
      /^data:image\/\w+;base64,/,
      ""
    );
    attachments.push({
      filename: `comprobante_${data.nombre.replace(/\s/g, "_")}.png`,
      content: base64Data,
      encoding: "base64",
    });
  }

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `❌ Pago Rechazado - ${data.nombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="background-color: #ef4444; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">❌ Pago Rechazado - Verificación Manual Requerida</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Detalles del intento de pago</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Fecha:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(
              data.fecha
            ).toLocaleString("es-ES", {
              timeZone: "America/Caracas",
            })}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Nombre:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
              data.nombre
            }</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
              data.correo
            }</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Producto:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
              data.producto
            }</td></tr>
            <tr><td style="padding: 12px; font-weight: 600;">Estado:</td><td style="padding: 12px;"><span style="background-color: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600;">RECHAZADO</span></td></tr>
          </table>
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #991b1b; margin: 0 0 8px 0;">Razón del rechazo:</h3>
            <pre style="color: #7f1d1d; font-family: monospace; white-space: pre-wrap; margin: 0;">${JSON.stringify(
              data.validationError,
              null,
              2
            )}</pre>
          </div>
        </div>
      </div>`,
    attachments: attachments,
  };
  await transporter.sendMail(adminMailOptions);
}

async function notifyAdminApprovedPayment(transporter, data) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `✅ Pago Aprobado - ${data.nombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="background-color: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">✅ Pago Aprobado Automáticamente</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Detalles del pago</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Fecha:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(
              data.fecha
            ).toLocaleString("es-ES", {
              timeZone: "America/Caracas",
            })}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Nombre:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
              data.nombre
            }</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
              data.correo
            }</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Teléfono:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
              data.phone || "N/A"
            }</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Producto:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
              data.producto
            }</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Referencia:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
              data.referencia || "N/A"
            }</td></tr>
          </table>
        </div>
      </div>`,
  };
  await transporter.sendMail(adminMailOptions);
}

// --- Handler Principal ---
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido" });
  }

  const {
    nombre,
    correo,
    referencia,
    fecha,
    producto,
    validationError,
    comprobanteBase64,
    montoEsperado,
    isRejected,
    phone,
  } = req.body;

  console.log("📞 Teléfono recibido en submit-payment:", phone);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });

  if (isRejected) {
    try {
      await notifyAdminRejectedPayment(transporter, req.body);
      return res
        .status(200)
        .json({ success: true, message: "Notificación de rechazo enviada." });
    } catch (error) {
      console.error("Error al notificar pago rechazado:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error al notificar rechazo." });
    }
  }

  if (!nombre || !correo) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos (nombre o correo).",
    });
  }

  if (!producto) {
    return res
      .status(400)
      .json({ success: false, message: "No se especificó el producto." });
  }

  if (!phone) {
    console.error("❌ No se recibió el teléfono");
    return res.status(400).json({
      success: false,
      message:
        "No se encontró el número de teléfono. Por favor, intenta de nuevo.",
    });
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
    const range = `${sheetName}!A:G`;

    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = getRows.data.values || [];

    // ====== VERIFICAR SI LA HOJA EXISTE ======
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
        range: `${sheetName}!A1:G1`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [
            [
              "Fecha",
              "Nombre",
              "Correo",
              "Referencia (últimos 4)",
              "Teléfono",
              "Producto",
              "Monto",
            ],
          ],
        },
      });
    }

    // ====== BUSCAR LA FILA POR TELÉFONO ======
    let rowIndexToUpdate = -1;
    const phoneColumnIndex = 4; // Columna E

    console.log(`🔍 Buscando teléfono: ${phone}`);
    console.log(`📊 Total de filas: ${rows.length}`);

    for (let i = rows.length - 1; i > 0; i--) {
      const row = rows[i];
      const rowPhone = row[phoneColumnIndex];
      const rowName = row[1];
      const rowEmail = row[2];

      console.log(
        `Fila ${i}: Phone=${rowPhone}, Name=${rowName}, Email=${rowEmail}`
      );

      if (rowPhone === phone && (!rowName || !rowEmail)) {
        rowIndexToUpdate = i;
        console.log(
          `✅ Fila abierta encontrada en índice ${i} para teléfono ${phone}`
        );
        break;
      }
    }

    if (rowIndexToUpdate === -1) {
      console.error(
        `❌ No se encontró una fila abierta para el teléfono ${phone}`
      );
      return res.status(400).json({
        success: false,
        message:
          "No se encontró una fila abierta para este teléfono. Por favor, intenta de nuevo.",
      });
    }

    const referenciaUltimos4 = referencia ? referencia : "N/A";

    // ====== ACTUALIZAR LA FILA ======
    const rowData = [
      new Date(fecha).toLocaleString("es-ES", { timeZone: "America/Caracas" }),
      nombre,
      correo,
      referenciaUltimos4,
      phone,
      producto,
      montoEsperado || "",
    ];

    const updateRange = `${sheetName}!A${rowIndexToUpdate + 1}:G${
      rowIndexToUpdate + 1
    }`;

    console.log(`📝 Actualizando fila ${rowIndexToUpdate + 1}...`);
    console.log(`Datos a actualizar:`, rowData);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      resource: { values: [rowData] },
    });

    console.log(
      `✅ Fila ${
        rowIndexToUpdate + 1
      } actualizada exitosamente para teléfono ${phone}`
    );

    // ====== ENVIAR PDF ======
    const productoPDFMap = {
      "Descifrando a Eva": "descifrando-eva-cover.pdf",
      "El Músculo de la Voluntad": "musculo-voluntad-cover.pdf",
      "Habla y Conquista": "habla-conquista-cover.pdf",
      "El Ascenso": "el-ascenso-cover.pdf",
      "El Gambito del Rey": "gambito-rey-cover.pdf",
      "Trilogía Completa": [
        "descifrando-eva-cover.pdf",
        "musculo-voluntad-cover.pdf",
        "habla-conquista-cover.pdf",
      ],
    };

    const pdfFiles = productoPDFMap[producto];

    if (!pdfFiles) {
      console.error("Producto no encontrado:", producto);
      return res.status(400).json({
        success: false,
        message: `Producto "${producto}" no encontrado. No se puede enviar el material.`,
      });
    }

    const fs = require("fs");
    const path = require("path");

    const attachments = [];

    if (Array.isArray(pdfFiles)) {
      for (const pdf of pdfFiles) {
        const pdfPath = path.join(process.cwd(), "public", "assets", pdf);
        attachments.push({
          filename: pdf,
          path: pdfPath,
          contentType: "application/pdf",
        });
      }
    } else {
      const pdfPath = path.join(process.cwd(), "public", "assets", pdfFiles);
      attachments.push({
        filename: pdfFiles,
        path: pdfPath,
        contentType: "application/pdf",
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: "¡Bienvenido a Proyecto Kaizen! 🚀 - Tu material está aquí",
      attachments: attachments,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #d4af37; margin: 0; font-size: 32px; font-family: Georgia, serif;">Proyecto Kaizen</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Bienvenido a la comunidad</p>
          </div>
          <div style="padding: 40px 30px; color: #333333; line-height: 1.8;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${nombre}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Soy <strong>Daniel</strong>, fundador de Proyecto Kaizen junto a Nelson, y quiero darte la bienvenida personalmente.
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Gracias por confiar en nosotros y adquirir este material. Sabemos que le sacarás mucho provecho y que será una herramienta poderosa en tu camino de crecimiento personal.
            </p>
            <div style="padding: 24px 0; margin: 30px 0; text-align: center; background-color: #f0f9ff; border-radius: 8px;">
              <p style="margin: 0 0 16px 0; font-weight: 600; color: #1a1a1a; font-size: 17px;">
                📎 Tu material está adjunto en este correo
              </p>
              <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 13px;">
                💡 Revisa los archivos adjuntos al final de este email
              </p>
            </div>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Este libro es solo el inicio. La verdadera transformación sucede cuando aplicas lo aprendido y te rodeas de una comunidad que te impulsa hacia adelante.
            </p>
            <div style="background-color: #f0f9ff; border-left: 4px solid #d4af37; padding: 24px; margin: 30px 0; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-weight: 600; color: #1a1a1a; font-size: 17px;">
                📢 Únete a nuestra comunidad exclusiva
              </p>
              <div style="text-align: center;">
                <a href="https://whatsapp.com/channel/0029VbBQrlRF1YlOxxbDT30X" 
                   style="display: inline-block; background-color: #25D366; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style="vertical-align: middle; margin-right: 6px;" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
                  Unirme al Canal
                </a>
              </div>
            </div>
            <p style="font-size: 16px; margin-bottom: 8px;">
              Nos vemos del otro lado,
            </p>
            <p style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 30px 0;">
              Daniel<br>
              <span style="font-size: 14px; color: #666; font-weight: 400;">Fundador, Proyecto Kaizen</span>
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              © 2025 Proyecto Kaizen. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Notificar al admin
    await notifyAdminApprovedPayment(transporter, {
      nombre,
      correo,
      phone,
      fecha,
      producto,
      referencia: referenciaUltimos4,
    });

    return res
      .status(200)
      .json({ success: true, message: "Pago registrado exitosamente" });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar el pago",
      error: error.message,
    });
  }
}
