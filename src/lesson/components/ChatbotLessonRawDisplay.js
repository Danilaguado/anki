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
  const [currentUserInput, setCurrentUserInput] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [exerciseCompletionStates, setExerciseCompletionStates] = useState({});
  const chatContainerRef = useRef(null);
  const actionButtonRef = useRef(null);

  useEffect(() => {
    setDisplayedExercises([]);
    setCurrentExerciseIndex(-1);
    setExerciseCompletionStates({});
    setCurrentUserInput("");
    setMatchFeedback(null);
    setAppMessage("Comienza la lección de chat.");
  }, [lessonExercises, setAppMessage]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, [displayedExercises]);

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

  const handleShowNextExercise = () => {
    const nextIndex = currentExerciseIndex + 1;
    if (lessonExercises && nextIndex < lessonExercises.length) {
      const newExercise = lessonExercises[nextIndex];
      const previousExercise =
        displayedExercises[displayedExercises.length - 1];
      if (previousExercise) {
        const previousState =
          exerciseCompletionStates[previousExercise.ExerciseID];
        if (previousState) {
          setDisplayedExercises((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...previousExercise,
              userAnswer: previousState.userAnswer,
              feedback: previousState.correct,
            };
            return [...updated, newExercise];
          });
        } else {
          setDisplayedExercises((prev) => [...prev, newExercise]);
        }
      } else {
        setDisplayedExercises([newExercise]);
      }
      setCurrentExerciseIndex(nextIndex);
      setCurrentUserInput("");
      setMatchFeedback(null);
      setAppMessage("");
    } else {
      setAppMessage("¡Has completado la lección de chatbot!");
    }
  };

  const handleMainActionClick = () => {
    if (matchFeedback) {
      handleShowNextExercise();
    } else {
      handleCheckAnswer();
    }
  };

  const renderInteractiveExerciseContent = (exercise) => {
    const exerciseState = exerciseCompletionStates[exercise.ExerciseID] || {};
    if (exerciseState.answered) return null;
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
    return null;
  };

  return (
    <div className='chatbot-raw-display-container'>
      <div className='chat-history-area' ref={chatContainerRef}>
        {displayedExercises.map((exercise) => {
          const exerciseState =
            exerciseCompletionStates[exercise.ExerciseID] || {};
          return (
            <div key={exercise.ExerciseID} className='chat-message-block'>
              <div className='chat-message ai'>
                <div className='chat-bubble'>
                  {/* CAMBIO: Contenedor para alinear texto y botón de play */}
                  <div className='chat-text-with-audio'>
                    <button
                      className='chat-play-button'
                      onClick={() => onPlayAudio(exercise.QuestionEN, "en-US")}
                      disabled={appIsLoading}
                      aria-label='Reproducir audio'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='16'
                        height='16'
                        fill='currentColor'
                        viewBox='0 0 16 16'
                      >
                        <path d='M8 6.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0v-3z' />
                        <path d='M5.5 5.5A.5.5 0 0 1 6 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm9 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM3 5.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm10 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z' />
                      </svg>
                    </button>
                    <p>{exercise.QuestionEN}</p>
                  </div>
                  {exercise.QuestionES && (
                    <p className='chat-translation'>{exercise.QuestionES}</p>
                  )}
                </div>
              </div>
              {exercise.userAnswer && (
                <div className='chat-message user'>
                  <div
                    className={`chat-bubble ${
                      exercise.feedback ? "correct" : "incorrect"
                    }`}
                  >
                    {exercise.userAnswer}
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
