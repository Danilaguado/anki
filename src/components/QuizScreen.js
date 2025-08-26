// ===== /src/components/QuizScreen.js =====
// Implementa la barra de progreso, botón de cerrar, blur al hacer clic, y múltiples respuestas.

import React, { useState, useEffect, useRef } from "react";
import SpeechToTextButton from "./SpeechToTextButton";
import "./QuizScreen.css";

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
      strokeWidth={2}
      d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
    />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);
const CloseIcon = () => (
  <svg
    className='icon-close'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={2}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M6 18L18 6M6 6l12 12'
    />
  </svg>
);

const QuizScreen = ({ deck, onQuizComplete, onGoBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [voiceResults, setVoiceResults] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [isAnswerBlurred, setIsAnswerBlurred] = useState(true);
  const inputRef = useRef(null);
  const tempResultRef = useRef(null);

  if (!deck || deck.length === 0) {
    return (
      <div className='screen-container text-center'>
        <h1>Error</h1>
        <p className='subtitle'>
          No hay tarjetas disponibles en este mazo para estudiar.
        </p>
        <button onClick={onGoBack} className='button button-secondary'>
          Volver al Panel
        </button>
      </div>
    );
  }

  const currentCard = deck[currentIndex];
  const progress = ((currentIndex + 1) / deck.length) * 100;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setStartTime(Date.now());
    setIsAnswerBlurred(true);
  }, [currentIndex]);

  const playAudio = (text, lang = "en-US") => {
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeechResult = (transcript) => {
    const spokenText = transcript.trim().toLowerCase();
    const correctText = currentCard.Inglés.trim().toLowerCase();
    const isCorrect = spokenText === correctText;

    setVoiceResults((prev) => [
      ...prev,
      { wordId: currentCard.ID_Palabra, isCorrect },
    ]);

    if (isCorrect) {
      alert(`¡Coincidencia exacta! Dijiste: "${transcript}"`);
    } else {
      alert(
        `Casi... Dijiste: "${transcript}". La palabra correcta es: "${currentCard.Inglés}"`
      );
    }
  };

  const handleCheckAnswer = () => {
    const responseTime = Date.now() - startTime;

    const userCleanAnswer = userAnswer.trim().toLowerCase();
    const correctAnswers = currentCard.Español.split("/").map((ans) =>
      ans.trim().toLowerCase()
    );
    const isCorrect = correctAnswers.includes(userCleanAnswer);

    setFeedback(isCorrect ? "correct" : "incorrect");

    tempResultRef.current = {
      wordId: currentCard.ID_Palabra,
      isCorrect: isCorrect,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      srsFeedback: null,
    };
  };

  const handleSrsFeedback = (srsLevel) => {
    const finalResult = { ...tempResultRef.current, srsFeedback: srsLevel };
    const updatedResults = [...sessionResults, finalResult];

    if (currentIndex < deck.length - 1) {
      setSessionResults(updatedResults);
      setFeedback(null);
      setUserAnswer("");
      setCurrentIndex(currentIndex + 1);
    } else {
      onQuizComplete(updatedResults, voiceResults);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !feedback) {
      handleCheckAnswer();
    }
  };

  return (
    <div className='screen-container quiz-mode'>
      <div className='progress-bar-container'>
        <div className='progress-bar' style={{ width: `${progress}%` }}></div>
      </div>
      <button onClick={onGoBack} className='button-close'>
        <CloseIcon />
      </button>

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
        <p
          className={`blurred-answer ${!isAnswerBlurred ? "revealed" : ""}`}
          onClick={() => setIsAnswerBlurred(false)}
        >
          {currentCard.Español}
        </p>
        <div className='audio-controls'>
          <button
            onClick={() => playAudio(currentCard.Inglés)}
            className='button-play'
          >
            <PlayIcon />
          </button>
          <SpeechToTextButton onResult={handleSpeechResult} lang='en-US' />
        </div>
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
              onClick={() => handleSrsFeedback("easy")}
              className='srs-button'
            >
              <span className='srs-emoji'>😎</span>
              <span className='srs-text'>Fácil</span>
            </button>
            <button
              onClick={() => handleSrsFeedback("good")}
              className='srs-button'
            >
              <span className='srs-emoji'>🙂</span>
              <span className='srs-text'>Bien</span>
            </button>
            <button
              onClick={() => handleSrsFeedback("hard")}
              className='srs-button'
            >
              <span className='srs-emoji'>🤔</span>
              <span className='srs-text'>Difícil</span>
            </button>
            <button
              onClick={() => handleSrsFeedback("again")}
              className='srs-button'
            >
              <span className='srs-emoji'>😭</span>
              <span className='srs-text'>Mal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizScreen;
