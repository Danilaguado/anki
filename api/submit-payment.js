// api/submit-payment.js
import { google } from "googleapis";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  const {
    nombre,
    correo,
    referencia, // Nueva referencia del OCR
    fecha,
    producto,
  } = req.body;

  if (!nombre || !correo) {
    return res.status(400).json({
      success: false,
      message: "Nombre y correo son requeridos.",
    });
  }

  if (!producto) {
    return res.status(400).json({
      success: false,
      message: "No se especificó el producto.",
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
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheetInfo.data.sheets.some(
      (s) => s.properties.title === sheetName
    );
    const productoPDFMap = {
      "El Código de la Conexión": "codigo-conexion-cover.pdf",
      "El Músculo de la Voluntad": "musculo-voluntad-cover.pdf",
      "Habla, Corrige y Conquista": "habla-corrige-conquista-cover.pdf",
      "Trilogía Completa": [
        "codigo-conexion-cover.pdf",
        "musculo-voluntad-cover.pdf",
        "habla-corrige-conquista-cover.pdf",
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

    // Configurar archivos adjuntos
    const attachments = Array.isArray(pdfFiles)
      ? pdfFiles.map((pdf) => ({
          filename: pdf,
          path: `./public/assets/${pdf}`,
        }))
      : [
          {
            filename: pdfFiles,
            path: `./public/assets/${pdfFiles}`,
          },
        ];

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:D1`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [["Fecha", "Nombre", "Correo", "Referencia (últimos 4)"]],
        },
      });
    }

    // Obtener últimos 4 dígitos de la referencia
    const referenciaUltimos4 = referencia ? referencia.slice(-4) : "N/A";

    const newRow = [
      new Date(fecha).toLocaleString("es-ES", {
        timeZone: "America/Caracas",
      }),
      nombre,
      correo,
      referenciaUltimos4,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:D`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [newRow],
      },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: "¡Bienvenido a Proyecto Kaizen! 🚀 - Tu material está aquí",
      attachments: attachments, // NUEVO - archivos adjuntos
      html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #d4af37; margin: 0; font-size: 32px; font-family: Georgia, serif;">Proyecto Kaizen</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Bienvenido a la comunidad</p>
      </div>

      <!-- Contenido -->
      <div style="padding: 40px 30px; color: #333333; line-height: 1.8;">
        
        <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${nombre}</strong>,</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Soy <strong>Daniel</strong>, fundador de Proyecto Kaizen junto a Nelson, y quiero darte la bienvenida personalmente.
        </p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Gracias por confiar en nosotros y adquirir este material. Sabemos que le sacarás mucho provecho y que será una herramienta poderosa en tu camino de crecimiento personal.
        </p>

        <!-- Aviso Material Adjunto -->
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46; font-size: 16px;">
            📎 Tu material está adjunto en este correo
          </p>
          <p style="margin: 0; font-size: 14px; color: #047857;">
            Busca el archivo PDF al final de este mensaje y descárgalo en tu dispositivo.
          </p>
        </div>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Este libro es solo el inicio. La verdadera transformación sucede cuando aplicas lo aprendido y te rodeas de una comunidad que te impulsa hacia adelante.
        </p>

        <!-- CTA Box Comunidad -->
        <div style="background-color: #f0f9ff; border-left: 4px solid #d4af37; padding: 24px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #1a1a1a; font-size: 17px;">
            📢 Únete a nuestra comunidad exclusiva
          </p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #555;">
            Accede a talleres, material premium y una red de personas comprometidas con crecer cada día.
          </p>
          <a href="https://whatsapp.com/channel/0029VbBQrlRF1YlOxxbDT30X" 
             style="display: inline-block; background-color: #25D366; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
            Unirme al Canal de WhatsApp →
          </a>
        </div>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Si tienes alguna pregunta o necesitas ayuda, estoy a tu disposición.
        </p>

        <!-- Botón Contacto -->
        <div style="text-align: center; margin: 20px 0 30px 0;">
          <a href="https://wa.me/5511958682671" 
             style="display: inline-block; background-color: #1a1a1a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            💬 Contáctame por WhatsApp
          </a>
        </div>

        <p style="font-size: 16px; margin-bottom: 8px;">
          Nos vemos del otro lado,
        </p>
        <p style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 30px 0;">
          Daniel<br>
          <span style="font-size: 14px; color: #666; font-weight: 400;">Fundador, Proyecto Kaizen</span>
        </p>

        <!-- Redes Sociales -->
        <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #666; font-weight: 600;">
            Síguenos en nuestras redes sociales
          </p>
          <table style="margin: 0 auto;">
            <tr>
              <td style="padding: 0 10px;">
                <a href="TU_ENLACE_FACEBOOK" style="text-decoration: none;">
                  <table style="width: 40px; height: 40px; background-color: #1877F2; border-radius: 50%;">
                    <tr>
                      <td style="text-align: center; vertical-align: middle;">
                        <span style="color: white; font-size: 20px; font-weight: bold;">f</span>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
              <td style="padding: 0 10px;">
                <a href="TU_ENLACE_INSTAGRAM" style="text-decoration: none;">
                  <table style="width: 40px; height: 40px; background: linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%); border-radius: 50%;">
                    <tr>
                      <td style="text-align: center; vertical-align: middle;">
                        <span style="color: white; font-size: 20px; font-weight: bold;">📷</span>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
              <td style="padding: 0 10px;">
                <a href="TU_ENLACE_TIKTOK" style="text-decoration: none;">
                  <table style="width: 40px; height: 40px; background-color: #000000; border-radius: 50%;">
                    <tr>
                      <td style="text-align: center; vertical-align: middle;">
                        <span style="color: white; font-size: 20px; font-weight: bold;">♪</span>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
          </table>
        </div>

      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 24px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          © 2025 Proyecto Kaizen. Todos los derechos reservados.
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
          Herramientas para una vida de crecimiento continuo.
        </p>
      </div>

    </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Pago registrado exitosamente",
    });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar el pago",
      error: error.message,
    });
  }
}
