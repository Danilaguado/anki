// ===== /api/debug-verify.js - Script de Verificación =====
// Úsalo temporalmente para verificar que todo esté funcionando
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Solo GET permitido" });
  }

  try {
    // 1. Verificar variables de entorno
    const requiredEnvs = [
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_SPREADSHEET_ID",
    ];

    const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);
    if (missingEnvs.length > 0) {
      return res.status(500).json({
        success: false,
        message: "Variables de entorno faltantes",
        missing: missingEnvs,
      });
    }

    // 2. Verificar conexión con Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // 3. Obtener información de la hoja
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheetInfo.data.sheets.map(
      (s) => s.properties.title
    );

    // 4. Verificar hojas requeridas
    const requiredSheets = [
      "Master_Palabras",
      "Study_Sessions",
      "Card_Interactions",
      "Voice_Interactions",
      "Word_Statistics",
      "Daily_Activity",
      "Practice_Schedule",
      "User_Settings",
      "Users",
      "Decks",
    ];

    const missingSheets = requiredSheets.filter(
      (sheet) => !existingSheets.includes(sheet)
    );

    // 5. Verificar estructura de Study_Sessions
    let studySessionsHeaders = [];
    try {
      const studySessionsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Study_Sessions!1:1",
      });
      studySessionsHeaders = studySessionsResponse.data.values?.[0] || [];
    } catch (error) {
      console.log("No se pudo obtener headers de Study_Sessions");
    }

    const expectedStudySessionsHeaders = [
      "ID_Sesion",
      "ID_Mazo",
      "UserID",
      "Timestamp_Inicio",
      "Timestamp_Fin",
      "Duracion_Total_ms",
      "Estado_Final",
      "Sentimiento_Reportado",
      "Palabras_Correctas",
      "Palabras_Totales",
      "Porcentaje_Acierto",
    ];

    // 6. Contar registros en hojas principales
    const counts = {};
    for (const sheetName of existingSheets) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:A`,
        });
        counts[sheetName] = (response.data.values?.length || 1) - 1; // -1 para excluir header
      } catch (error) {
        counts[sheetName] = 0;
      }
    }

    // 7. Verificar usuarios existentes
    let usersList = [];
    try {
      const usersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Users!A:C",
      });
      usersList = usersResponse.data.values?.slice(1) || []; // Excluir headers
    } catch (error) {
      console.log("No se pudo obtener lista de usuarios");
    }

    return res.status(200).json({
      success: true,
      verification: {
        environment: {
          hasAllEnvVars: missingEnvs.length === 0,
          missingEnvVars: missingEnvs,
        },
        sheets: {
          connected: true,
          spreadsheetTitle: spreadsheetInfo.data.properties.title,
          totalSheets: existingSheets.length,
          existingSheets: existingSheets,
          missingRequiredSheets: missingSheets,
          recordCounts: counts,
        },
        studySessions: {
          hasCorrectHeaders:
            studySessionsHeaders.length === expectedStudySessionsHeaders.length,
          currentHeaders: studySessionsHeaders,
          expectedHeaders: expectedStudySessionsHeaders,
          missingHeaders: expectedStudySessionsHeaders.filter(
            (h) => !studySessionsHeaders.includes(h)
          ),
        },
        users: {
          totalUsers: usersList.length,
          userIds: usersList.map((user) => user[0]),
        },
      },
      recommendations: generateRecommendations(
        missingSheets,
        studySessionsHeaders,
        expectedStudySessionsHeaders
      ),
    });
  } catch (error) {
    console.error("Error en verificación:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar configuración",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

function generateRecommendations(
  missingSheets,
  currentHeaders,
  expectedHeaders
) {
  const recommendations = [];

  if (missingSheets.length > 0) {
    recommendations.push({
      type: "CRÍTICO",
      message: `Faltan ${
        missingSheets.length
      } hojas requeridas: ${missingSheets.join(", ")}`,
      action:
        "Ejecuta el endpoint /api/setup con cualquier usuario para crear las hojas automáticamente.",
    });
  }

  if (currentHeaders.length !== expectedHeaders.length) {
    recommendations.push({
      type: "ADVERTENCIA",
      message: "La hoja Study_Sessions no tiene la estructura correcta",
      action: "Verifica que tenga 11 columnas con los headers correctos",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "ÉXITO",
      message:
        "✅ Configuración correcta. El sistema debería funcionar normalmente.",
      action: "Puedes eliminar este archivo debug-verify.js",
    });
  }

  return recommendations;
}

// ===== INSTRUCCIONES DE USO =====
// 1. Coloca este archivo en tu carpeta /api/
// 2. Ve a http://tu-dominio.com/api/debug-verify
// 3. Revisa la respuesta JSON para identificar problemas
// 4. Sigue las recomendaciones para solucionarlos
// 5. Una vez todo funcione, elimina este archivo por seguridad
