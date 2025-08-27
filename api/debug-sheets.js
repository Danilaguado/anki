// /api/debug-sheets.js - Herramienta de debugging para verificar actualizaciones
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Solo GET permitido" });
  }

  const { userId, action = "full_check" } = req.query;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "UserID es requerido" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    let debugInfo = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      checks: {},
      recommendations: [],
    };

    // 1. Verificar hoja del usuario
    try {
      const userSheetResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${userId}!A:I`,
      });

      const userRows = userSheetResponse.data.values || [];
      if (userRows.length > 1) {
        debugInfo.checks.userSheet = {
          status: "✅ EXISTE",
          totalWords: userRows.length - 1,
          headers: userRows[0],
          sampleData: userRows.slice(1, 4), // Primeras 3 palabras como muestra
          lastUpdated: "Verificar columnas de fechas",
        };

        // Verificar columnas críticas
        const headers = userRows[0];
        const requiredColumns = [
          "ID_Palabra",
          "Estado",
          "Intervalo_SRS",
          "Fecha_Proximo_Repaso",
          "Factor_Facilidad",
          "Total_Aciertos",
          "Total_Errores",
          "Total_Voz_Aciertos",
          "Total_Voz_Errores",
        ];

        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col)
        );
        if (missingColumns.length > 0) {
          debugInfo.checks.userSheet.issues = `❌ Faltan columnas: ${missingColumns.join(
            ", "
          )}`;
          debugInfo.recommendations.push(
            `Regenerar hoja ${userId} con estructura correcta`
          );
        }
      } else {
        debugInfo.checks.userSheet = {
          status: "❌ NO EXISTE O ESTÁ VACÍA",
          error: "Hoja del usuario no encontrada",
        };
        debugInfo.recommendations.push(
          `Ejecutar /api/setup para crear hoja ${userId}`
        );
      }
    } catch (error) {
      debugInfo.checks.userSheet = {
        status: "❌ ERROR AL ACCEDER",
        error: error.message,
      };
    }

    // 2. Verificar Study_Sessions
    try {
      const sessionsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Study_Sessions!A:K",
      });

      const sessionRows = sessionsResponse.data.values || [];
      const userSessions = sessionRows
        .slice(1)
        .filter((row) => row[2] === userId);

      debugInfo.checks.studySessions = {
        status: sessionRows.length > 1 ? "✅ EXISTE" : "❌ VACÍA",
        totalSessions: sessionRows.length - 1,
        userSessions: userSessions.length,
        headers: sessionRows[0],
        recentSessions: userSessions.slice(-3), // Últimas 3 sesiones del usuario
      };
    } catch (error) {
      debugInfo.checks.studySessions = {
        status: "❌ ERROR",
        error: error.message,
      };
    }

    // 3. Verificar Word_Statistics
    try {
      const statsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Word_Statistics!A:M",
      });

      const statsRows = statsResponse.data.values || [];
      const userStats = statsRows.slice(1).filter((row) => row[0] === userId);

      debugInfo.checks.wordStatistics = {
        status: statsRows.length > 1 ? "✅ EXISTE" : "❌ VACÍA",
        totalRecords: statsRows.length - 1,
        userRecords: userStats.length,
        headers: statsRows[0],
        sampleData: userStats.slice(0, 3),
      };
    } catch (error) {
      debugInfo.checks.wordStatistics = {
        status: "❌ ERROR",
        error: error.message,
      };
    }

    // 4. Verificar Card_Interactions
    try {
      const interactionsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Card_Interactions!A:K",
      });

      const interactionRows = interactionsResponse.data.values || [];
      const userInteractions = interactionRows
        .slice(1)
        .filter((row) => row[3] === userId);

      debugInfo.checks.cardInteractions = {
        status: interactionRows.length > 1 ? "✅ EXISTE" : "❌ VACÍA",
        totalInteractions: interactionRows.length - 1,
        userInteractions: userInteractions.length,
        headers: interactionRows[0],
        recentInteractions: userInteractions.slice(-5),
      };
    } catch (error) {
      debugInfo.checks.cardInteractions = {
        status: "❌ ERROR",
        error: error.message,
      };
    }

    // 5. Verificar Voice_Interactions
    try {
      const voiceResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Voice_Interactions!A:I",
      });

      const voiceRows = voiceResponse.data.values || [];
      const userVoiceInteractions = voiceRows
        .slice(1)
        .filter((row) => row[3] === userId);

      debugInfo.checks.voiceInteractions = {
        status:
          voiceRows.length > 1
            ? "✅ TIENE DATOS"
            : "⚠️ VACÍA (NORMAL SI NO HAY VOZ)",
        totalInteractions: voiceRows.length - 1,
        userInteractions: userVoiceInteractions.length,
        headers: voiceRows[0],
      };
    } catch (error) {
      debugInfo.checks.voiceInteractions = {
        status: "❌ ERROR",
        error: error.message,
      };
    }

    // 6. Verificar Daily_Activity
    try {
      const dailyResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Daily_Activity!A:J",
      });

      const dailyRows = dailyResponse.data.values || [];
      const userDaily = dailyRows.slice(1).filter((row) => row[0] === userId);

      debugInfo.checks.dailyActivity = {
        status: dailyRows.length > 1 ? "✅ EXISTE" : "❌ VACÍA",
        totalRecords: dailyRows.length - 1,
        userRecords: userDaily.length,
        headers: dailyRows[0],
        recentActivity: userDaily.slice(-5),
      };
    } catch (error) {
      debugInfo.checks.dailyActivity = {
        status: "❌ ERROR",
        error: error.message,
      };
    }

    // 7. Verificar Practice_Schedule
    try {
      const scheduleResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Practice_Schedule!A:G",
      });

      const scheduleRows = scheduleResponse.data.values || [];
      const userSchedule = scheduleRows
        .slice(1)
        .filter((row) => row[0] === userId);

      debugInfo.checks.practiceSchedule = {
        status:
          scheduleRows.length > 1 ? "✅ EXISTE" : "⚠️ VACÍA (NORMAL AL INICIO)",
        totalRecords: scheduleRows.length - 1,
        userRecords: userSchedule.length,
        headers: scheduleRows[0],
        pendingReviews: userSchedule.filter((row) => row[4] === "Pendiente")
          .length,
      };
    } catch (error) {
      debugInfo.checks.practiceSchedule = {
        status: "❌ ERROR",
        error: error.message,
      };
    }

    // 8. Verificar User_Settings
    try {
      const settingsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "User_Settings!A:G",
      });

      const settingsRows = settingsResponse.data.values || [];
      const userSettings = settingsRows
        .slice(1)
        .filter((row) => row[0] === userId);

      debugInfo.checks.userSettings = {
        status: userSettings.length > 0 ? "✅ EXISTE" : "❌ NO CONFIGURADO",
        userHasSettings: userSettings.length > 0,
        headers: settingsRows[0],
        settings: userSettings[0] || null,
      };
    } catch (error) {
      debugInfo.checks.userSettings = {
        status: "❌ ERROR",
        error: error.message,
      };
    }

    // 9. Generar resumen y recomendaciones
    const workingSheets = Object.values(debugInfo.checks).filter((check) =>
      check.status.includes("✅")
    ).length;
    const totalSheets = Object.keys(debugInfo.checks).length;

    debugInfo.summary = {
      overallHealth: `${workingSheets}/${totalSheets} hojas funcionando correctamente`,
      criticalIssues: debugInfo.recommendations.length,
      readyForPractice:
        debugInfo.checks.userSheet?.status?.includes("✅") &&
        debugInfo.checks.studySessions?.status?.includes("✅"),
    };

    // Recomendaciones adicionales basadas en el estado
    if (!debugInfo.checks.userSheet?.status?.includes("✅")) {
      debugInfo.recommendations.push(
        "🚨 CRÍTICO: Recrear hoja del usuario con /api/setup"
      );
    }

    if (debugInfo.checks.studySessions?.userSessions === 0) {
      debugInfo.recommendations.push(
        "ℹ️ INFO: Usuario aún no ha practicado ningún mazo"
      );
    }

    if (debugInfo.checks.wordStatistics?.userRecords === 0) {
      debugInfo.recommendations.push(
        "⚠️ ADVERTENCIA: Sin estadísticas de palabras - verificar tracking"
      );
    }

    // 10. Acción específica si se solicita
    if (action === "test_update") {
      debugInfo.testUpdate = await testUserSheetUpdate(
        sheets,
        spreadsheetId,
        userId
      );
    }

    return res.status(200).json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    console.error("Error en debug-sheets:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar hojas",
      error: error.message,
    });
  }
}

// Función para probar una actualización real
async function testUserSheetUpdate(sheets, spreadsheetId, userId) {
  try {
    const testResult = {
      timestamp: new Date().toISOString(),
      testType: "Actualización de prueba",
      steps: [],
    };

    // 1. Leer datos actuales
    testResult.steps.push("1. Leyendo datos actuales...");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${userId}!A:I`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      testResult.steps.push("❌ No hay datos para probar");
      return testResult;
    }

    // 2. Encontrar primera palabra para probar
    const headers = rows[0];
    const firstWordRow = rows[1];
    const wordId = firstWordRow[0];
    const aciertosIndex = headers.indexOf("Total_Aciertos");

    if (aciertosIndex === -1) {
      testResult.steps.push("❌ Columna Total_Aciertos no encontrada");
      return testResult;
    }

    const currentAciertos = parseInt(firstWordRow[aciertosIndex] || 0);
    testResult.steps.push(
      `2. Palabra de prueba: ${wordId}, Aciertos actuales: ${currentAciertos}`
    );

    // 3. Intentar actualizar
    const newAciertos = currentAciertos + 1;
    const updateRange = `${userId}!${String.fromCharCode(
      "A".charCodeAt(0) + aciertosIndex
    )}2`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      resource: { values: [[newAciertos]] },
    });

    testResult.steps.push(
      `3. ✅ Actualización exitosa: ${currentAciertos} → ${newAciertos}`
    );

    // 4. Verificar cambio
    const verifyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: updateRange,
    });

    const updatedValue = parseInt(verifyResponse.data.values[0][0]);
    testResult.steps.push(`4. Verificación: Valor actual = ${updatedValue}`);

    // 5. Restaurar valor original
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      resource: { values: [[currentAciertos]] },
    });

    testResult.steps.push(`5. ✅ Valor restaurado a: ${currentAciertos}`);
    testResult.success = true;
    testResult.message =
      "Prueba de actualización EXITOSA - Las hojas están funcionando correctamente";

    return testResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message:
        "❌ FALLO en prueba de actualización - Hay problemas de conectividad o permisos",
    };
  }
}
