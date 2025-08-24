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
    onBackToDashboard(results, sentiment);
  };

  return (
    <div className='w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center'>
      <h1 className='text-3xl font-bold text-gray-900 mb-2'>
        ¡Sesión Completada!
      </h1>
      <p className='text-gray-500 mb-6'>Aquí está tu resumen.</p>
      <div className='bg-gray-50 rounded-xl p-6 mb-8'>
        <p className='text-lg font-semibold text-gray-700'>Precisión</p>
        <p className='text-6xl font-bold text-blue-600 my-2'>{accuracy}%</p>
        <p className='text-gray-500'>
          {correctCount} de {totalCount} correctas
        </p>
      </div>
      <div className='mb-8 p-4 bg-gray-100 rounded-lg'>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          ¿Cómo te sientes después de esta sesión?
        </label>
        <div className='flex justify-center space-x-2'>
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setSentiment(level)}
              className={`text-3xl p-2 rounded-full transition ${
                sentiment === level
                  ? "bg-blue-200 scale-125"
                  : "hover:bg-gray-300"
              }`}
            >
              {["😩", "😕", "😐", "🙂", "😁"][level - 1]}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleFinish}
        className='w-full bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-900'
      >
        Guardar y Volver al Panel
      </button>
    </div>
  );
};

export default ResultsScreen;
