// src/components/PracticeCard.js
import React from "react";
import SpeechToTextButton from "./SpeechToTextButton"; // Asegúrate de que esta ruta sea correcta
import { renderClickableText } from "../utils/textUtils"; // Importar la utilidad
import "./PracticeCard.css";

const PracticeCard = ({
  currentCard,
  currentCardIndex,
  totalCards,
  isAnswerVisible,
  recordedMicrophoneText,
  matchFeedback,
  isLoading,
  onToggleAnswerVisible,
  onNextCard,
  onPrevCard,
  onHandleSpeechResult,
  onPlayAudio, // Ahora se recibe como prop
  onNavigateToHome,
}) => {
  if (!currentCard) {
    return (
      <p className='info-text'>
        No hay tarjetas en esta categoría. Puedes añadir algunas desde la
        sección "Gestionar Categorías".
      </p>
    );
  }

  return (
    <div className='main-content-wrapper'>
      <div className='card-container'>
        {/* Texto grabado del micrófono */}
        {recordedMicrophoneText && (
          <div className='recorded-text-display'>{recordedMicrophoneText}</div>
        )}

        {/* Área de contenido de la tarjeta con pregunta y respuesta */}
        <div
          className={`card-content-area ${
            matchFeedback === "correct" ? "match-correct" : ""
          } ${matchFeedback === "incorrect" ? "match-incorrect" : ""}`}
        >
          <div id='question-text' className='card-text question'>
            {renderClickableText(
              currentCard.question,
              currentCard.langQuestion || "en-US",
              true,
              onPlayAudio // Pasar la función playAudio como prop
            )}
          </div>
          <div
            id='answer-text'
            className={`card-text answer ${isAnswerVisible ? "" : "hidden"}`}
          >
            {renderClickableText(
              currentCard.answer,
              currentCard.langAnswer || "es-ES",
              false,
              onPlayAudio // Pasar la función playAudio como prop
            )}
          </div>
        </div>

        {/* Contenedor para el botón de micrófono y reproducir tarjeta (flexbox) */}
        <div className='microphone-play-buttons-group'>
          <SpeechToTextButton
            onResult={onHandleSpeechResult}
            disabled={isLoading}
            lang={currentCard.langQuestion || "en-US"}
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
            aria-label='Reproducir Tarjeta Completa'
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

        {/* Botón de Mostrar/Ocultar Traducción */}
        <button
          onClick={onToggleAnswerVisible}
          className='button toggle-answer-button'
          disabled={isLoading}
        >
          {isAnswerVisible ? "Ocultar Traducción" : "Mostrar Traducción"}
        </button>

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

export default PracticeCard;
