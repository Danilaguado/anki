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
  } = req.body;

  if (!nombre || !correo) {
    return res.status(400).json({
      success: false,
      message: "Nombre y correo son requeridos.",
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
      subject: "¡Bienvenido a Proyecto Kaizen! 🚀 - Tu eBook está listo",
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

        <!-- Botón Descargar eBook -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="TU_ENLACE_DE_DESCARGA_AQUI" 
             style="display: inline-block; background-color: #4f46e5; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
            📚 Descargar mi eBook
          </a>
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
          <div style="display: flex; justify-content: center; gap: 20px; align-items: center;">
            <!-- Facebook -->
            <a href="TU_ENLACE_FACEBOOK" style="text-decoration: none;">
              <div style="width: 40px; height: 40px; background-color: #1877F2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
            </a>
            <!-- Instagram -->
            <a href="TU_ENLACE_INSTAGRAM" style="text-decoration: none;">
              <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
            </a>
            <!-- TikTok -->
            <a href="TU_ENLACE_TIKTOK" style="text-decoration: none;">
              <div style="width: 40px; height: 40px; background-color: #000000; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
            </a>
          </div>
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
