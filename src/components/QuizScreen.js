import React, { useState, useEffect, useRef } from "react";

const PlayIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className='h-6 w-6'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
    />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const QuizScreen = ({ deck, onQuizComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const inputRef = useRef(null);
  const currentCard = deck[currentIndex];

  useEffect(() => {
    inputRef.current?.focus();
    setStartTime(Date.now());
  }, [currentIndex]);

  const playAudio = (text, lang = "en-US") => {
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheckAnswer = () => {
    const responseTime = Date.now() - startTime;
    const isCorrect =
      userAnswer.trim().toLowerCase() === currentCard.Español.toLowerCase();
    setFeedback(isCorrect ? "correct" : "incorrect");

    const result = {
      wordId: currentCard.ID_Palabra,
      isCorrect: isCorrect,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
    };
    setSessionResults((prev) => [...prev, result]);
  };

  const handleNext = () => {
    setFeedback(null);
    setUserAnswer("");
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onQuizComplete(sessionResults);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (feedback) handleNext();
      else handleCheckAnswer();
    }
  };

  return (
    <div className='w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-bold'>Sesión de Repaso</h2>
        <span className='text-sm font-medium text-gray-500'>
          {currentIndex + 1} / {deck.length}
        </span>
      </div>
      <div
        className={`text-center p-8 rounded-lg mb-6 transition-colors duration-300 ${
          feedback === "correct"
            ? "bg-green-100"
            : feedback === "incorrect"
            ? "bg-red-100"
            : "bg-gray-100"
        }`}
      >
        <h3 className='text-4xl font-bold text-gray-800'>
          {currentCard.Inglés}
        </h3>
        <button
          onClick={() => playAudio(currentCard.Inglés)}
          className='mt-2 text-blue-500 hover:text-blue-700'
        >
          <PlayIcon />
        </button>
      </div>
      {feedback && (
        <div className='text-center mb-4 p-3 rounded-lg bg-gray-50'>
          {feedback === "correct" ? (
            <p className='font-semibold text-green-700'>¡Correcto!</p>
          ) : (
            <p className='font-semibold text-red-700'>
              Respuesta correcta:{" "}
              <span className='font-bold'>{currentCard.Español}</span>
            </p>
          )}
        </div>
      )}
      <div className='space-y-4'>
        <input
          ref={inputRef}
          type='text'
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Escribe la traducción aquí...'
          className='w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-lg text-center'
          disabled={!!feedback}
        />
        {feedback ? (
          <button
            onClick={handleNext}
            className='w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700'
          >
            {currentIndex < deck.length - 1 ? "Siguiente" : "Finalizar"}
          </button>
        ) : (
          <button
            onClick={handleCheckAnswer}
            className='w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900'
          >
            Revisar
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
