// ===== /src/components/ResultsScreen.js - Mejorado con estadísticas completas =====
import React, { useState } from "react";

const TrophyIcon = () => (
  <svg
    className='w-16 h-16 text-yellow-500'
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path d='M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 10.1 15.9 11 17 11V12.5C17 15.26 14.76 17.5 12 17.5S7 15.26 7 12.5V11C8.1 11 9 10.1 9 9V7H3V9C3 10.1 3.9 11 5 11V12.5C5 16.37 8.13 19.5 12 19.5S19 16.37 19 12.5V11C20.1 11 21 10.1 21 9Z' />
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

const MicIcon = () => (
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

const RepeatIcon = () => (
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
      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    />
  </svg>
);

const ResultsScreen = ({
  results,
  voiceResults = [],
  finalStats = {},
  onBackToDashboard,
}) => {
  const [sentiment, setSentiment] = useState(null);

  // Calcular estadísticas básicas
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const accuracy =
    totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(0) : 0;

  // Calcular estadísticas de voz
  const voiceCorrectCount = voiceResults.filter((r) => r.isCorrect).length;
  const voiceTotal = voiceResults.length;
  const voiceAccuracy =
    voiceTotal > 0 ? ((voiceCorrectCount / voiceTotal) * 100).toFixed(0) : 0;

  // Estadísticas de tiempo
  const totalTime = finalStats.sessionDuration || 0;
  const avgTimePerCard =
    totalCount > 0 ? Math.round(totalTime / totalCount / 1000) : 0;
  const fastestTime =
    results.length > 0
      ? Math.min(...results.map((r) => r.responseTime || 0)) / 1000
      : 0;
  const slowestTime =
    results.length > 0
      ? Math.max(...results.map((r) => r.responseTime || 0)) / 1000
      : 0;

  // Estadísticas de repetición espaciada
  const srsBreakdown = {
    easy: results.filter((r) => r.srsFeedback === "easy").length,
    good: results.filter((r) => r.srsFeedback === "good").length,
    hard: results.filter((r) => r.srsFeedback === "hard").length,
    again: results.filter((r) => r.srsFeedback === "again").length,
  };

  // Determinar el nivel de rendimiento
  const getPerformanceLevel = () => {
    if (accuracy >= 90)
      return { level: "Excelente", color: "text-green-600", emoji: "🏆" };
    if (accuracy >= 75)
      return { level: "Muy Bien", color: "text-blue-600", emoji: "🎉" };
    if (accuracy >= 60)
      return { level: "Bien", color: "text-yellow-600", emoji: "👍" };
    if (accuracy >= 40)
      return { level: "Regular", color: "text-orange-600", emoji: "📖" };
    return { level: "Necesita Práctica", color: "text-red-600", emoji: "💪" };
  };

  const performanceLevel = getPerformanceLevel();

  // Calcular palabras que necesitan más práctica
  const wordsNeedingPractice = results
    .filter(
      (r) =>
        !r.isCorrect || r.srsFeedback === "hard" || r.srsFeedback === "again"
    )
    .map((r) => r.wordId);

  const handleFinish = () => {
    if (sentiment === null) {
      alert("Por favor, selecciona cómo te sientes antes de continuar.");
      return;
    }
    onBackToDashboard(sentiment);
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className='results-container'>
      <div className='results-header'>
        <div className='performance-badge'>
          <TrophyIcon />
          <div className='performance-text'>
            <h1 className={performanceLevel.color}>
              {performanceLevel.emoji} {performanceLevel.level}
            </h1>
            <p className='subtitle'>¡Sesión completada!</p>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className='main-stats-grid'>
        <div className='main-stat-card primary'>
          <div className='stat-content'>
            <span className='stat-number'>{accuracy}%</span>
            <span className='stat-label'>Precisión</span>
            <span className='stat-detail'>
              {correctCount} de {totalCount} correctas
            </span>
          </div>
        </div>

        <div className='main-stat-card secondary'>
          <ClockIcon />
          <div className='stat-content'>
            <span className='stat-number'>{formatTime(totalTime / 1000)}</span>
            <span className='stat-label'>Tiempo Total</span>
            <span className='stat-detail'>
              Promedio: {avgTimePerCard}s por carta
            </span>
          </div>
        </div>

        {voiceTotal > 0 && (
          <div className='main-stat-card voice'>
            <MicIcon />
            <div className='stat-content'>
              <span className='stat-number'>{voiceAccuracy}%</span>
              <span className='stat-label'>Pronunciación</span>
              <span className='stat-detail'>
                {voiceCorrectCount} de {voiceTotal} intentos
              </span>
            </div>
          </div>
        )}

        {finalStats.totalRepeatedCards > 0 && (
          <div className='main-stat-card repeat'>
            <RepeatIcon />
            <div className='stat-content'>
              <span className='stat-number'>
                {finalStats.totalRepeatedCards}
              </span>
              <span className='stat-label'>Palabras Repasadas</span>
              <span className='stat-detail'>Necesitaban más práctica</span>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas detalladas */}
      <div className='detailed-stats'>
        <div className='stats-section'>
          <h3>Análisis de Tiempo</h3>
          <div className='stats-grid'>
            <div className='stat-item'>
              <span className='stat-label'>Más Rápido:</span>
              <span className='stat-value'>{fastestTime.toFixed(1)}s</span>
            </div>
            <div className='stat-item'>
              <span className='stat-label'>Más Lento:</span>
              <span className='stat-value'>{slowestTime.toFixed(1)}s</span>
            </div>
            <div className='stat-item'>
              <span className='stat-label'>Promedio:</span>
              <span className='stat-value'>{avgTimePerCard}s</span>
            </div>
          </div>
        </div>

        <div className='stats-section'>
          <h3>Dificultad Reportada</h3>
          <div className='srs-breakdown'>
            <div className='srs-item easy'>
              <span className='srs-emoji'>😎</span>
              <span className='srs-label'>Fácil</span>
              <span className='srs-count'>{srsBreakdown.easy}</span>
            </div>
            <div className='srs-item good'>
              <span className='srs-emoji'>🙂</span>
              <span className='srs-label'>Bien</span>
              <span className='srs-count'>{srsBreakdown.good}</span>
            </div>
            <div className='srs-item hard'>
              <span className='srs-emoji'>🤔</span>
              <span className='srs-label'>Difícil</span>
              <span className='srs-count'>{srsBreakdown.hard}</span>
            </div>
            <div className='srs-item again'>
              <span className='srs-emoji'>😭</span>
              <span className='srs-label'>Mal</span>
              <span className='srs-count'>{srsBreakdown.again}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights y recomendaciones */}
      {wordsNeedingPractice.length > 0 && (
        <div className='insights-section'>
          <h3>💡 Recomendaciones</h3>
          <div className='insight-card'>
            <p>
              <strong>{wordsNeedingPractice.length} palabras</strong> necesitan
              más práctica. Estas aparecerán con mayor frecuencia en tus
              próximas sesiones.
            </p>
          </div>

          {srsBreakdown.again > 0 && (
            <div className='insight-card warning'>
              <p>
                <strong>Atención:</strong> {srsBreakdown.again} palabras fueron
                marcadas como "Mal". Estas se reprogramarán para repaso muy
                pronto.
              </p>
            </div>
          )}

          {voiceTotal > 0 && voiceAccuracy < 70 && (
            <div className='insight-card voice-tip'>
              <p>
                <strong>Tip de Pronunciación:</strong> Tu precisión de voz es
                del {voiceAccuracy}%. Intenta hablar más despacio y pronunciar
                cada sílaba claramente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Evaluación del sentimiento */}
      <div className='sentiment-section'>
        <h3>¿Cómo te sientes después de esta sesión?</h3>
        <div className='sentiment-buttons'>
          {[1, 2, 3, 4, 5].map((level) => {
            const emotions = ["😫", "😕", "😐", "🙂", "😁"];
            const labels = [
              "Frustrado",
              "Difícil",
              "Normal",
              "Bien",
              "¡Genial!",
            ];

            return (
              <button
                key={level}
                onClick={() => setSentiment(level)}
                className={`sentiment-button ${
                  sentiment === level ? "selected" : ""
                }`}
              >
                <span className='sentiment-emoji'>{emotions[level - 1]}</span>
                <span className='sentiment-label'>{labels[level - 1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Botón de finalizar */}
      <div className='results-actions'>
        <button
          onClick={handleFinish}
          className={`finish-button ${sentiment ? "ready" : "disabled"}`}
          disabled={!sentiment}
        >
          Guardar y Volver al Panel
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
