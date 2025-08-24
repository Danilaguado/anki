import React from "react";

const StudyIcon = () => (
  <svg
    className='icon'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'
    />
  </svg>
);
const AddIcon = () => (
  <svg
    className='icon'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const Dashboard = ({ masterWords, onStartQuiz, onCreateDeck }) => {
  // CORRECCIÓN: Se calcula sobre las palabras con estado 'Aprendiendo'
  const wordsInStudy = masterWords.filter(
    (w) => w.Estado === "Aprendiendo"
  ).length;
  const today = new Date().toISOString().split("T")[0];
  const wordsToReviewToday = masterWords.filter(
    (w) =>
      w.Estado === "Aprendiendo" &&
      (!w.Fecha_Proximo_Repaso || w.Fecha_Proximo_Repaso <= today)
  ).length;
  // CORRECCIÓN: La cantidad disponible son las que están 'Por Aprender'
  const wordsToLearn = masterWords.filter(
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
      // Evita la alerta si el usuario cancela
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
          onClick={onStartQuiz}
          disabled={wordsToReviewToday === 0}
          className='button button-green'
        >
          <StudyIcon />
          Iniciar Repaso Diario ({wordsToReviewToday})
        </button>
        <button
          onClick={handleCreateDeck}
          disabled={wordsToLearn === 0}
          className='button button-secondary'
        >
          <AddIcon />
          Añadir Nuevo Mazo ({wordsToLearn})
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
