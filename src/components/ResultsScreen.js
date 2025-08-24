import React, { useState } from "react";

const ResultsScreen = ({ results, onBackToDashboard }) => {
  const [sentiment, setSentiment] = useState(null);
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const accuracy =
    totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(0) : 0;

  const handleFinish = () => {
    if (sentiment === null) {
      alert("Por favor, selecciona cómo te sientes antes de continuar.");
      return;
    }
    // Pasamos los resultados Y el sentimiento
    onBackToDashboard(results, sentiment);
  };

  return (
    <div className='screen-container text-center'>
      <h1>¡Sesión Completada!</h1>
      <p className='subtitle'>Aquí está tu resumen.</p>
      <div className='stat-card'>
        <p className='stat-label'>Precisión</p>
        <p className='stat-number-blue large'>{accuracy}%</p>
        <p className='stat-sublabel'>
          {correctCount} de {totalCount} correctas
        </p>
      </div>
      <div className='sentiment-box'>
        <label>¿Cómo te sientes después de esta sesión?</label>
        <div className='sentiment-buttons'>
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setSentiment(level)}
              className={`sentiment-button ${
                sentiment === level ? "selected" : ""
              }`}
            >
              {["😩", "😕", "😐", "🙂", "😁"][level - 1]}
            </button>
          ))}
        </div>
      </div>
      <button onClick={handleFinish} className='button button-dark'>
        Guardar y Volver al Panel
      </button>
    </div>
  );
};

export default ResultsScreen;
