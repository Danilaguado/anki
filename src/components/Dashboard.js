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
const PracticeIcon = () => (
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
      d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691L7.985 5.982m11.667 0L19.015 4.982m-4.991 2.691L12 12.691'
    />
  </svg>
);

const Dashboard = ({ masterWords, onStartQuiz, onCreateDeck }) => {
  const wordsInStudy = masterWords.filter(
    (w) => w.Estado === "Aprendiendo"
  ).length;
  const today = new Date().toISOString().split("T")[0];
  const wordsToReviewToday = masterWords.filter(
    (w) =>
      w.Estado === "Aprendiendo" &&
      (!w.Fecha_Proximo_Repaso || w.Fecha_Proximo_Repaso <= today)
  ).length;
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
          <StudyIcon />
          Repaso Diario ({wordsToReviewToday})
        </button>
        <button
          onClick={() => onStartQuiz(true)}
          disabled={wordsInStudy === 0}
          className='button button-blue'
        >
          <PracticeIcon />
          Modo Práctica ({wordsInStudy})
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
