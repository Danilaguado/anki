// ===== /src/components/AnalyticsDashboard.js - Panel completo de analytics =====
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Iconos para el dashboard
const BarChartIcon = () => (
  <svg
    className='w-6 h-6'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    />
  </svg>
);

const TrendingUpIcon = () => (
  <svg
    className='w-6 h-6'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className='w-6 h-6'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const MicrophoneIcon = () => (
  <svg
    className='w-6 h-6'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
    />
  </svg>
);

const BackIcon = () => (
  <svg
    className='w-6 h-6'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M10 19l-7-7m0 0l7-7m-7 7h18'
    />
  </svg>
);

const AnalyticsDashboard = ({ userId }) => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 días atrás
    to: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId, selectedTab, dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        userId,
        reportType:
          selectedTab === "overview" ? "complete_dashboard" : selectedTab,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      });

      const response = await fetch(`/api/analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        console.error("Error fetching analytics:", data.message);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='analytics-container'>
        <div className='loading-spinner'>
          <h2>Cargando estadísticas...</h2>
          <div className='spinner'></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className='analytics-container'>
        <div className='error-message'>
          <h2>Error al cargar estadísticas</h2>
          <button onClick={() => navigate("/")} className='button-secondary'>
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className='overview-tab'>
      {/* Métricas principales */}
      <div className='metrics-grid'>
        <div className='metric-card'>
          <div className='metric-icon'>
            <ClockIcon />
          </div>
          <div className='metric-content'>
            <h3>{analytics.overview?.totalStudyHours || 0}</h3>
            <p>Horas de Estudio</p>
          </div>
        </div>

        <div className='metric-card'>
          <div className='metric-icon'>
            <BarChartIcon />
          </div>
          <div className='metric-content'>
            <h3>{analytics.overview?.overallAccuracy || 0}%</h3>
            <p>Precisión General</p>
          </div>
        </div>

        <div className='metric-card'>
          <div className='metric-icon'>
            <MicrophoneIcon />
          </div>
          <div className='metric-content'>
            <h3>{analytics.overview?.voiceAccuracy || 0}%</h3>
            <p>Precisión de Voz</p>
          </div>
        </div>

        <div className='metric-card'>
          <div className='metric-icon'>
            <TrendingUpIcon />
          </div>
          <div className='metric-content'>
            <h3>{analytics.overview?.adherenceRate || 0}%</h3>
            <p>Constancia</p>
          </div>
        </div>
      </div>

      {/* Tendencias */}
      <div className='trends-section'>
        <h3>Tendencias</h3>
        <div className='trends-grid'>
          <div
            className={`trend-item ${
              analytics.trends?.studyFrequency || "stable"
            }`}
          >
            <strong>Frecuencia de Estudio:</strong>
            <span className='trend-badge'>
              {getTrendText(analytics.trends?.studyFrequency)}
            </span>
          </div>
          <div
            className={`trend-item ${
              analytics.trends?.performance || "stable"
            }`}
          >
            <strong>Rendimiento:</strong>
            <span className='trend-badge'>
              {getTrendText(analytics.trends?.performance)}
            </span>
          </div>
          <div
            className={`trend-item ${
              analytics.trends?.voiceProgress || "stable"
            }`}
          >
            <strong>Progreso de Voz:</strong>
            <span className='trend-badge'>
              {getTrendText(analytics.trends?.voiceProgress)}
            </span>
          </div>
        </div>
      </div>

      {/* Prioridades */}
      <div className='priorities-section'>
        <h3>Áreas de Enfoque</h3>

        {analytics.priorities?.wordsNeedingReview?.length > 0 && (
          <div className='priority-card'>
            <h4>🔄 Palabras para Repasar Hoy</h4>
            <div className='word-list'>
              {analytics.priorities.wordsNeedingReview.map((word) => (
                <div key={word.wordId} className='word-item'>
                  <strong>{word.english}</strong> - {word.spanish}
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.priorities?.difficultWords?.length > 0 && (
          <div className='priority-card'>
            <h4>😰 Palabras Más Difíciles</h4>
            <div className='word-list'>
              {analytics.priorities.difficultWords.slice(0, 5).map((word) => (
                <div key={word.wordId} className='word-item'>
                  <strong>{word.english}</strong> - {word.spanish}
                  <span className='difficulty-score'>
                    Dificultad: {word.avgDifficulty}/4
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recomendaciones */}
      {analytics.recommendations?.length > 0 && (
        <div className='recommendations-section'>
          <h3>Recomendaciones Personalizadas</h3>
          {analytics.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`recommendation-card priority-${rec.priority}`}
            >
              <h4>{rec.title}</h4>
              <p>{rec.description}</p>
              <div className='recommendation-action'>{rec.action}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDailyTab = () => {
    const dailyData = analytics.detailedReports?.dailySummary;
    return (
      <div className='daily-tab'>
        <h3>Resumen Diario</h3>

        <div className='daily-metrics'>
          <div className='daily-metric'>
            <strong>Días de Estudio:</strong>{" "}
            {dailyData?.aggregated?.totalDays || 0}
          </div>
          <div className='daily-metric'>
            <strong>Sesiones Promedio por Día:</strong>{" "}
            {dailyData?.aggregated?.averageSessionsPerDay || 0}
          </div>
          <div className='daily-metric'>
            <strong>Tiempo Total:</strong>{" "}
            {dailyData?.aggregated?.totalStudyTimeHours || 0} horas
          </div>
        </div>

        <div className='daily-records'>
          <h4>Registro por Días</h4>
          {dailyData?.dailyRecords?.slice(0, 10).map((day, index) => (
            <div key={index} className='daily-record'>
              <span className='date'>{day.Fecha}</span>
              <span className='sessions'>
                {day.Total_Sesiones_Dia || 0} sesiones
              </span>
              <span className='accuracy'>
                {day.Porcentaje_Acierto_Dia || 0}% precisión
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWordsTab = () => {
    const wordData = analytics.detailedReports?.wordPerformance;
    return (
      <div className='words-tab'>
        <h3>Rendimiento por Palabras</h3>

        <div className='words-summary'>
          <div className='words-metric'>
            <strong>Total de Palabras:</strong>{" "}
            {wordData?.summary?.totalWords || 0}
          </div>
          <div className='words-metric'>
            <strong>Precisión Promedio:</strong>{" "}
            {wordData?.summary?.averageAccuracy || 0}%
          </div>
          <div className='words-metric'>
            <strong>Necesitan Repaso:</strong>{" "}
            {wordData?.summary?.wordsNeedingReview || 0}
          </div>
        </div>

        <div className='words-insights'>
          <div className='insight-section'>
            <h4>Palabras con Mayor Dificultad</h4>
            {wordData?.insights?.mostDifficult?.slice(0, 10).map((word) => (
              <div key={word.wordId} className='word-insight-item'>
                <strong>{word.english}</strong> - {word.spanish}
                <span className='stat'>
                  Practicada {word.totalPracticed} veces
                </span>
                <span className='stat'>Dificultad: {word.avgDifficulty}/4</span>
              </div>
            ))}
          </div>

          <div className='insight-section'>
            <h4>Palabras Más Practicadas</h4>
            {wordData?.insights?.mostPracticed?.slice(0, 10).map((word) => (
              <div key={word.wordId} className='word-insight-item'>
                <strong>{word.english}</strong> - {word.spanish}
                <span className='stat'>{word.totalPracticed} intentos</span>
                <span className='stat'>{word.textAccuracy}% precisión</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderVoiceTab = () => {
    const voiceData = analytics.detailedReports?.voiceAnalysis;
    return (
      <div className='voice-tab'>
        <h3>Análisis de Pronunciación</h3>

        <div className='voice-overview'>
          <div className='voice-metric'>
            <strong>Total Intentos:</strong>{" "}
            {voiceData?.overview?.totalVoiceAttempts || 0}
          </div>
          <div className='voice-metric'>
            <strong>Precisión General:</strong>{" "}
            {voiceData?.overview?.overallAccuracy || 0}%
          </div>
          <div className='voice-metric'>
            <strong>Precisión Promedio:</strong>{" "}
            {voiceData?.overview?.avgPrecision || 0}%
          </div>
        </div>

        <div className='voice-insights'>
          <div className='voice-section'>
            <h4>Palabras Más Difíciles de Pronunciar</h4>
            {voiceData?.insights?.mostDifficultWords
              ?.slice(0, 8)
              .map((word) => (
                <div key={word.wordId} className='voice-word-item'>
                  <strong>{word.english}</strong>
                  <span className='voice-stats'>
                    {word.correctAttempts}/{word.totalAttempts}({word.accuracy}%
                    precisión)
                  </span>
                </div>
              ))}
          </div>

          <div className='voice-section'>
            <h4>Errores Comunes</h4>
            {voiceData?.insights?.commonErrors
              ?.slice(0, 10)
              .map((error, index) => (
                <div key={index} className='error-item'>
                  <span className='error-text'>{error.error}</span>
                  <span className='error-count'>{error.count} veces</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const getTrendText = (trend) => {
    const trendTexts = {
      increasing: "Mejorando",
      stable: "Estable",
      decreasing: "Necesita atención",
      excellent: "Excelente",
      good: "Bueno",
      needs_improvement: "Mejorar",
      needs_practice: "Más práctica",
    };
    return trendTexts[trend] || "Sin datos";
  };

  return (
    <div className='analytics-container'>
      {/* Header */}
      <div className='analytics-header'>
        <button onClick={() => navigate("/")} className='back-button'>
          <BackIcon />
          Volver al Dashboard
        </button>
        <h1>Estadísticas de Aprendizaje</h1>
      </div>

      {/* Date Range Selector */}
      <div className='date-range-selector'>
        <label>Desde:</label>
        <input
          type='date'
          value={dateRange.from}
          onChange={(e) =>
            setDateRange((prev) => ({ ...prev, from: e.target.value }))
          }
        />
        <label>Hasta:</label>
        <input
          type='date'
          value={dateRange.to}
          onChange={(e) =>
            setDateRange((prev) => ({ ...prev, to: e.target.value }))
          }
        />
        <button onClick={fetchAnalytics} className='refresh-button'>
          Actualizar
        </button>
      </div>

      {/* Tab Navigation */}
      <div className='tab-navigation'>
        <button
          className={selectedTab === "overview" ? "active" : ""}
          onClick={() => setSelectedTab("overview")}
        >
          Resumen
        </button>
        <button
          className={selectedTab === "daily_summary" ? "active" : ""}
          onClick={() => setSelectedTab("daily_summary")}
        >
          Actividad Diaria
        </button>
        <button
          className={selectedTab === "word_performance" ? "active" : ""}
          onClick={() => setSelectedTab("word_performance")}
        >
          Palabras
        </button>
        <button
          className={selectedTab === "voice_analysis" ? "active" : ""}
          onClick={() => setSelectedTab("voice_analysis")}
        >
          Pronunciación
        </button>
      </div>

      {/* Tab Content */}
      <div className='tab-content'>
        {selectedTab === "overview" && renderOverviewTab()}
        {selectedTab === "daily_summary" && renderDailyTab()}
        {selectedTab === "word_performance" && renderWordsTab()}
        {selectedTab === "voice_analysis" && renderVoiceTab()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
