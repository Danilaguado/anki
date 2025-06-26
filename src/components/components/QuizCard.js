// src/components/QuizCard.js
import React from "react";
import SpeechToTextButton from "./SpeechToTextButton"; // Asegúrate de que esta ruta sea correcta
import { renderClickableText } from "../utils/textUtils"; // Importar la utilidad

const QuizCard = ({
  currentCard,
  currentCardIndex,
  totalCards,
  recordedMicrophoneText,
  userTypedAnswer,
  matchFeedback,
  quizCorrectAnswerDisplay,
  isLoading,
  onHandleSpeechResult,
  onPlayAudio, // Se recibe como prop
  onUserTypedAnswerChange,
  onCheckTypedAnswer,
  onHandleQuizInputKeyDown,
  onNextCard,
  onPrevCard,
  onNavigateToHome,
}) => {
  if (!currentCard) {
    return (
      <p className='info-text'>
        No hay tarjetas en esta categoría para el quiz. Puedes añadir algunas
        desde la sección "Gestionar Categorías".
      </p>
    );
  }

  return (
    <div className='main-content-wrapper'>
      <div className='card-container'>
        {/* Texto grabado del micrófono (siempre se muestra si hay) */}
        {recordedMicrophoneText && (
          <div className='recorded-text-display'>{recordedMicrophoneText}</div>
        )}

        {/* Área de contenido de la tarjeta - INVERTIDA: muestra español */}
        <div
          className={`card-content-area ${
            matchFeedback === "correct" ? "match-correct" : ""
          } ${matchFeedback === "incorrect" ? "match-incorrect" : ""}`}
        >
          <div id='question-text' className='card-text question quiz-question'>
            {renderClickableText(
              currentCard.answer, // Aquí se muestra la respuesta (frase en español)
              currentCard.langAnswer || "es-ES",
              false,
              onPlayAudio // Pasar la función playAudio como prop
            )}
          </div>
          {/* Nueva sección para mostrar la respuesta correcta en inglés si se acierta */}
          {quizCorrectAnswerDisplay && (
            <div className='card-text correct-answer-display'>
              {quizCorrectAnswerDisplay}
            </div>
          )}
        </div>

        {/* Contenedor para el botón de micrófono y reproducir (inglés) */}
        <div className='microphone-play-buttons-group'>
          <SpeechToTextButton
            onResult={onHandleSpeechResult} // La misma lógica, pero comparará con el inglés
            disabled={isLoading}
            lang={currentCard.langQuestion || "en-US"} // El idioma a reconocer es el inglés de la pregunta
          />

          <button
            onClick={() =>
              onPlayAudio(
                currentCard.question,
                currentCard.langQuestion || "en-US"
              )
            }
            className='button audio-button-round primary-button'
            disabled={isLoading}
            aria-label='Reproducir Frase en Inglés'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='100%'
              height='100%'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path d='M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z' />
            </svg>
          </button>
        </div>

        {/* Input para escribir la respuesta en inglés y botón Verificar */}
        <div className='quiz-input-group'>
          <input
            type='text'
            className='input-field quiz-answer-input'
            placeholder='Escribe la frase en inglés aquí'
            value={userTypedAnswer}
            onChange={(e) => onUserTypedAnswerChange(e.target.value)}
            onKeyDown={onHandleQuizInputKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={onCheckTypedAnswer}
            className='button quiz-check-button'
            disabled={isLoading}
            aria-label='Verificar respuesta'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='100%'
              height='100%'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path d='M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z' />
            </svg>
          </button>
        </div>

        <div className='navigation-buttons-group'>
          <button
            onClick={onPrevCard}
            className='button nav-button prev'
            disabled={isLoading}
          >
            Anterior
          </button>
          <button
            onClick={onNextCard}
            className='button nav-button next'
            disabled={isLoading}
          >
            Siguiente
          </button>
        </div>

        <div className='card-counter'>
          Tarjeta {currentCardIndex + 1} de {totalCards}
        </div>
        <button
          onClick={onNavigateToHome}
          className='button back-button'
          disabled={isLoading}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
