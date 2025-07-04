// src/Practice/LessonChatModule.js
// ¡Este componente ahora gestiona el flujo de toda la lección de chat, mostrando todos los ejercicios en una sola pantalla!

import React, { useState, useEffect, useRef } from "react";
import { normalizeText, renderClickableText } from "../../utils/textUtils"; // Ruta relativa
import SpeechToTextButton from "../../components/SpeechToTextButton"; // Ruta relativa
import "./ChatbotLessonRawDisplay.css"; // Correcto: en la misma carpeta

const ChatbotLessonRawDisplay = ({
  lessonExercises,
  onPlayAudio,
  appIsLoading,
}) => {
  // ¡NUEVO! Recibe onPlayAudio y appIsLoading
  if (!lessonExercises || lessonExercises.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#666" }}>
        No hay ejercicios para esta lección de chatbot.
      </p>
    );
  }

  // Renderizar el botón de reproducción de audio
  const playAudioButton = (phrase) => (
    <button
      onClick={() => onPlayAudio(phrase, "en-US")}
      className='button audio-button-round primary-button small-button'
      disabled={appIsLoading}
      aria-label={`Reproducir: ${phrase}`}
      style={{ marginLeft: "10px", flexShrink: 0 }} // Estilo básico para que no rompa el layout
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
  );

  return (
    <div className='chatbot-raw-display-container'>
      <h3 className='chatbot-raw-display-title'>
        Contenido Crudo de Lección Chatbot
      </h3>
      <p className='info-text-debug'>
        (Esto es solo para depuración. Muestra todos los ejercicios de la
        lección uno debajo del otro.)
      </p>
      <hr style={{ borderTop: "1px dashed #ddd", margin: "15px 0" }} />

      {lessonExercises.map((exercise, index) => (
        <div
          key={exercise.ExerciseID || index}
          className='chatbot-raw-display-exercise-block'
        >
          <h4>
            Ejercicio {index + 1} - Tipo: {exercise.Type} (Orden:{" "}
            {exercise.OrderInLesson})
          </h4>
          <p>
            <strong className='label-en'>Question EN:</strong>{" "}
            {exercise.QuestionEN}
            {onPlayAudio && playAudioButton(exercise.QuestionEN)}{" "}
            {/* Botón de audio */}
          </p>
          <p>
            <strong className='label-es'>Question ES:</strong>{" "}
            {exercise.QuestionES}
          </p>
          {exercise.AnswerEN && (
            <p>
              <strong className='label-answer'>Answer EN:</strong>{" "}
              {exercise.AnswerEN}
            </p>
          )}
          {exercise.AnswerES && (
            <p>
              <strong className='label-answer'>Answer ES:</strong>{" "}
              {exercise.AnswerES}
            </p>
          )}
          {exercise.OptionsEN && exercise.OptionsEN.length > 0 && (
            <p>
              <strong className='label-options'>Options EN:</strong>{" "}
              {exercise.OptionsEN.join(", ")}
            </p>
          )}
          {exercise.Notes && (
            <p className='label-notes'>
              <strong>Notas:</strong> {exercise.Notes}
            </p>
          )}
          {exercise.Image && (
            <p>
              <strong>Imagen:</strong>{" "}
              <a
                href={exercise.Image}
                target='_blank'
                rel='noopener noreferrer'
              >
                {exercise.Image}
              </a>
            </p>
          )}
          {exercise.DialogueSequence && (
            <div
              style={{
                marginTop: "10px",
                borderTop: "1px solid #eee",
                paddingTop: "10px",
              }}
            >
              <strong>Dialogue Sequence:</strong>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "0.85em",
                  backgroundColor: "#f0f0f0",
                  padding: "8px",
                  borderRadius: "4px",
                }}
              >
                {JSON.stringify(exercise.DialogueSequence, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
      <p className='chatbot-raw-display-footer'>
        Fin de la lección de chatbot.
      </p>
    </div>
  );
};

export default ChatbotLessonRawDisplay;
