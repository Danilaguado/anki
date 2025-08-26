// /api/analytics.js - API para generar reportes y analytics
import { google } from "googleapis";

// --- Función Principal (Handler) ---
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { userId, reportType, dateFrom, dateTo } = req.query;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "UserID es requerido." });
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

    let analyticsData = {};

    // --- Selector de Reportes ---
    switch (reportType) {
      case "daily_summary":
        analyticsData = await generateDailySummary(
          sheets,
          spreadsheetId,
          userId,
          dateFrom,
          dateTo
        );
        break;

      case "word_performance":
        analyticsData = await generateWordPerformance(
          sheets,
          spreadsheetId,
          userId
        );
        break;

      case "study_patterns":
        analyticsData = await generateStudyPatterns(
          sheets,
          spreadsheetId,
          userId,
          dateFrom,
          dateTo
        );
        break;

      case "voice_analysis":
        analyticsData = await generateVoiceAnalysis(
          sheets,
          spreadsheetId,
          userId
        );
        break;

      case "complete_dashboard":
        analyticsData = await generateCompleteDashboard(
          sheets,
          spreadsheetId,
          userId
        );
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Tipo de reporte no válido." });
    }

    res.status(200).json({
      success: true,
      reportType,
      userId,
      generatedAt: new Date().toISOString(),
      data: analyticsData,
    });
  } catch (error) {
    console.error("Error generando analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor al generar analytics.",
      error: error.message,
    });
  }
}

// --- Funciones Generadoras de Reportes ---

async function generateDailySummary(
  sheets,
  spreadsheetId,
  userId,
  dateFrom,
  dateTo
) {
  const { data: dailyData } = await getFilteredData(
    sheets,
    spreadsheetId,
    "Daily_Activity!A:J",
    0,
    userId,
    1,
    dateFrom,
    dateTo
  );

  const totalSessions = dailyData.reduce(
    (sum, row) => sum + parseInt(row[4] || 0),
    0
  );
  const totalStudyTimeMs = dailyData.reduce(
    (sum, row) => sum + parseInt(row[5] || 0),
    0
  );
  const totalAccuracy = dailyData.reduce(
    (sum, row) => sum + parseFloat(row[9] || 0),
    0
  );
  const averageAccuracy =
    dailyData.length > 0 ? totalAccuracy / dailyData.length : 0;

  return {
    dailyRecords: dailyData,
    aggregated: {
      totalDays: dailyData.length,
      totalSessions,
      totalStudyTimeHours: Math.round(totalStudyTimeMs / 36000) / 100, // ms to hours
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      averageSessionsPerDay:
        dailyData.length > 0 ? totalSessions / dailyData.length : 0,
    },
  };
}

async function generateWordPerformance(sheets, spreadsheetId, userId) {
  // 1. Obtener datos de rendimiento de palabras para el usuario
  const { data: userStats } = await getFilteredData(
    sheets,
    spreadsheetId,
    "Word_Statistics!A:M",
    0,
    userId
  );

  // 2. Obtener la lista maestra de palabras para los detalles
  const { data: masterRows } = await getFilteredData(
    sheets,
    spreadsheetId,
    "Master_Palabras!A:C"
  );
  const masterWords = {};
  masterRows.forEach((row) => {
    masterWords[row[0]] = { english: row[1], spanish: row[2] };
  });

  // 3. Procesar y enriquecer los datos de cada palabra
  const wordPerformance = userStats.map((row) => {
    const wordId = row[1];
    const wordInfo = masterWords[wordId] || {};
    const textCorrect = parseInt(row[3] || 0);
    const textIncorrect = parseInt(row[4] || 0);
    const voiceCorrect = parseInt(row[5] || 0);
    const voiceIncorrect = parseInt(row[6] || 0);
    const totalText = textCorrect + textIncorrect;
    const totalVoice = voiceCorrect + voiceIncorrect;

    return {
      wordId,
      english: wordInfo.english,
      spanish: wordInfo.spanish,
      totalPracticed: parseInt(row[2] || 0),
      textCorrect,
      textIncorrect,
      voiceCorrect,
      voiceIncorrect,
      avgResponseTime: parseInt(row[9] || 0),
      avgDifficulty: parseFloat(row[10] || 0),
      lastPractice: row[11],
      nextReview: row[12],
      textAccuracy:
        totalText > 0 ? Math.round((textCorrect / totalText) * 100) : 0,
      voiceAccuracy:
        totalVoice > 0 ? Math.round((voiceCorrect / totalVoice) * 100) : 0,
    };
  });

  const today = new Date().toISOString().split("T")[0];
  const wordsNeedingReview = wordPerformance.filter(
    (w) => w.nextReview && w.nextReview <= today
  );

  return {
    allWords: wordPerformance,
    insights: {
      mostDifficult: [...wordPerformance]
        .sort((a, b) => b.avgDifficulty - a.avgDifficulty)
        .slice(0, 10),
      lowestAccuracy: [...wordPerformance]
        .sort((a, b) => a.textAccuracy - b.textAccuracy)
        .slice(0, 10),
      mostPracticed: [...wordPerformance]
        .sort((a, b) => b.totalPracticed - a.totalPracticed)
        .slice(0, 10),
      needsReview: wordsNeedingReview,
    },
    summary: {
      totalWords: wordPerformance.length,
      averageAccuracy:
        wordPerformance.length > 0
          ? Math.round(
              wordPerformance.reduce((sum, w) => sum + w.textAccuracy, 0) /
                wordPerformance.length
            )
          : 0,
      wordsNeedingReview: wordsNeedingReview.length,
    },
  };
}

async function generateStudyPatterns(
  sheets,
  spreadsheetId,
  userId,
  dateFrom,
  dateTo
) {
  const { data: userSessions } = await getFilteredData(
    sheets,
    spreadsheetId,
    "Study_Sessions!A:K",
    2,
    userId,
    3,
    dateFrom,
    dateTo
  );

  const sessionsByHour = {};
  const sessionsByDayOfWeek = {};

  userSessions.forEach((session) => {
    const startTime = new Date(session[3]);
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    sessionsByHour[hour] = (sessionsByHour[hour] || 0) + 1;
    sessionsByDayOfWeek[dayOfWeek] = (sessionsByDayOfWeek[dayOfWeek] || 0) + 1;
  });

  const { data: userScheduled } = await getFilteredData(
    sheets,
    spreadsheetId,
    "Practice_Schedule!A:G",
    0,
    userId
  );
  const completedScheduled = userScheduled.filter(
    (row) => row[4] === "Completada"
  ).length;
  const adherenceRate =
    userScheduled.length > 0
      ? Math.round((completedScheduled / userScheduled.length) * 100)
      : 0;

  return {
    patterns: { byHour: sessionsByHour, byDayOfWeek: sessionsByDayOfWeek },
    adherence: {
      totalScheduled: userScheduled.length,
      completed: completedScheduled,
      adherenceRate,
    },
    sessions: {
      total: userSessions.length,
      completed: userSessions.filter((s) => s[6] === "Completada").length,
      abandoned: userSessions.filter((s) => s[6] === "Abandonada").length,
    },
  };
}

async function generateVoiceAnalysis(sheets, spreadsheetId, userId) {
  const { data: userVoiceData } = await getFilteredData(
    sheets,
    spreadsheetId,
    "Voice_Interactions!A:I",
    3,
    userId
  );

  const { data: masterRows } = await getFilteredData(
    sheets,
    spreadsheetId,
    "Master_Palabras!A:C"
  );
  const masterWords = {};
  masterRows.forEach((row) => {
    masterWords[row[0]] = { english: row[1], spanish: row[2] };
  });

  const voiceAnalysisByWord = {};
  userVoiceData.forEach((row) => {
    const wordId = row[2];
    if (!voiceAnalysisByWord[wordId]) {
      voiceAnalysisByWord[wordId] = {
        wordId,
        english: masterWords[wordId]?.english || "N/A",
        totalAttempts: 0,
        correctAttempts: 0,
      };
    }
    voiceAnalysisByWord[wordId].totalAttempts++;
    if (row[7] === "TRUE" || row[7] === true) {
      voiceAnalysisByWord[wordId].correctAttempts++;
    }
  });

  const voiceStats = Object.values(voiceAnalysisByWord).map((word) => ({
    ...word,
    accuracy:
      word.totalAttempts > 0
        ? Math.round((word.correctAttempts / word.totalAttempts) * 100)
        : 0,
  }));

  const totalCorrect = userVoiceData.filter(
    (row) => row[7] === "TRUE" || row[7] === true
  ).length;

  return {
    overview: {
      totalVoiceAttempts: userVoiceData.length,
      totalCorrect,
      overallAccuracy:
        userVoiceData.length > 0
          ? Math.round((totalCorrect / userVoiceData.length) * 100)
          : 0,
    },
    wordAnalysis: voiceStats.sort((a, b) => b.totalAttempts - a.totalAttempts),
    insights: {
      mostDifficultWords: voiceStats
        .filter((w) => w.accuracy < 50)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 10),
    },
  };
}

async function generateCompleteDashboard(sheets, spreadsheetId, userId) {
  const [dailySummary, wordPerformance, studyPatterns, voiceAnalysis] =
    await Promise.all([
      generateDailySummary(sheets, spreadsheetId, userId, null, null),
      generateWordPerformance(sheets, spreadsheetId, userId),
      generateStudyPatterns(sheets, spreadsheetId, userId, null, null),
      generateVoiceAnalysis(sheets, spreadsheetId, userId),
    ]);

  const recommendations = generateRecommendations(
    dailySummary,
    wordPerformance,
    studyPatterns,
    voiceAnalysis
  );

  return {
    overview: {
      totalStudyDays: dailySummary.aggregated.totalDays,
      totalSessions: dailySummary.aggregated.totalSessions,
      totalStudyHours: dailySummary.aggregated.totalStudyTimeHours,
      overallAccuracy: wordPerformance.summary.averageAccuracy,
      voiceAccuracy: voiceAnalysis.overview.overallAccuracy,
      wordsInProgress: wordPerformance.summary.totalWords,
      adherenceRate: studyPatterns.adherence.adherenceRate,
    },
    priorities: {
      wordsNeedingReview: wordPerformance.insights.needsReview.slice(0, 5),
      difficultWords: wordPerformance.insights.mostDifficult.slice(0, 5),
      voiceImprovements: voiceAnalysis.insights.mostDifficultWords.slice(0, 5),
    },
    recommendations,
    detailedReports: {
      dailySummary,
      wordPerformance,
      studyPatterns,
      voiceAnalysis,
    },
  };
}

// --- Funciones de Soporte ---

function generateRecommendations(
  dailySummary,
  wordPerformance,
  studyPatterns,
  voiceAnalysis
) {
  const recommendations = [];

  if (studyPatterns.adherence.adherenceRate < 70) {
    recommendations.push({
      type: "adherence",
      priority: "high",
      title: "Mejora tu constancia",
      description: `Tu tasa de adherencia es del ${studyPatterns.adherence.adherenceRate}%. Intenta establecer recordatorios diarios para no perder el ritmo.`,
    });
  }

  if (wordPerformance.summary.averageAccuracy < 60) {
    recommendations.push({
      type: "performance",
      priority: "high",
      title: "Enfócate en palabras difíciles",
      description:
        "Tu precisión promedio es baja. Revisa la sección de palabras con menor exactitud y repásalas.",
    });
  }

  if (voiceAnalysis.overview.overallAccuracy < 50) {
    recommendations.push({
      type: "voice",
      priority: "medium",
      title: "Practica tu pronunciación",
      description:
        "Tu precisión de voz tiene oportunidad de mejora. Dedica tiempo a escuchar y repetir las palabras.",
    });
  }

  return recommendations;
}

async function getFilteredData(
  sheets,
  spreadsheetId,
  range,
  userIdColumn,
  userId,
  dateColumn = null,
  dateFrom = null,
  dateTo = null
) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  if (rows.length === 0) return { headers: [], data: [] };

  const headers = rows[0];
  let data = rows.slice(1).filter((row) => row[userIdColumn] === userId);

  if (dateColumn !== null && (dateFrom || dateTo)) {
    data = data.filter((row) => {
      const rowDate = new Date(row[dateColumn]);
      if (dateFrom && rowDate < new Date(dateFrom)) return false;
      if (dateTo && rowDate > new Date(dateTo)) return false;
      return true;
    });
  }

  return { headers, data };
}
