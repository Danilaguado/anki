// src/lesson/components/ChatbotLessonRawDisplay.js
import React, { useState, useEffect, useRef } from "react";
import "./ChatbotLessonRawDisplay.css";
import { normalizeText } from "../../utils/textUtils";
import SpeechToTextButton from "../../components/SpeechToTextButton";

const ChatbotLessonRawDisplay = ({
  lessonExercises,
  onPlayAudio,
  appIsLoading,
  setAppMessage,
}) => {
  const [displayedExercises, setDisplayedExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(-1);

  // Estados para el ejercicio *actualmente activo*
  const [currentUserInput, setCurrentUserInput] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null); // null, 'correct', 'incorrect'

  // Almacena el estado final de cada ejercicio
  const [exerciseCompletionStates, setExerciseCompletionStates] = useState({});

  const actionButtonRef = useRef(null); // Ancla para el botón de acción

  // Inicializar o reiniciar el chat
  useEffect(() => {
    setDisplayedExercises([]);
    setCurrentExerciseIndex(-1);
    setExerciseCompletionStates({});
    setCurrentUserInput("");
    setMatchFeedback(null);
    setAppMessage("Comienza la lección de chat.");
  }, [lessonExercises, setAppMessage]);

  // Scroll al botón de acción
  useEffect(() => {
    if (actionButtonRef.current) {
      actionButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [displayedExercises, matchFeedback]);

  // Función para verificar la respuesta del ejercicio actual
  const handleCheckAnswer = () => {
    if (!currentUserInput.trim()) {
      setAppMessage("Por favor, selecciona o escribe una respuesta.");
      return;
    }

    const currentExercise = lessonExercises[currentExerciseIndex];
    const normalizedUserAnswer = normalizeText(currentUserInput);
    const normalizedCorrectAnswer = normalizeText(
      currentExercise.AnswerEN || currentExercise.QuestionEN || ""
    );
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    setMatchFeedback(isCorrect ? "correct" : "incorrect");

    setExerciseCompletionStates((prev) => ({
      ...prev,
      [currentExercise.ExerciseID]: {
        answered: true,
        correct: isCorrect,
        userAnswer: currentUserInput,
      },
    }));
  };

  // Función para mostrar el siguiente ejercicio
  const handleShowNextExercise = () => {
    const nextIndex = currentExerciseIndex + 1;
    if (lessonExercises && nextIndex < lessonExercises.length) {
      setDisplayedExercises((prev) => [...prev, lessonExercises[nextIndex]]);
      setCurrentExerciseIndex(nextIndex);
      // Reiniciar estados para el nuevo ejercicio
      setCurrentUserInput("");
      setMatchFeedback(null);
      setAppMessage("");
    } else {
      setAppMessage("¡Has completado la lección de chatbot!");
    }
  };

  // Lógica del botón principal: o verifica o continúa
  const handleMainActionClick = () => {
    if (matchFeedback) {
      // Si ya hay feedback (correcto o incorrecto), continuar
      handleShowNextExercise();
    } else {
      // Si no, verificar
      handleCheckAnswer();
    }
  };

  // Renderiza el contenido interactivo de un ejercicio
  const renderInteractiveExerciseContent = (exercise) => {
    const exerciseState = exerciseCompletionStates[exercise.ExerciseID] || {};
    const isAnswered = exerciseState.answered;

    // Si ya se respondió, no mostrar más inputs
    if (isAnswered) {
      return (
        <div className='chat-answered-display'>
          <p className='user-answered-text'>
            Tu respuesta: {exerciseState.userAnswer}
          </p>
        </div>
      );
    }

    // Si es el ejercicio activo, mostrar los inputs
    if (
      exercise.ExerciseID === lessonExercises[currentExerciseIndex]?.ExerciseID
    ) {
      switch (exercise.Type) {
        case "multiple_choice":
          return (
            <div className='multiple-choice-options'>
              {exercise.OptionsEN.map((option, idx) => (
                <button
                  key={idx}
                  className={`button option-button ${
                    currentUserInput === option ? "selected" : ""
                  }`}
                  onClick={() => setCurrentUserInput(option)}
                  disabled={appIsLoading}
                >
                  {option}
                </button>
              ))}
            </div>
          );
        case "fill_in_the_blank":
        // ... (se puede añadir lógica similar para otros tipos)
        default:
          return (
            <input
              type='text'
              className='input-field chat-input'
              placeholder='Escribe tu respuesta...'
              value={currentUserInput}
              onChange={(e) => setCurrentUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCheckAnswer();
              }}
              disabled={appIsLoading}
            />
          );
      }
    }
    return null; // No mostrar nada para ejercicios pasados que no son el actual
  };

  return (
    <div className='chatbot-raw-display-container'>
      <div className='chat-history-area'>
        {displayedExercises.map((exercise) => {
          const exerciseState =
            exerciseCompletionStates[exercise.ExerciseID] || {};
          return (
            <div key={exercise.ExerciseID} className='chat-message-block'>
              <div className='chat-message ai'>
                <div className='chat-bubble'>
                  <p>{exercise.QuestionEN}</p>
                  {exercise.QuestionES && (
                    <p className='chat-translation'>{exercise.QuestionES}</p>
                  )}
                </div>
              </div>

              {exerciseState.answered && (
                <div className='chat-message user'>
                  <div
                    className={`chat-bubble ${
                      exerciseState.correct ? "correct" : "incorrect"
                    }`}
                  >
                    {exerciseState.userAnswer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className='chatbot-footer'>
        {currentExerciseIndex >= 0 &&
          renderInteractiveExerciseContent(
            lessonExercises[currentExerciseIndex]
          )}

        <div ref={actionButtonRef} style={{ paddingTop: "10px" }}>
          <button
            onClick={
              currentExerciseIndex === -1
                ? handleShowNextExercise
                : handleMainActionClick
            }
            className={`button primary-button check-continue-button ${
              matchFeedback === "correct" ? "correct" : ""
            }`}
            disabled={
              appIsLoading ||
              (currentExerciseIndex >= 0 && !matchFeedback && !currentUserInput)
            }
          >
            {currentExerciseIndex === -1
              ? "Comenzar Lección"
              : matchFeedback
              ? "Continuar"
              : "Verificar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotLessonRawDisplay;
