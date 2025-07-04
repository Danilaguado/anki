// src/lesson/components/ChatbotLessonRawDisplay.js
// Este componente muestra los ejercicios de una lección chatbot de forma secuencial con scroll e interactividad.

import React, { useState, useEffect, useRef } from "react";
import "./ChatbotLessonRawDisplay.css"; // Importa el CSS personal
import { normalizeText, renderClickableText } from "../../utils/textUtils"; // Necesario para normalizar y renderizar texto
import SpeechToTextButton from "../../components/SpeechToTextButton"; // Necesario para el botón de micrófono

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
  // Estado para almacenar el estado de respuesta de CADA ejercicio
  // { [exerciseId]: { answered: boolean, correct: boolean, userAnswer: string } }
  const [exerciseCompletionStates, setExerciseCompletionStates] = useState({});

  // Estado para el input de texto del usuario (un solo input para todos los inputs)
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  // Estado para el texto grabado por el micrófono (un solo estado para todos los micrófonos)
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  const chatContainerRef = useRef(null); // Para hacer scroll automático

  // Efecto para inicializar el chat y añadir el primer mensaje de la IA
  useEffect(() => {
    setDisplayedExercises([]);
    setCurrentDisplayedExerciseIndex(-1);
    setExerciseCompletionStates({});
    setUserTypedAnswer("");
    setRecordedMicrophoneText("");
    setAppMessage(""); // Limpiar mensaje global al inicio de la lección
  }, [lessonExercises, setAppMessage]);

  // Efecto para hacer scroll al final del chat cuando se añade un nuevo ejercicio
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [displayedExercises]); // Se dispara cada vez que se añade un ejercicio

  // Función para avanzar y mostrar el siguiente ejercicio
  const handleShowNextExercise = () => {
    const nextIndex = currentDisplayedExerciseIndex + 1;
    if (lessonExercises && nextIndex < lessonExercises.length) {
      const nextExercise = lessonExercises[nextIndex];
      setDisplayedExercises((prev) => [...prev, nextExercise]); // Añadir el nuevo ejercicio al historial
      setCurrentDisplayedExerciseIndex(nextIndex); // Actualizar el índice
    } else {
      // Todos los ejercicios han sido mostrados
      setAppMessage("¡Todos los ejercicios han sido mostrados!");
    }
  };

  // --- Lógica de Manejo de Envío de Respuesta para CADA Ejercicio ---
  const handleExerciseSubmit = (exerciseBeingAnswered) => {
    // Si el ejercicio ya fue respondido, no permitir re-enviar
    if (exerciseCompletionStates[exerciseBeingAnswered.ExerciseID]?.answered) {
      setAppMessage("Este ejercicio ya fue respondido.");
      return;
    }

    // Validar que el input no esté vacío para tipos que lo requieren
    if (
      !userTypedAnswer.trim() &&
      !["multiple_choice", "practice_multiple_choice"].includes(
        exerciseBeingAnswered.Type
      )
    ) {
      setAppMessage("Por favor, escribe tu respuesta para este ejercicio.");
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    let normalizedCorrectAnswer;

    // Determinar la respuesta esperada según el tipo de ejercicio
    if (
      exerciseBeingAnswered.Type === "fill_in_the_blank" ||
      exerciseBeingAnswered.Type === "multiple_choice" ||
      exerciseBeingAnswered.Type === "practice_fill_in_the_blank" ||
      exerciseBeingAnswered.Type === "practice_multiple_choice"
    ) {
      normalizedCorrectAnswer = normalizeText(
        exerciseBeingAnswered.AnswerEN || ""
      );
    } else if (
      exerciseBeingAnswered.Type === "listening" ||
      exerciseBeingAnswered.Type === "practice_listening"
    ) {
      normalizedCorrectAnswer = normalizeText(
        exerciseBeingAnswered.QuestionEN || ""
      );
    } else if (
      exerciseBeingAnswered.Type === "translation" ||
      exerciseBeingAnswered.Type === "practice_translation"
    ) {
      normalizedCorrectAnswer = normalizeText(
        exerciseBeingAnswered.AnswerEN || ""
      ); // Traducción se verifica contra AnswerEN
    } else if (exerciseBeingAnswered.Type === "practice_chat") {
      normalizedCorrectAnswer = normalizeText(
        exerciseBeingAnswered.AnswerEN || ""
      );
    } else {
      normalizedCorrectAnswer = "";
    }

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    // Actualizar el estado de completado para este ejercicio específico
    setExerciseCompletionStates((prev) => ({
      ...prev,
      [exerciseBeingAnswered.ExerciseID]: {
        answered: true,
        correct: isCorrect,
        userAnswer: userTypedAnswer,
      },
    }));

    // Mostrar feedback global y limpiar input
    if (isCorrect) {
      setAppMessage("¡Correcto!");
    } else {
      setAppMessage(
        `Incorrecto. La respuesta esperada era: ${
          exerciseBeingAnswered.AnswerEN || exerciseBeingAnswered.QuestionEN
        }`
      );
    }
    setUserTypedAnswer(""); // Limpiar el input después de responder
    setRecordedMicrophoneText(""); // Limpiar texto del micrófono
  };

  // Renderizar el botón de reproducción de audio
  const playAudioButton = (phrase) => {
    if (typeof onPlayAudio !== "function") {
      console.warn(
        "ADVERTENCIA: onPlayAudio no es una función o no está disponible."
      );
      return null;
    }
    return (
      <button
        onClick={() => onPlayAudio(phrase, "en-US")}
        className='button audio-button-round primary-button small-button'
        disabled={appIsLoading}
        aria-label={`Reproducir: ${phrase}`}
        style={{ marginLeft: "10px", flexShrink: 0 }}
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

  // Renderizar el botón de micrófono
  const microphoneButton = (exerciseId) => (
    <SpeechToTextButton
      onResult={(transcript) => {
        setRecordedMicrophoneText(transcript);
        setUserTypedAnswer(transcript);
      }}
      lang='en-US'
      disabled={appIsLoading || exerciseCompletionStates[exerciseId]?.answered}
    />
  );

  // Renderiza el contenido interactivo de un ejercicio
  const renderInteractiveExerciseContent = (exercise) => {
    const isAnswered = exerciseCompletionStates[exercise.ExerciseID]?.answered;
    const isCorrect = exerciseCompletionStates[exercise.ExerciseID]?.correct;
    const displayUserAnswer =
      exerciseCompletionStates[exercise.ExerciseID]?.userAnswer; // Mostrar la respuesta del usuario si ya respondió

    // Renderizar el input/opciones solo si el ejercicio no ha sido respondido
    if (isAnswered) {
      return (
        <div className='chat-answered-display'>
          <p className='user-answered-text'>
            Tu respuesta: {displayUserAnswer}
          </p>
          <p
            className={`chat-feedback-message ${
              isCorrect ? "correct" : "incorrect"
            }`}
          >
            {isCorrect
              ? "¡Correcto!"
              : `Esperado: ${exercise.AnswerEN || exercise.QuestionEN}`}
          </p>
        </div>
      );
    }

    // Si no ha sido respondido, renderizar los elementos interactivos
    switch (exercise.Type) {
      case "multiple_choice":
      case "practice_multiple_choice": // Incluir tipos de práctica si es necesario
        const options = [...(exercise.OptionsEN || []), exercise.AnswerEN].sort(
          () => Math.random() - 0.5
        );
        return (
          <div className='multiple-choice-options'>
            {options.map((option, idx) => (
              <button
                key={idx}
                className='button multiple-choice-button'
                onClick={() => {
                  setUserTypedAnswer(option); // Establecer la opción seleccionada en el input
                  handleExerciseSubmit(exercise); // Envía la respuesta
                }}
                disabled={appIsLoading}
              >
                {option}
              </button>
            ))}
          </div>
        );
      case "fill_in_the_blank":
      case "practice_fill_in_the_blank":
        const blankPlaceholder = "_______";
        const parts = exercise.QuestionEN.split(blankPlaceholder);
        return (
          <div className='chat-input-area'>
            <p className='chat-exercise-question'>
              {parts[0]}
              <input
                type='text'
                className='input-field chat-input-inline'
                value={userTypedAnswer}
                onChange={(e) => setUserTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExerciseSubmit(exercise);
                }}
                disabled={appIsLoading}
              />
              {parts[1]}
            </p>
            <p className='fill-in-the-blank-translation'>
              {exercise.QuestionES}
            </p>
            <button
              onClick={() => handleExerciseSubmit(exercise)}
              className='button primary-button chat-send-button'
              disabled={appIsLoading}
            >
              Verificar
            </button>
          </div>
        );
      case "translation":
      case "practice_translation":
        return (
          <div className='chat-input-area'>
            <p className='chat-exercise-question'>{exercise.QuestionEN}</p>
            <p className='chat-translation-hint'>{exercise.QuestionES}</p>
            <input
              type='text'
              className='input-field chat-input'
              placeholder='Tu traducción en inglés...'
              value={userTypedAnswer}
              onChange={(e) => setUserTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleExerciseSubmit(exercise);
              }}
              disabled={appIsLoading}
            />
            {microphoneButton(exercise.ExerciseID)}
            <button
              onClick={() => handleExerciseSubmit(exercise)}
              className='button primary-button chat-send-button'
              disabled={appIsLoading}
            >
              Enviar
            </button>
          </div>
        );
      case "listening":
      case "practice_listening":
        return (
          <div className='chat-input-area'>
            <p className='chat-exercise-question'>
              Escucha y escribe lo que oigas:
            </p>
            <p className='chat-translation-hint'>{exercise.QuestionES}</p>
            {recordedMicrophoneText && (
              <div className='recorded-text-display'>
                {recordedMicrophoneText}
              </div>
            )}
            <input
              type='text'
              className='input-field chat-input'
              placeholder='Escribe lo que escuchaste aquí'
              value={userTypedAnswer}
              onChange={(e) => setUserTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleExerciseSubmit(exercise);
              }}
              disabled={appIsLoading}
            />
            {microphoneButton(exercise.ExerciseID)}
            <button
              onClick={() => handleExerciseSubmit(exercise)}
              className='button primary-button chat-send-button'
              disabled={appIsLoading}
            >
              Verificar
            </button>
          </div>
        );
      case "practice_chat": // Si el tipo es practice_chat (como el ejercicio principal del chatbot)
        return (
          <div className='chat-input-area'>
            <input
              type='text'
              className='input-field chat-input'
              placeholder='Tu respuesta en inglés...'
              value={userTypedAnswer}
              onChange={(e) => setUserTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleExerciseSubmit(exercise);
              }}
              disabled={appIsLoading}
            />
            {microphoneButton(exercise.ExerciseID)}
            <button
              onClick={() => handleExerciseSubmit(exercise)}
              className='button primary-button chat-send-button'
              disabled={appIsLoading}
            >
              Enviar
            </button>
          </div>
        );
      default:
        return (
          <p className='info-info'>
            Tipo de ejercicio no soportado: {exercise.Type}
          </p>
        );
    }
  };

  // Determinar si el botón "Siguiente" debe estar deshabilitado
  const isNextButtonDisabled =
    !lessonExercises ||
    currentDisplayedExerciseIndex >= lessonExercises.length - 1;

  return (
    <div className='chatbot-raw-display-container'>
      <h3 className='chatbot-raw-display-title'>
        Lección Chatbot (Historial Interactivo)
      </h3>
      <p className='info-text-debug'>
        (Los ejercicios se mostrarán uno a uno. Haz clic en "Siguiente" para ver
        el siguiente.)
      </p>
      <hr style={{ borderTop: "1px dashed #ddd", margin: "15px 0" }} />

      <div className='chat-history-area' ref={chatContainerRef}>
        {displayedExercises.map((exercise, index) => {
          const exerciseState = exerciseCompletionStates[
            exercise.ExerciseID
          ] || { answered: false, correct: false, userAnswer: "" };
          const isAnswered = exerciseState.answered;
          const isCorrect = exerciseState.correct;
          const expectedAnswerForDisplay =
            exercise.AnswerEN || exercise.QuestionEN;

          return (
            <div
              key={exercise.ExerciseID || index}
              className='chat-message-block'
            >
              {/* Mensaje de la IA (pregunta del ejercicio) */}
              <div className='chat-message ai'>
                {exercise.Notes && (
                  <div className='exercise-notes-display'>
                    <p>{exercise.Notes}</p>
                  </div>
                )}
                <div className='chat-text-with-audio'>
                  <span>{exercise.QuestionEN}</span>
                  {onPlayAudio && playAudioButton(exercise.QuestionEN)}
                </div>
                <p className='chat-translation'>{exercise.QuestionES}</p>
              </div>

              {/* Contenido interactivo del ejercicio */}
              <div
                className={`chat-interactive-area ${
                  isAnswered
                    ? isCorrect
                      ? "match-correct"
                      : "match-incorrect"
                    : ""
                }`}
              >
                {renderInteractiveExerciseContent(exercise)}
              </div>

              {/* Mostrar feedback de acierto/error para este ejercicio */}
              {isAnswered && (
                <p
                  className={`chat-feedback-message ${
                    isCorrect ? "correct" : "incorrect"
                  }`}
                >
                  {isCorrect
                    ? "¡Correcto!"
                    : `Incorrecto. La respuesta esperada era: ${expectedAnswerForDisplay}`}
                </p>
              )}
            </div>
          );
        })}
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
