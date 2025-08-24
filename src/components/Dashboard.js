import React from "react";

const StudyIcon = () => (
  <svg
    className='w-6 h-6 mr-2'
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
    className='w-6 h-6 mr-2'
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
    <div className='w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8'>
      <h1 className='text-3xl font-bold text-center text-gray-900 mb-2'>
        Panel de Aprendizaje
      </h1>
      <p className='text-center text-gray-500 mb-8'>
        ¡Bienvenido de nuevo! Aquí está tu progreso.
      </p>

      <div className='grid grid-cols-2 gap-4 text-center mb-8'>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <p className='text-3xl font-bold text-blue-600'>{wordsInStudy}</p>
          <p className='text-sm text-blue-800'>Palabras en Estudio</p>
        </div>
        <div className='bg-green-50 p-4 rounded-lg'>
          <p className='text-3xl font-bold text-green-600'>
            {wordsToReviewToday}
          </p>
          <p className='text-sm text-green-800'>Para Repasar Hoy</p>
        </div>
      </div>

      <div className='space-y-4'>
        <button
          onClick={onStartQuiz}
          disabled={wordsToReviewToday === 0}
          className='w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition disabled:bg-gray-400 disabled:cursor-not-allowed'
        >
          <StudyIcon />
          Iniciar Repaso Diario ({wordsToReviewToday} palabras)
        </button>
        <button
          onClick={handleCreateDeck}
          disabled={wordsToLearn === 0}
          className='w-full flex items-center justify-center bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 transition disabled:bg-gray-400 disabled:cursor-not-allowed'
        >
          <AddIcon />
          Crear Nuevo Mazo
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
