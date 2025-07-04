// src/lesson/components/LessonChatFlowDisplay.js
// Este componente gestiona y muestra una lección completa como un flujo de chat continuo.

import React, { useState, useEffect, useRef } from "react";
import { normalizeText, renderClickableText } from "../../utils/textUtils";
import SpeechToTextButton from "../../components/SpeechToTextButton"; // Asumiendo que SpeechToTextButton está en src/components/
import "./ChatbotLessonRawDisplay.css";

const LessonChatFlowDisplay = ({
  lessonExercises, // Array completo de ejercicios de la lección
  onPlayAudio,
  appIsLoading,
  setAppMessage,
  onDialogueComplete, // Callback cuando todos los ejercicios de la lección han sido completados
}) => {
  // Estado para el progreso a través de los ejercicios de la lección
  const [currentLessonExerciseIndex, setCurrentLessonExerciseIndex] =
    useState(0);
  // Estado para almacenar el historial de mensajes (AI y respuestas de usuario)
  const [chatMessages, setChatMessages] = useState([]);
  // Estado para el input de texto del usuario (general para todos los inputs)
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  // Estado para el feedback del último intento del usuario en el ejercicio actual
  const [currentExerciseFeedback, setCurrentExerciseFeedback] = useState(null); // 'correct', 'incorrect'
  const [currentExerciseExpectedAnswer, setCurrentExerciseExpectedAnswer] =
    useState(""); // Para mostrar la respuesta correcta si falla
  // Estado para el texto grabado por el micrófono
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // Estado para almacenar el estado de respuesta de CADA ejercicio
  // { [exerciseId]: { answered: boolean, correct: boolean, userAnswer: string } }
  const [exerciseCompletionStates, setExerciseCompletionStates] = useState({});

  const chatContainerRef = useRef(null); // Para hacer scroll automático

  // Efecto para inicializar el chat y añadir el primer mensaje de la IA
  useEffect(() => {
    setChatMessages([]);
    setCurrentLessonExerciseIndex(0);
    setCurrentExerciseFeedback(null);
    setCurrentExerciseExpectedAnswer("");
    setUserTypedAnswer("");
    setRecordedMicrophoneText("");
    setAppMessage("");
    setExerciseCompletionStates({}); // Reiniciar estados de completado de ejercicios

    if (lessonExercises && lessonExercises.length > 0) {
      const firstExercise = lessonExercises[0];
      if (firstExercise) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `ai-intro-${firstExercise.ExerciseID || Date.now()}`,
            speaker: "ai",
            questionEN: firstExercise.QuestionEN,
            questionES: firstExercise.QuestionES,
            type: firstExercise.Type,
            optionsEN: firstExercise.OptionsEN,
            answerEN: firstExercise.AnswerEN,
            notes: firstExercise.Notes,
            orderInLesson: firstExercise.OrderInLesson,
          },
        ]);
        // Inicializar la respuesta esperada para el primer ejercicio
        setCurrentExerciseExpectedAnswer(
          firstExercise.AnswerEN || firstExercise.QuestionEN || ""
        );
      }
    }
  }, [
    lessonExercises,
    setAppMessage,
    setUserTypedAnswer,
    setRecordedMicrophoneText,
  ]); // Dependencias para reinicializar si la lección cambia

  // Efecto para hacer scroll al final del chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]); // Se dispara cada vez que se añade un mensaje

  // --- Lógica de Manejo de Envío de Respuesta para CADA Ejercicio ---
  const handleExerciseSubmit = (exerciseBeingAnswered) => {
    // Si el ejercicio ya fue respondido, no hacer nada
    if (exerciseCompletionStates[exerciseBeingAnswered.ExerciseID]?.answered) {
      setAppMessage("Este ejercicio ya fue respondido.");
      return;
    }

    if (
      !userTypedAnswer.trim() &&
      exerciseBeingAnswered.Type !== "practice_multiple_choice"
    ) {
      setAppMessage("Por favor, escribe tu respuesta.");
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    let normalizedCorrectAnswer;

    // Determinar la respuesta esperada según el tipo de ejercicio
    if (
      exerciseBeingAnswered.Type === "practice_fill_in_the_blank" ||
      exerciseBeingAnswered.Type === "practice_multiple_choice"
    ) {
      normalizedCorrectAnswer = normalizeText(
        exerciseBeingAnswered.AnswerEN || ""
      );
    } else if (exerciseBeingAnswered.Type === "practice_listening") {
      normalizedCorrectAnswer = normalizeText(
        exerciseBeingAnswered.QuestionEN || ""
      );
    } else if (exerciseBeingAnswered.Type === "practice_translation") {
      normalizedCorrectAnswer = normalizeText(
        exerciseBeingAnswered.AnswerEN || ""
      );
    } else if (exerciseBeingAnswered.Type === "practice_chat") {
      // En este modelo, practice_chat es un ejercicio completo, no un paso interno.
      // Su 'answerEN' es la respuesta esperada para el usuario.
      normalizedCorrectAnswer = normalizeText(
        exerciseBeingAnswered.AnswerEN || ""
      );
    } else {
      normalizedCorrectAnswer = "";
    }

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    setCurrentExerciseFeedback(isCorrect ? "correct" : "incorrect");
    setCurrentExerciseExpectedAnswer(normalizedCorrectAnswer);
    setAppMessage(isCorrect ? "¡Correcto!" : "Incorrecto. Intenta de nuevo.");

    // Añadir la respuesta del usuario al historial de chat
    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-response-${exerciseBeingAnswered.ExerciseID}-${Date.now()}`,
        speaker: "user",
        phraseEN: userTypedAnswer,
        expectedEN:
          exerciseBeingAnswered.AnswerEN || exerciseBeingAnswered.QuestionEN, // Guarda la respuesta esperada para referencia
        isCorrect: isCorrect,
      },
    ]);

    // Marcar el ejercicio como respondido
    setExerciseCompletionStates((prev) => ({
      ...prev,
      [exerciseBeingAnswered.ExerciseID]: {
        answered: true,
        correct: isCorrect,
        userAnswer: userTypedAnswer,
      },
    }));

    setUserTypedAnswer(""); // Limpiar el input

    // Si es correcto, avanzar al siguiente ejercicio después de un breve retraso
    if (isCorrect) {
      setTimeout(() => {
        const nextIndex = currentLessonExerciseIndex + 1;
        if (nextIndex < lessonExercises.length) {
          const nextExercise = lessonExercises[nextIndex];
          setChatMessages((prev) => [
            ...prev,
            {
              id: `ai-exercise-${nextExercise.ExerciseID || Date.now()}`,
              speaker: "ai",
              questionEN: nextExercise.QuestionEN,
              questionES: nextExercise.QuestionES,
              type: nextExercise.Type,
              optionsEN: nextExercise.OptionsEN,
              answerEN: nextExercise.AnswerEN,
              notes: nextExercise.Notes,
              orderInLesson: nextExercise.OrderInLesson,
            },
          ]);
          setCurrentLessonExerciseIndex(nextIndex); // Avanza al siguiente ejercicio de la lección
          setCurrentExerciseFeedback(null); // Reiniciar feedback
          setCurrentExerciseExpectedAnswer(""); // Reiniciar respuesta esperada
          setAppMessage("");
          setRecordedMicrophoneText(""); // Limpiar micrófono
        } else {
          // Todos los ejercicios de la lección han terminado
          setAppMessage("¡Lección completada!");
          onDialogueComplete(); // Notificar al padre
        }
      }, 1000);
    }
  };

  // Renderizar el botón de reproducción de audio
  const playAudioButton = (phrase) => (
    <button
      onClick={() => onPlayAudio(phrase, "en-US")}
      className='button audio-button-round primary-button small-button'
      disabled={appIsLoading}
      aria-label={`Reproducir: ${phrase}`}
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
      exerciseCompletionStates[exercise.ExerciseID]?.userAnswer ||
      userTypedAnswer;

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
                className={`button multiple-choice-button 
                  ${
                    isAnswered &&
                    normalizeText(option) === normalizeText(exercise.AnswerEN)
                      ? "correct-option"
                      : ""
                  }
                  ${
                    isAnswered &&
                    normalizeText(option) ===
                      normalizeText(displayUserAnswer) &&
                    !isCorrect
                      ? "incorrect-selected-option"
                      : ""
                  }
                `}
                onClick={() => {
                  if (!isAnswered) {
                    setUserTypedAnswer(option);
                    handleExerciseSubmit(exercise);
                  }
                }}
                disabled={isAnswered || appIsLoading}
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
                value={isAnswered ? displayUserAnswer : userTypedAnswer}
                onChange={(e) => setUserTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAnswered)
                    handleExerciseSubmit(exercise);
                }}
                disabled={isAnswered || appIsLoading}
              />
              {parts[1]}
            </p>
            <p className='fill-in-the-blank-translation'>
              {exercise.QuestionES}
            </p>
            {!isAnswered && (
              <button
                onClick={() => handleExerciseSubmit(exercise)}
                className='button primary-button chat-send-button'
                disabled={isAnswered || appIsLoading}
              >
                Verificar
              </button>
            )}
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
              value={isAnswered ? displayUserAnswer : userTypedAnswer}
              onChange={(e) => setUserTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAnswered)
                  handleExerciseSubmit(exercise);
              }}
              disabled={isAnswered || appIsLoading}
            />
            {microphoneButton(exercise.ExerciseID)}
            {!isAnswered && (
              <button
                onClick={() => handleExerciseSubmit(exercise)}
                className='button primary-button chat-send-button'
                disabled={isAnswered || appIsLoading}
              >
                Enviar
              </button>
            )}
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
              value={isAnswered ? displayUserAnswer : userTypedAnswer}
              onChange={(e) => setUserTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAnswered)
                  handleExerciseSubmit(exercise);
              }}
              disabled={isAnswered || appIsLoading}
            />
            {microphoneButton(exercise.ExerciseID)}
            {!isAnswered && (
              <button
                onClick={() => handleExerciseSubmit(exercise)}
                className='button primary-button chat-send-button'
                disabled={isAnswered || appIsLoading}
              >
                Verificar
              </button>
            )}
          </div>
        );
      case "practice_chat": // Si el tipo es practice_chat (como el ejercicio principal del chatbot)
        return (
          <div className='chat-input-area'>
            {/* Aquí el input es para la respuesta del usuario al turno de la IA */}
            <input
              type='text'
              className='input-field chat-input'
              placeholder='Tu respuesta en inglés...'
              value={isAnswered ? displayUserAnswer : userTypedAnswer}
              onChange={(e) => setUserTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAnswered)
                  handleExerciseSubmit(exercise);
              }}
              disabled={isAnswered || appIsLoading}
            />
            {microphoneButton(exercise.ExerciseID)}
            {!isAnswered && (
              <button
                onClick={() => handleExerciseSubmit(exercise)}
                className='button primary-button chat-send-button'
                disabled={isAnswered || appIsLoading}
              >
                Enviar
              </button>
            )}
          </div>
        );
      default:
        return (
          <p className='info-text'>
            Tipo de ejercicio no soportado: {exercise.Type}
          </p>
        );
    }
  };

  return (
    <div className='chat-lesson-container'>
      <div className='chat-container' ref={chatContainerRef}>
        {lessonExercises.map((exercise, index) => {
          const exerciseState = exerciseCompletionStates[
            exercise.ExerciseID
          ] || { answered: false, correct: false };
          const isAnswered = exerciseState.answered;
          const isCorrect = exerciseState.correct;
          const expectedAnswerForDisplay =
            exercise.AnswerEN || exercise.QuestionEN; // Para mostrar la respuesta correcta

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

      {/* Mensaje de lección completada */}
      {dialogueCompleted && (
        <p
          className='info-text'
          style={{ textAlign: "center", marginTop: "20px" }}
        >
          ¡Lección de chat completada!
        </p>
      )}
    </div>
  );
};

export default LessonChatModule;
