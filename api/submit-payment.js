// api/submit-payment.js - VERSION MEJORADA
import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Rate limiting simple
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS = 5; // 5 requests por minuto

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || [];

  // Limpiar requests antiguos
  const recentRequests = userRequests.filter(
    (time) => now - time < RATE_LIMIT_WINDOW
  );

  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }

  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  return true;
}

// Validación mejorada de email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dangerousDomains = ["tempmail", "guerrillamail", "10minutemail"];

  if (!emailRegex.test(email)) return false;

  // Verificar dominios temporales comunes
  const domain = email.split("@")[1]?.toLowerCase();
  if (dangerousDomains.some((d) => domain?.includes(d))) {
    console.warn(`Email temporal detectado: ${email}`);
    return false;
  }

  return true;
}

// Sanitización de entrada
function sanitizeInput(str) {
  if (!str) return "";
  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .substring(0, 200); // Limitar longitud
}

// Generar un ID único para cada transacción
function generateTransactionId() {
  return crypto.randomBytes(16).toString("hex");
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "*"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  // Rate limiting
  const clientIp =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      message: "Demasiadas solicitudes. Por favor espere un momento.",
    });
  }

  // Validación de datos
  const { nombre, correo, referencia, fecha, producto } = req.body;

  // Sanitizar entradas
  const sanitizedData = {
    nombre: sanitizeInput(nombre),
    correo: sanitizeInput(correo),
    referencia: sanitizeInput(referencia),
    producto: sanitizeInput(producto),
  };

  // Validaciones
  if (!sanitizedData.nombre || sanitizedData.nombre.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Nombre inválido.",
    });
  }

  if (!sanitizedData.correo || !isValidEmail(sanitizedData.correo)) {
    return res.status(400).json({
      success: false,
      message: "Correo electrónico inválido.",
    });
  }

  // Lista de productos válidos
  const validProducts = [
    "El Código de la Conexión",
    "El Músculo de la Voluntad",
    "Habla, Corrige y Conquista",
    "El Ascenso",
    "Trilogía Completa",
  ];

  if (!validProducts.includes(sanitizedData.producto)) {
    return res.status(400).json({
      success: false,
      message: "Producto no válido.",
    });
  }

  // Generar ID de transacción
  const transactionId = generateTransactionId();

  try {
    // Google Sheets con retry logic
    let retries = 3;
    let sheetSuccess = false;

    while (retries > 0 && !sheetSuccess) {
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

        // Verificar si la hoja existe
        const spreadsheetInfo = await sheets.spreadsheets.get({
          spreadsheetId,
        });
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
            range: `${sheetName}!A1:F1`,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [
                [
                  "Fecha",
                  "Nombre",
                  "Correo",
                  "Referencia",
                  "Producto",
                  "TransactionID",
                ],
              ],
            },
          });
        }

        // Agregar nueva fila con todos los datos
        const newRow = [
          new Date(fecha).toLocaleString("es-ES", {
            timeZone: "America/Caracas",
          }),
          sanitizedData.nombre,
          sanitizedData.correo,
          sanitizedData.referencia || "N/A",
          sanitizedData.producto,
          transactionId,
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:F`,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [newRow],
          },
        });

        sheetSuccess = true;
      } catch (sheetError) {
        retries--;
        if (retries === 0) throw sheetError;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }

    // Determinar archivos PDF
    const productoPDFMap = {
      "El Código de la Conexión": "codigo-conexion-cover.pdf",
      "El Músculo de la Voluntad": "musculo-voluntad-cover.pdf",
      "Habla, Corrige y Conquista": "habla-corrige-conquista-cover.pdf",
      "El Ascenso": "el-ascenso-cover.pdf",
      "Trilogía Completa": [
        "codigo-conexion-cover.pdf",
        "musculo-voluntad-cover.pdf",
        "habla-corrige-conquista-cover.pdf",
      ],
    };

    const pdfFiles = productoPDFMap[sanitizedData.producto];
    const baseURL = process.env.BASE_URL || "https://es-kaizen.vercel.app";

    // Generar links con tokens temporales (opcional)
    let downloadLinksHTML = "";
    if (Array.isArray(pdfFiles)) {
      downloadLinksHTML = pdfFiles
        .map((pdf) => {
          const fileName = pdf.replace("-cover.pdf", "").replace(/-/g, " ");
          return `
            <a href="${baseURL}/assets/${pdf}" 
               download="${pdf}"
               style="display: inline-block; background-color: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 8px;">
              Descargar ${fileName}
            </a>
          `;
        })
        .join("<br>");
    } else {
      downloadLinksHTML = `
        <a href="${baseURL}/assets/${pdfFiles}" 
           download="${pdfFiles}"
           style="display: inline-block; background-color: #d4af37; color: #1a1a1a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Descargar mi eBook
        </a>
      `;
    }

    // Configurar transporter con mejor manejo de errores
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verificar conexión SMTP
    await transporter.verify();

    // Email al cliente
    const mailOptions = {
      from: `"Proyecto Kaizen" <${process.env.EMAIL_USER}>`,
      to: sanitizedData.correo,
      subject: "¡Bienvenido a Proyecto Kaizen! 🚀 - Tu material está aquí",
      html: `
        <!-- Tu HTML actual del email aquí -->
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- ... resto del HTML ... -->
          ${downloadLinksHTML}
          <!-- ... resto del HTML ... -->
          
          <div style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
            <p style="font-size: 11px; color: #666; margin: 0;">
              ID de transacción: ${transactionId}<br>
              Este email fue enviado a ${sanitizedData.correo}
            </p>
          </div>
        </div>
      `,
      // Headers adicionales para mejorar deliverability
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
    };

    await transporter.sendMail(mailOptions);

    // Email de notificación al administrador (opcional)
    if (process.env.ADMIN_EMAIL) {
      const adminMail = {
        from: `"Sistema Kaizen" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Nueva venta: ${sanitizedData.producto}`,
        html: `
          <h2>Nueva Venta Registrada</h2>
          <p><strong>Cliente:</strong> ${sanitizedData.nombre}</p>
          <p><strong>Email:</strong> ${sanitizedData.correo}</p>
          <p><strong>Producto:</strong> ${sanitizedData.producto}</p>
          <p><strong>Referencia:</strong> ${
            sanitizedData.referencia || "N/A"
          }</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>IP:</strong> ${clientIp}</p>
        `,
      };

      // No esperamos esta respuesta para no demorar al usuario
      transporter
        .sendMail(adminMail)
        .catch((err) => console.error("Error enviando email admin:", err));
    }

    // Log exitoso
    console.log(
      `✅ Pago procesado: ${transactionId} - ${sanitizedData.producto}`
    );

    return res.status(200).json({
      success: true,
      message: "Pago registrado exitosamente",
      transactionId: transactionId,
    });
  } catch (error) {
    console.error("❌ Error al procesar el pago:", error);

    // Logging más detallado para debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Stack trace:", error.stack);
    }

    // Determinar el tipo de error
    let statusCode = 500;
    let errorMessage = "Error al procesar el pago";

    if (error.message?.includes("auth")) {
      errorMessage = "Error de autenticación del servidor";
    } else if (error.message?.includes("network")) {
      errorMessage = "Error de conexión. Por favor intente nuevamente";
      statusCode = 503;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
}
