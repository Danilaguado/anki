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
    let normalizedCorrectAnswer = normalizeText(currentExercise.AnswerEN || "");

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
        // CAMBIO: Se añade la clase 'lesson-exercise-card' para aplicar los nuevos estilos
        <div
          className={`card-container lesson-exercise-card ${
            matchFeedback ? `match-${matchFeedback}` : ""
          }`}
        >
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

          {/* El componente ExerciseDisplay ahora recibe 'onShowNotes' */}
          <ExerciseDisplay
            currentExercise={currentStandardExercise}
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
            onShowNotes={onShowNotes} // Se pasa la función para mostrar notas
          />

          {/* Este grupo de botones será empujado al fondo por CSS */}
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
                (userTypedAnswer === "" && !matchFeedback) ||
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
