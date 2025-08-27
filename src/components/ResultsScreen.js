import React, { useState } from "react";

const CheckCircleIcon = () => (
  <svg
    className='icon-success'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const XCircleIcon = () => (
  <svg
    className='icon-error'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
    />
  </svg>
);

const ResultsScreen = ({
  results,
  voiceResults,
  finalStats,
  onBackToDashboard,
}) => {
  const [selectedSentiment, setSelectedSentiment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular estadísticas
  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const totalAnswers = results.length;
  const accuracy =
    totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(1) : 0;

  // Estadísticas de voz
  const voiceCorrect = voiceResults.filter((v) => v.isCorrect).length;
  const voiceTotal = voiceResults.length;
  const voiceAccuracy =
    voiceTotal > 0 ? ((voiceCorrect / voiceTotal) * 100).toFixed(1) : 0;

  // Duración de la sesión
  const sessionDuration = finalStats.sessionDuration || 0;
  const durationMinutes = Math.floor(sessionDuration / (1000 * 60));
  const durationSeconds = Math.floor((sessionDuration % (1000 * 60)) / 1000);

  // Opciones de sentimiento
  const sentimentOptions = [
    {
      value: "muy_facil",
      label: "😎 Muy Fácil",
      emoji: "😎",
      description: "Todo estuvo súper claro",
    },
    {
      value: "facil",
      label: "🙂 Fácil",
      emoji: "🙂",
      description: "La mayoría fue sencillo",
    },
    {
      value: "normal",
      label: "😐 Normal",
      emoji: "😐",
      description: "Ni fácil ni difícil",
    },
    {
      value: "dificil",
      label: "😕 Difícil",
      emoji: "😕",
      description: "Me costó trabajo",
    },
    {
      value: "muy_dificil",
      label: "😭 Muy Difícil",
      emoji: "😭",
      description: "Fue muy complicado",
    },
  ];

  const handleSubmitSentiment = async () => {
    if (!selectedSentiment) {
      alert("Por favor, selecciona cómo te sentiste completando las tarjetas.");
      return;
    }

    setIsSubmitting(true);

    // Pasar el sentimiento seleccionado al componente padre
    await onBackToDashboard(selectedSentiment);
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className='results-container'>
      {/* Header */}
      <div className='results-header'>
        <h1>¡Sesión Completada!</h1>
        <p className='results-subtitle'>
          Has terminado tu sesión de estudio. ¡Buen trabajo!
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className='results-stats-grid'>
        <div className='stat-card primary'>
          <div className='stat-icon'>
            <CheckCircleIcon />
          </div>
          <div className='stat-content'>
            <h3 className={`stat-number ${getAccuracyColor(accuracy)}`}>
              {accuracy}%
            </h3>
            <p className='stat-label'>Precisión General</p>
            <p className='stat-detail'>
              {correctAnswers} de {totalAnswers} correctas
            </p>
          </div>
        </div>

        <div className='stat-card'>
          <div className='stat-content'>
            <h3 className='stat-number'>
              {durationMinutes}:{durationSeconds.toString().padStart(2, "0")}
            </h3>
            <p className='stat-label'>Tiempo Total</p>
            <p className='stat-detail'>Duración de la sesión</p>
          </div>
        </div>

        {voiceTotal > 0 && (
          <div className='stat-card'>
            <div className='stat-content'>
              <h3 className={`stat-number ${getAccuracyColor(voiceAccuracy)}`}>
                {voiceAccuracy}%
              </h3>
              <p className='stat-label'>Pronunciación</p>
              <p className='stat-detail'>
                {voiceCorrect} de {voiceTotal} correctas
              </p>
            </div>
          </div>
        )}

        <div className='stat-card'>
          <div className='stat-content'>
            <h3 className='stat-number'>{totalAnswers}</h3>
            <p className='stat-label'>Palabras Practicadas</p>
            <p className='stat-detail'>
              {finalStats.totalRepeatedCards > 0 &&
                `(+${finalStats.totalRepeatedCards} repetidas)`}
            </p>
          </div>
        </div>
      </div>

      {/* Desglose detallado */}
      <div className='results-breakdown'>
        <h3>Desglose de Respuestas</h3>
        <div className='breakdown-list'>
          {results.map((result, index) => (
            <div
              key={index}
              className={`breakdown-item ${
                result.isCorrect ? "correct" : "incorrect"
              }`}
            >
              <div className='breakdown-icon'>
                {result.isCorrect ? <CheckCircleIcon /> : <XCircleIcon />}
              </div>
              <div className='breakdown-content'>
                <div className='breakdown-question'>
                  <strong>{result.wordId}</strong>
                  {result.srsFeedback && (
                    <span className={`srs-badge ${result.srsFeedback}`}>
                      {result.srsFeedback === "easy" && "😎"}
                      {result.srsFeedback === "good" && "🙂"}
                      {result.srsFeedback === "hard" && "🤔"}
                      {result.srsFeedback === "again" && "😭"}
                    </span>
                  )}
                </div>
                <div className='breakdown-details'>
                  <span
                    className={
                      result.isCorrect ? "text-green-600" : "text-red-600"
                    }
                  >
                    {result.isCorrect ? "✓ Correcto" : "✗ Incorrecto"}
                  </span>
                  {result.userAnswer && (
                    <span className='user-answer'>
                      Tu respuesta: "{result.userAnswer}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de sentimiento */}
      <div className='sentiment-section'>
        <h3>¿Cómo te sentiste completando estas tarjetas?</h3>
        <p className='sentiment-description'>
          Tu respuesta nos ayuda a entender mejor tu experiencia general con la
          sesión.
        </p>

        <div className='sentiment-options'>
          {sentimentOptions.map((option) => (
            <button
              key={option.value}
              className={`sentiment-button ${
                selectedSentiment === option.value ? "selected" : ""
              }`}
              onClick={() => setSelectedSentiment(option.value)}
            >
              <span className='sentiment-emoji'>{option.emoji}</span>
              <div className='sentiment-content'>
                <span className='sentiment-label'>
                  {option.label.split(" ").slice(1).join(" ")}
                </span>
                <span className='sentiment-description'>
                  {option.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmitSentiment}
          disabled={!selectedSentiment || isSubmitting}
          className='submit-results-button'
        >
          {isSubmitting ? "Guardando..." : "Finalizar y Volver al Panel"}
        </button>
      </div>

      {/* Mensaje motivacional */}
      <div className='motivation-message'>
        {accuracy >= 80 ? (
          <p>
            🎉 ¡Excelente trabajo! Tu dominio del vocabulario está mejorando.
          </p>
        ) : accuracy >= 60 ? (
          <p>👍 ¡Buen progreso! Sigue practicando para mejorar aún más.</p>
        ) : (
          <p>
            💪 No te desanimes. Cada práctica te acerca más al dominio completo.
          </p>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;
