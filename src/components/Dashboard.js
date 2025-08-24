import React from "react";

// ... (iconos sin cambios)

const Dashboard = ({ userData, onStartQuiz, onCreateDeck }) => {
  const wordsInStudy = userData.words.filter(
    (w) => w.Estado === "Aprendiendo"
  ).length;
  const today = new Date().toISOString().split("T")[0];
  const wordsToReviewToday = userData.words.filter(
    (w) =>
      w.Estado === "Aprendiendo" &&
      (!w.Fecha_Proximo_Repaso || w.Fecha_Proximo_Repaso <= today)
  ).length;
  const wordsToLearn = userData.words.filter(
    (w) => w.Estado === "Por Aprender"
  ).length;

  const handleCreateDeck = () => {
    const amountStr = prompt(
      `¿Cuántas palabras nuevas quieres añadir? (Disponibles: ${wordsToLearn})`,
      "20"
    );
    const amount = parseInt(amountStr, 10);
    if (!isNaN(amount) && amount > 0) {
      onCreateDeck(amount);
    } else if (amountStr !== null) {
      alert("Por favor, introduce un número válido.");
    }
  };

  return (
    <div className='screen-container'>
      <h1>Panel de Aprendizaje</h1>
      <p className='subtitle'>¡Bienvenido de nuevo! Aquí está tu progreso.</p>
      <div className='stats-grid'>
        <div className='stat-card'>
          <p className='stat-number-blue'>{wordsInStudy}</p>
          <p className='stat-label'>Palabras en Estudio</p>
        </div>
        <div className='stat-card'>
          <p className='stat-number-green'>{wordsToReviewToday}</p>
          <p className='stat-label'>Para Repasar Hoy</p>
        </div>
      </div>
      <div className='button-group'>
        <button
          onClick={() => onStartQuiz(false)}
          disabled={wordsToReviewToday === 0}
          className='button button-green'
        >
          Repaso Diario ({wordsToReviewToday})
        </button>
        <button
          onClick={() => onStartQuiz(true)}
          disabled={wordsInStudy === 0}
          className='button button-blue'
        >
          Modo Práctica ({wordsInStudy})
        </button>
        <button
          onClick={handleCreateDeck}
          disabled={wordsToLearn === 0}
          className='button button-secondary'
        >
          Añadir Nuevo Mazo ({wordsToLearn})
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
