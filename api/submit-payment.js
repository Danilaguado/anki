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

  const { nombre, correo, referencia, fecha, producto } = req.body;

  if (!nombre || !correo) {
    return res.status(400).json({
      success: false,
      message: "Nombre y correo son requeridos.",
    });
  }

  // Validar que el producto exista
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

    // Determinar qué PDF enviar basado en el producto
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

    // Si el producto no existe en el map, retornar error
    if (!pdfFiles) {
      console.error("Producto no encontrado:", producto);
      return res.status(400).json({
        success: false,
        message: `Producto "${producto}" no encontrado. No se puede enviar el material.`,
      });
    }

    // Generar URLs de descarga - CAMBIA POR TU DOMINIO DE VERCEL
    const baseURL = "https://es-kaizen.vercel.app";

    let downloadLinksHTML = "";
    if (Array.isArray(pdfFiles)) {
      // Para trilogía completa
      downloadLinksHTML = pdfFiles
        .map(
          (pdf) => `
        <a href="${baseURL}/assets/${pdf}" 
           download="${pdf}"
           style="display: inline-block; background-color: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 8px;">
          Descargar ${pdf.replace("-cover.pdf", "").replace(/-/g, " ")}
        </a>
      `
        )
        .join("<br>");
    } else {
      // Para un solo libro
      downloadLinksHTML = `
        <a href="${baseURL}/assets/${pdfFiles}" 
           download="${pdfFiles}"
           style="display: inline-block; background-color: #d4af37; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Descargar mi eBook
        </a>
      `;
    }

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
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #d4af37; margin: 0; font-size: 32px; font-family: Georgia, serif;">Proyecto Kaizen</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Bienvenido a la comunidad</p>
          </div>

          <!-- Contenido -->
          <div style="padding: 40px 30px; line-height: 1.8;">
            
            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${nombre}</strong>,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Soy <strong>Daniel</strong>, fundador de Proyecto Kaizen junto a Nelson, y quiero darte la bienvenida personalmente.
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Gracias por confiar en nosotros y adquirir este material. Sabemos que le sacarás mucho provecho y que será una herramienta poderosa en tu camino de crecimiento personal.
            </p>

            <div style="margin: 30px 0; text-align: center;">
              ${downloadLinksHTML}
            </div>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Este libro es solo el inicio. La verdadera transformación sucede cuando aplicas lo aprendido y te rodeas de una comunidad que te impulsa hacia adelante.
            </p>

            <!-- CTA Box Comunidad -->
            <div style="background-color: #f0f9ff; border-left: 4px solid #d4af37; padding: 24px; margin: 30px 0; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-weight: 600; color: #1a1a1a; font-size: 17px;">
                📢 Únete a nuestra comunidad exclusiva
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #1a1a1a;">
                Accede a talleres, material premium y una red de personas comprometidas con crecer cada día.
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

            <p style="font-size: 16px; margin-bottom: 20px;">
              Si tienes alguna pregunta o necesitas ayuda, estoy a tu disposición.
            </p>

            <!-- Botón Contacto -->
            <div style="text-align: center; margin: 20px 0 30px 0;">
              <a href="https://wa.me/5511958682671" 
                 style="display: inline-block; background-color: #52b157ff; color: #d3d5daff; padding: 6px 16px; text-decoration: none; border-radius: 4px; font-weight: 400; font-size: 13px; border: 1px solid #e5e7eb;">
                Contáctame por WhatsApp
              </a>
            </div>

            <p style="font-size: 16px; margin-bottom: 8px;">
              Nos vemos del otro lado,
            </p>
            <p style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 30px 0;">
              Daniel<br>
              <span style="font-size: 14px; color: #666; font-weight: 400;">Fundador, Proyecto Kaizen</span>
            </p>
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
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error al procesar el pago",
      error: error.message,
    });
  }
}
