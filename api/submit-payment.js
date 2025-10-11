// api/submit-payment.js
import { google } from "googleapis";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  const { nombre, correo, referencia, fecha, banco, telefono, cedula } =
    req.body;

  // Validaciones
  if (!nombre || !correo || !referencia) {
    return res.status(400).json({
      success: false,
      message: "Todos los campos son requeridos",
    });
  }

  if (referencia.length !== 4) {
    return res.status(400).json({
      success: false,
      message: "La referencia debe tener 4 dígitos",
    });
  }

  try {
    // ====== 1. GUARDAR EN GOOGLE SHEETS ======
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Verificar si existe la hoja "Pagos", si no, crearla
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheetInfo.data.sheets.some(
      (s) => s.properties.title === "Pagos"
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: { title: "Pagos" },
              },
            },
          ],
        },
      });

      // Añadir encabezados
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Pagos!A1:G1",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [
            [
              "Fecha",
              "Nombre",
              "Correo",
              "Banco",
              "Teléfono",
              "Cédula",
              "Referencia (últimos 4)",
            ],
          ],
        },
      });
    }

    // Insertar datos del pago
    const newRow = [
      new Date(fecha).toLocaleString("es-ES", {
        timeZone: "America/Caracas",
      }),
      nombre,
      correo,
      banco,
      telefono,
      cedula,
      referencia,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Pagos!A:G",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [newRow],
      },
    });

    console.log("✅ Pago registrado en Google Sheets");

    // ====== 2. ENVIAR CORREO ======
    // Configurar transporter de nodemailer
    // IMPORTANTE: Debes configurar las variables de entorno para el correo
    const transporter = nodemailer.createTransport({
      service: "gmail", // o el servicio que uses
      auth: {
        user: process.env.EMAIL_USER, // Tu correo
        pass: process.env.EMAIL_PASSWORD, // Contraseña de aplicación
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "daniellaguado90@gmail.com",
      subject: `Nuevo Pago Registrado - ${nombre}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .info-row {
              display: flex;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .label {
              font-weight: bold;
              min-width: 150px;
              color: #666;
            }
            .value {
              color: #1a1a1a;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Nuevo Pago Registrado</h1>
            </div>
            <div class="content">
              <p>Se ha registrado un nuevo pago con los siguientes detalles:</p>
              
              <div class="info-row">
                <span class="label">Fecha:</span>
                <span class="value">${new Date(fecha).toLocaleString("es-ES", {
                  timeZone: "America/Caracas",
                })}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Nombre:</span>
                <span class="value">${nombre}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Correo:</span>
                <span class="value">${correo}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Banco:</span>
                <span class="value">${banco}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Teléfono:</span>
                <span class="value">${telefono}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Cédula:</span>
                <span class="value">${cedula}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Referencia (últimos 4):</span>
                <span class="value"><strong>${referencia}</strong></span>
              </div>
              
              <p style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6;">
                <strong>Nota:</strong> Este pago ha sido registrado automáticamente en Google Sheets.
              </p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Correo enviado exitosamente");

    // ====== 3. RESPONDER AL CLIENTE ======
    return res.status(200).json({
      success: true,
      message: "Pago registrado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error al procesar el pago:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar el pago",
      error: error.message,
    });
  }
}
