// src/lesson/lessonCard.js

import React, { useState, useEffect, useContext } from "react";
import "./PrincipalPageLessons.css";
import { normalizeText } from "../utils/textUtils";
import ExerciseDisplay from "./components/ExerciseDisplay";
import ChatbotLessonRawDisplay from "./components/ChatbotLessonRawDisplay";
import AppContext from "../context/AppContext";

const LessonCard = ({ lesson, onShowNotes }) => {
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  useEffect(() => {
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText("");
  }, [currentExerciseIndex, lesson]);

  // ✅ CAMBIO CLAVE: Se elimina setAppMessage de las dependencias.
  // Este efecto debe reiniciarse solo cuando la lección ('lesson') cambie.
  useEffect(() => {
    setCurrentExerciseIndex(0);
    setAppMessage("");
  }, [lesson]);

  if (!lesson || !lesson.exercises || lesson.exercises.length === 0) {
    return (
      <p className='info-text'>
        Esta lección no tiene ejercicios o no se ha podido cargar.
      </p>
    );
  }

  const isChatbotLesson =
    (lesson.TypeModule || "").toLowerCase().trim() === "chatbot_lesson";

  const currentStandardExercise = lesson.exercises[currentExerciseIndex];

  const handleCheckAnswer = () => {
    if (
      !userTypedAnswer.trim() &&
      !["multiple_choice", "practice_multiple_choice"].includes(
        currentStandardExercise.Type
      )
    ) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      return;
    }
    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    const currentExercise = lesson.exercises[currentExerciseIndex];
    let normalizedCorrectAnswer;

    if (
      currentExercise.Type === "fill_in_the_blank" ||
      currentExercise.Type === "multiple_choice"
    ) {
      normalizedCorrectAnswer = normalizeText(currentExercise.AnswerEN || "");
    } else if (currentExercise.Type === "listening") {
      normalizedCorrectAnswer = normalizeText(currentExercise.QuestionEN || "");
    } else {
      normalizedCorrectAnswer = normalizeText(currentExercise.AnswerES || "");
    }

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage(
        "Incorrecto. La respuesta esperada era: " +
          (currentExercise.AnswerEN || currentExercise.QuestionEN)
      );
    }
  };

  const handleOptionClick = (selectedOption) => {
    if (matchFeedback !== null) return;
    setUserTypedAnswer(selectedOption);
  };

  const handleSpeechResultForListening = (transcript) => {
    setRecordedMicrophoneText(transcript);
  };

  const handleCheckOrContinue = () => {
    if (matchFeedback === "correct" || matchFeedback === "incorrect") {
      if (currentExerciseIndex < lesson.exercises.length - 1) {
        setCurrentExerciseIndex((prev) => prev + 1);
        setAppMessage("");
      } else {
        setAppMessage("¡Has completado esta lección!");
      }
    } else {
      handleCheckAnswer();
    }
  };

  return (
    <div className='lesson-detail-view-content'>
      {isChatbotLesson ? (
        <ChatbotLessonRawDisplay
          lessonExercises={lesson.exercises}
          onPlayAudio={onPlayAudio}
          appIsLoading={appIsLoading}
          setAppMessage={setAppMessage}
          onShowNotes={onShowNotes}
        />
      ) : (
        <div
          className={`card-container lesson-exercise-card ${
            matchFeedback ? `match-${matchFeedback}` : ""
          }`}
        >
          {currentStandardExercise?.Notes && (
            <button
              className='notes-toggle-button'
              onClick={() => onShowNotes(currentStandardExercise.Notes)}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                fill='currentColor'
                viewBox='0 0 16 16'
              >
                <path
                  fillRule='evenodd'
                  d='M4.475 5.458c-.284 0-.514-.237-.47-.517C4.28 3.24 5.576 2 7.825 2c2.25 0 3.767 1.36 3.767 3.215 0 1.344-.665 2.288-1.79 2.973-1.1.659-1.414 1.118-1.414 2.01v.03a.5.5 0 0 1-.5.5h-.77a.5.5 0 0 1-.5-.495l-.003-.2c-.043-1.221.477-2.001 1.645-2.712 1.03-.632 1.397-1.135 1.397-2.028 0-.979-.758-1.698-1.926-1.698-1.009 0-1.71.529-1.938 1.402-.066.254-.278.461-.54.461h-.777ZM7.496 14c.622 0 1.095-.474 1.095-1.09 0-.618-.473-1.092-1.095-1.092-.606 0-1.087.474-1.087 1.091S6.89 14 7.496 14'
                />
              </svg>
            </button>
          )}

          {currentStandardExercise?.Image && (
            <div className='exercise-image-container'>
              <img
                src={currentStandardExercise.Image}
                alt={`Imagen para ${currentStandardExercise.Type} ejercicio`}
                className='exercise-image'
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/300x200/cccccc/ffffff?text=No+Image";
                }}
              />
            </div>
          )}

          <ExerciseDisplay
            currentExercise={currentStandardExercise}
            onPlayAudio={onPlayAudio}
            setAppMessage={setAppMessage}
            appIsLoading={appIsLoading}
            isAnswerVisible={isAnswerVisible}
            setIsAnswerVisible={setIsAnswerVisible}
            userTypedAnswer={userTypedAnswer}
            setUserTypedAnswer={setUserTypedAnswer}
            matchFeedback={matchFeedback}
            showCorrectAnswer={showCorrectAnswer}
            recordedMicrophoneText={recordedMicrophoneText}
            handleCheckAnswer={handleCheckAnswer}
            handleOptionClick={handleOptionClick}
            handleSpeechResultForListening={handleSpeechResultForListening}
          />

          <div className='navigation-buttons-group'>
            <button
              onClick={handleCheckOrContinue}
              className={`button primary-button check-continue-button ${
                matchFeedback === "correct" || matchFeedback === "incorrect"
                  ? "continue"
                  : "check"
              }`}
              disabled={
                appIsLoading ||
                (matchFeedback === "correct" &&
                  currentExerciseIndex >= lesson.exercises.length - 1)
              }
            >
              {matchFeedback === "correct" || matchFeedback === "incorrect"
                ? "Continuar"
                : "Comprobar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonCard;
