// src/lesson/lessonCard.js
import React, { useState, useEffect, useContext } from "react";

// 1) estilos de la carpeta lesson (mismo nivel)
import "./PrincipalPageLessons.css";

// 2) utilidades de texto en src/utils
import { normalizeText, renderClickableText } from "../utils/textUtils";

// 3) componentes de lesson en src/lesson/components
import ExerciseDisplay from "./components/ExerciseDisplay";
import ExerciseNavigation from "./components/ExerciseNavigation";

// 4) componentes de Practice en src/Practice
import PracticeChatInterface from "../Practice/PracticeChatInterface";
import PracticeExerciseDisplay from "../Practice/PracticeExerciseDisplay";
import PracticePage from "../Practice/PracticePage";

// 5) contexto global en src/components/context
import AppContext from "../context/AppContext";
const LessonCard = ({ lesson, onBack }) => {
  // Consumir valores del contexto
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // Estado para el índice del ejercicio actual dentro de la lección (solo para STANDARD_LESSON)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  // Estado para la visibilidad de la respuesta (para ejercicios de traducción)
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  // Estados para la entrada del usuario y el feedback en ejercicios interactivos
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  // Nuevo estado para el texto grabado por el micrófono en el ejercicio de escucha
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // NUEVO: Estado para el progreso del diálogo de chat cuando la lección es un chatbot
  // Este índice ahora rastrea el progreso a través de los *ejercicios de la lección*
  // dentro del PracticeChatInterface, no solo los pasos internos de un diálogo.
  const [chatLessonProgressIndex, setChatLessonProgressIndex] = useState(0);

  // Restablecer estados al cambiar de ejercicio o lección
  useEffect(() => {
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText("");
    setCurrentExerciseIndex(0); // Resetear el índice del ejercicio para flashcards
    setChatLessonProgressIndex(0); // Resetear el progreso del chat al cambiar de lección
  }, [lesson]); // Dependencia 'lesson' para resetear al cambiar la lección

  // Si no hay lección o ejercicios, mostrar mensaje
  if (!lesson || !lesson.exercises || lesson.exercises.length === 0) {
    return (
      <div className='lesson-detail-view section-container'>
        <p className='info-text'>
          No se ha seleccionado ninguna lección o esta lección no tiene
          ejercicios.
        </p>
        <button onClick={onBack} className='button back-button'>
          Volver a las Lecciones
        </button>
      </div>
    );
  }

  // El ejercicio actual para las lecciones estándar (flashcards)
  const currentStandardExercise = lesson.exercises[currentExerciseIndex];

  // --- Funciones de manejo de ejercicios (pasadas a ExerciseDisplay o usadas directamente) ---
  const handleNextExercise = () => {
    // Esta lógica de avance es para lecciones ESTÁNDAR (flashcards)
    const requiresAnswer = [
      "fill_in_the_blank",
      "multiple_choice",
      "listening",
    ].includes(currentStandardExercise.Type);
    if (requiresAnswer && matchFeedback === null) {
      setAppMessage(
        "Por favor, completa el ejercicio actual antes de avanzar."
      );
      return;
    }

    if (currentExerciseIndex < lesson.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setAppMessage("");
    } else {
      setAppMessage("¡Has completado esta lección!");
    }
  };

  const handlePrevExercise = () => {
    // Esta lógica de retroceso es para lecciones ESTÁNDAR (flashcards)
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      setAppMessage("");
    }
  };

  // Las funciones handleCheckAnswer, handleOptionClick, handleSpeechResultForListening
  // ahora son pasadas a ExerciseDisplay para STANDARD_LESSON.
  // Para CHATBOT_LESSON, PracticeChatInterface las gestiona internamente.
  const handleCheckAnswer = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    let normalizedCorrectAnswer;

    if (
      currentStandardExercise.Type === "fill_in_the_blank" ||
      currentStandardExercise.Type === "multiple_choice"
    ) {
      normalizedCorrectAnswer = normalizeText(
        currentStandardExercise.AnswerEN || ""
      );
    } else if (currentStandardExercise.Type === "listening") {
      normalizedCorrectAnswer = normalizeText(
        currentStandardExercise.QuestionEN || ""
      );
    } else {
      normalizedCorrectAnswer = normalizeText(
        currentStandardExercise.AnswerES || ""
      );
    }

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
    }
  };

  const handleOptionClick = (selectedOption) => {
    if (matchFeedback !== null) return;
    setUserTypedAnswer(selectedOption);

    const normalizedSelected = normalizeText(selectedOption);
    const normalizedCorrect = normalizeText(
      currentStandardExercise.AnswerEN || ""
    );

    if (normalizedSelected === normalizedCorrect) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
    }
  };

  const handleSpeechResultForListening = (transcript) => {
    setRecordedMicrophoneText(transcript);
    if (matchFeedback !== null) return;

    const normalizedTranscript = normalizeText(transcript);
    const normalizedQuestionEN = normalizeText(
      currentStandardExercise.QuestionEN || ""
    );

    if (normalizedTranscript === normalizedQuestionEN) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Excelente! Transcripción correcta.");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Escucha de nuevo.");
    }
  };

  // --- NUEVA FUNCIÓN: Manejar la finalización de un ejercicio de chat (dentro de la lección de chat) ---
  const handleChatExerciseComplete = (completedExerciseIndex) => {
    // Esta función se llama cuando un ejercicio (chat o refuerzo) dentro de PracticeChatInterface se completa.
    // Avanzamos el índice de progreso de la lección de chat.
    setAppMessage(
      `Ejercicio ${completedExerciseIndex + 1} completado. Avanzando...`
    );
    if (completedExerciseIndex < lesson.exercises.length - 1) {
      setChatLessonProgressIndex(completedExerciseIndex + 1); // Avanza al siguiente ejercicio de la lección
    } else {
      setAppMessage("¡Has completado esta lección de chat!");
      // Aquí podrías volver a la lista de lecciones o mostrar un resumen
    }
    setMatchFeedback(null); // Reiniciar feedback
    setShowCorrectAnswer(false);
    setUserTypedAnswer("");
    setRecordedMicrophoneText("");
  };

  // Determinar si la lección actual es un módulo de chatbot
  const isChatbotLesson = lesson.Type === "chatbot_lesson";

  return (
    <div className='lesson-detail-view section-container'>
      <h2 className='section-title'>Lección: {lesson.Title}</h2>
      <p className='lesson-meta-info'>
        <strong>Tema:</strong> {lesson.Topic} |<strong>Dificultad:</strong>{" "}
        {lesson.Difficulty} |<strong>Fecha:</strong>{" "}
        {new Date(lesson.GeneratedDate).toLocaleDateString()}
      </p>
      <p className='lesson-description'>{lesson.Description}</p>

      {/* Mostrar notas de la lección (si existen) */}
      {currentStandardExercise.Notes && ( // Mostrar notas solo para ejercicios estándar
        <div className='section-container lesson-notes'>
          <h3 className='subsection-title'>Notas:</h3>
          <p>{currentStandardExercise.Notes}</p>
        </div>
      )}

      {/* Mostrar la imagen del ejercicio si existe */}
      {currentStandardExercise.Image && ( // Mostrar imagen solo para ejercicios estándar
        <div className='exercise-image-container'>
          <img
            src={currentStandardExercise.Image}
            alt={`Imagen para ${currentStandardExercise.Type} ejercicio`}
            className='exercise-image'
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/300x200/cccccc/ffffff?text=No+Image`;
            }}
          />
        </div>
      )}

      {/* Renderizado condicional: Flujo de CHATBOT CONTINUO vs. Flashcards Estándar */}
      {isChatbotLesson ? (
        // Si es una lección de chatbot, renderizamos el PracticeChatInterface
        // y le pasamos TODOS los ejercicios de la lección para que los gestione internamente
        <PracticeChatInterface
          lessonExercises={lesson.exercises} // ¡NUEVO! Pasar TODOS los ejercicios de la lección
          onPlayAudio={onPlayAudio}
          appIsLoading={appIsLoading}
          userTypedAnswer={userTypedAnswer}
          setUserTypedAnswer={setUserTypedAnswer}
          setAppMessage={setAppMessage}
          onDialogueComplete={onBack} // Al completar toda la lección de chat, vuelve a la lista
          onExerciseComplete={handleChatExerciseComplete} // Callback al completar cada ejercicio de chat

          // Props que PracticeChatInterface gestiona localmente
          // matchFeedback={matchFeedback}
          // setMatchFeedback={setMatchFeedback}
          // showCorrectAnswer={showCorrectAnswer}
          // setShowCorrectAnswer={setShowCorrectAnswer}
          // recordedMicrophoneText={recordedMicrophoneText}
          // handleSpeechResultForListening={handleSpeechResultForListening}
          // expectedAnswerEN={currentExercise.AnswerEN} // Ya no se pasa, PracticeChatInterface lo obtiene de lessonExercises
        />
      ) : (
        // Si es una lección estándar (flashcards), el flujo es el mismo de antes
        <div
          className={`card-container lesson-exercise-card ${
            matchFeedback ? `match-${matchFeedback}` : ""
          }`}
        >
          {/* Componente para mostrar el ejercicio actual */}
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

          {/* El componente de navegación se muestra para TODOS los ejercicios estándar */}
          <ExerciseNavigation
            currentExerciseIndex={currentExerciseIndex}
            totalExercises={lesson.exercises.length}
            onNextExercise={handleNextExercise}
            onPrevExercise={handlePrevExercise}
            matchFeedback={matchFeedback}
            currentExerciseType={currentStandardExercise.Type}
            isChatDialogueComplete={false} // Siempre falso para lecciones estándar
          />
        </div>
      )}

      {/* Botón para volver a la lista de lecciones (siempre visible) */}
      <button
        onClick={onBack}
        className='button back-button return-to-list-button'
      >
        Volver a la lista de lecciones
      </button>
    </div>
  );
};

export default LessonCard;
