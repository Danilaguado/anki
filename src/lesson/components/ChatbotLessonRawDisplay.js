// src/lesson/components/ChatbotLessonRawDisplay.js
// Este componente muestra los ejercicios de una lección chatbot de forma secuencial con scroll.

import React, { useState, useEffect, useRef } from "react";
import "./ChatbotLessonRawDisplay.css"; // Importa el CSS personal

const ChatbotLessonRawDisplay = ({
  lessonExercises,
  onPlayAudio,
  appIsLoading,
  setAppMessage,
}) => {
  // Estado para el índice del ejercicio que se está mostrando actualmente
  const [currentDisplayedExerciseIndex, setCurrentDisplayedExerciseIndex] =
    useState(-1); // Empieza en -1 para no mostrar nada al inicio
  // Estado para almacenar los ejercicios que ya han sido "mostrados" (añadidos al historial)
  const [displayedExercises, setDisplayedExercises] = useState([]);

  const chatContainerRef = useRef(null); // Para hacer scroll automático

  // --- DEBUG: LOGS DE INICIALIZACIÓN DE COMPONENTE ---
  console.log("DEBUG: ChatbotLessonRawDisplay se ha renderizado.");
  console.log("DEBUG: Props recibidas en ChatbotLessonRawDisplay:", {
    lessonExercises,
    onPlayAudio,
    appIsLoading,
    setAppMessage,
  });
  console.log(
    "DEBUG: Tipo de onPlayAudio en ChatbotLessonRawDisplay:",
    typeof onPlayAudio
  );
  // --- FIN DEBUG ---

  // Efecto para inicializar el chat con el primer ejercicio al cargar la lección
  useEffect(() => {
    console.log(
      "DEBUG: ChatbotLessonRawDisplay - useEffect de inicialización disparado."
    );
    setDisplayedExercises([]); // Reiniciar el historial al cambiar de lección
    setCurrentDisplayedExerciseIndex(-1); // Reiniciar el índice
    setAppMessage(""); // Limpiar mensaje al inicio de la lección
    console.log("DEBUG: ChatbotLessonRawDisplay - Estados reiniciados.");

    // DEBUG: Alerta para ver el inicio de la lección
    // alert('DEBUG: ChatbotLessonRawDisplay - Iniciando nueva lección de chatbot.');
  }, [lessonExercises, setAppMessage]); // Añadido setAppMessage a las dependencias

  // Efecto para hacer scroll al final del chat cuando se añade un nuevo ejercicio
  useEffect(() => {
    console.log(
      "DEBUG: ChatbotLessonRawDisplay - useEffect de scroll disparado."
    );
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
      console.log("DEBUG: ChatbotLessonRawDisplay - Scroll realizado.");
    }
  }, [displayedExercises]); // Se dispara cada vez que se añade un ejercicio

  // Función para avanzar y mostrar el siguiente ejercicio
  const handleShowNextExercise = () => {
    console.log(
      "DEBUG: ChatbotLessonRawDisplay - handleShowNextExercise llamado."
    );
    const nextIndex = currentDisplayedExerciseIndex + 1;
    console.log(
      "DEBUG: ChatbotLessonRawDisplay - currentDisplayedExerciseIndex:",
      currentDisplayedExerciseIndex,
      "nextIndex:",
      nextIndex
    );

    if (lessonExercises && nextIndex < lessonExercises.length) {
      const nextExercise = lessonExercises[nextIndex];
      console.log(
        "DEBUG: ChatbotLessonRawDisplay - Añadiendo ejercicio al historial:",
        nextExercise
      );
      setDisplayedExercises((prev) => [...prev, nextExercise]); // Añadir el nuevo ejercicio al historial
      setCurrentDisplayedExerciseIndex(nextIndex); // Actualizar el índice
      // alert(`DEBUG: Mostrando Ejercicio ${nextIndex + 1}`);
    } else {
      console.log(
        "DEBUG: ChatbotLessonRawDisplay - Todos los ejercicios han sido mostrados."
      );
      setAppMessage("¡Todos los ejercicios han sido mostrados!");
      // alert('DEBUG: Todos los ejercicios han sido mostrados.');
    }
  };

  // Renderizar el botón de reproducción de audio
  const playAudioButton = (phrase) => {
    console.log(
      "DEBUG: ChatbotLessonRawDisplay - renderizando playAudioButton para frase:",
      phrase
    );
    console.log(
      "DEBUG: ChatbotLessonRawDisplay - typeof onPlayAudio dentro playAudioButton:",
      typeof onPlayAudio
    );

    // ¡CORREGIDO! Asegurarse de que onPlayAudio sea una función antes de llamarla
    if (typeof onPlayAudio !== "function") {
      console.warn(
        "ADVERTENCIA: ChatbotLessonRawDisplay - onPlayAudio no es una función o no está disponible."
      );
      // alert("ADVERTENCIA: onPlayAudio no es una función.");
      return null; // No renderizar el botón si la función no está disponible
    }

    return (
      <button
        onClick={() => {
          console.log(
            "DEBUG: ChatbotLessonRawDisplay - Botón de audio clicado para frase:",
            phrase
          );
          onPlayAudio(phrase, "en-US");
        }}
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
  };

  // Determinar si el botón "Siguiente" debe estar deshabilitado
  const isNextButtonDisabled =
    !lessonExercises ||
    currentDisplayedExerciseIndex >= lessonExercises.length - 1;
  console.log(
    "DEBUG: ChatbotLessonRawDisplay - isNextButtonDisabled:",
    isNextButtonDisabled
  );

  return (
    <div className='chatbot-raw-display-container'>
      <h3 className='chatbot-raw-display-title'>Lección Chatbot (Historial)</h3>
      <p className='info-text-debug'>
        (Los ejercicios se mostrarán uno a uno. Haz clic en "Siguiente" para ver
        el siguiente.)
      </p>
      <hr style={{ borderTop: "1px dashed #ddd", margin: "15px 0" }} />

      <div className='chat-history-area' ref={chatContainerRef}>
        {displayedExercises.map((exercise, index) => (
          <div
            key={exercise.ExerciseID || index}
            className='chatbot-raw-display-exercise-block'
          >
            <h4>
              Ejercicio {exercise.OrderInLesson} - Tipo: {exercise.Type}
            </h4>
            {exercise.Notes && (
              <p className='label-notes'>
                <strong>Notas:</strong> {exercise.Notes}
              </p>
            )}
            <p>
              <strong className='label-en'>Question EN:</strong>{" "}
              {exercise.QuestionEN}
              {onPlayAudio && playAudioButton(exercise.QuestionEN)}{" "}
              {/* Llama a playAudioButton solo si onPlayAudio existe */}
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
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={handleShowNextExercise}
          className='button primary-button'
          disabled={isNextButtonDisabled}
        >
          {currentDisplayedExerciseIndex === -1
            ? "Comenzar Lección"
            : "Siguiente Ejercicio"}
        </button>
      </div>

      {isNextButtonDisabled && currentDisplayedExerciseIndex !== -1 && (
        <p className='chatbot-raw-display-footer'>
          Fin de la lección de chatbot.
        </p>
      )}
    </div>
  );
};

export default ChatbotLessonRawDisplay;
