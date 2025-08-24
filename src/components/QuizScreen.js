import React, { useState, useEffect, useRef } from "react";

const PlayIcon = () => (
  <svg
    className='icon-play'
    xmlns='http://www.w3.org/2000/svg'
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
      srsFeedback: null, // Se llenará en el siguiente paso
    };
    // No lo añadimos a sessionResults todavía, esperamos el feedback del SRS
    // Guardamos el resultado temporalmente
    inputRef.current.tempResult = result;
  };

  const handleSrsFeedback = (srsLevel) => {
    const tempResult = inputRef.current.tempResult;
    tempResult.srsFeedback = srsLevel; // Añadimos el feedback del SRS
    setSessionResults((prev) => [...prev, tempResult]);

    // Avanzar a la siguiente tarjeta
    setFeedback(null);
    setUserAnswer("");
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onQuizComplete([...sessionResults, tempResult]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !feedback) {
      handleCheckAnswer();
    }
  };

  return (
    <div className='screen-container'>
      <div className='quiz-header'>
        <h2>Sesión de Repaso</h2>
        <span>
          {currentIndex + 1} / {deck.length}
        </span>
      </div>
      <div
        className={`quiz-card ${
          feedback === "correct"
            ? "correct"
            : feedback === "incorrect"
            ? "incorrect"
            : ""
        }`}
      >
        <h3>{currentCard.Inglés}</h3>
        <button
          onClick={() => playAudio(currentCard.Inglés)}
          className='button-play'
        >
          <PlayIcon />
        </button>
      </div>

      {!feedback ? (
        <div className='quiz-actions'>
          <input
            ref={inputRef}
            type='text'
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Escribe la traducción aquí...'
            className='input-field'
          />
          <button onClick={handleCheckAnswer} className='button button-dark'>
            Revisar
          </button>
        </div>
      ) : (
        <div className='feedback-container'>
          <div className='feedback-result'>
            {feedback === "correct" ? (
              <p className='correct-text'>¡Correcto!</p>
            ) : (
              <p className='incorrect-text'>
                Respuesta correcta: <strong>{currentCard.Español}</strong>
              </p>
            )}
          </div>
          <p className='srs-prompt'>¿Qué tan bien la recordabas?</p>
          <div className='srs-buttons'>
            <button
              onClick={() => handleSrsFeedback("again")}
              className='srs-button'
            >
              <span className='srs-emoji'>😭</span>
              <span className='srs-text'>Mal</span>
            </button>
            <button
              onClick={() => handleSrsFeedback("hard")}
              className='srs-button'
            >
              <span className='srs-emoji'>🤔</span>
              <span className='srs-text'>Difícil</span>
            </button>
            <button
              onClick={() => handleSrsFeedback("good")}
              className='srs-button'
            >
              <span className='srs-emoji'>🙂</span>
              <span className='srs-text'>Bien</span>
            </button>
            <button
              onClick={() => handleSrsFeedback("easy")}
              className='srs-button'
            >
              <span className='srs-emoji'>😎</span>
              <span className='srs-text'>Fácil</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizScreen;
