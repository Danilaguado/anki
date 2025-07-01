// src/lesson/lessonCard.js
import React, { useState, useEffect, useContext } from "react";
import "./PrincipalPageLessons.css"; // Estilos compartidos para lecciones (mismo directorio)
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Utilidades de texto (sube un nivel)
import ExerciseDisplay from "./components/ExerciseDisplay"; // En la misma carpeta
import ExerciseNavigation from "./components/ExerciseNavigation"; // En la misma carpeta
import LessonChatModule from "../Practice/LessonChatModule"; // ¡CORREGIDO! Importar LessonChatModule

// Importar el contexto (Sube un nivel)
import AppContext from "../context/AppContext";

const LessonCard = ({ lesson, onBack }) => {
  // Consumir valores del contexto
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // Estado para el índice del ejercicio actual dentro de la lección (solo para STANDARD_LESSON)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [userTypedAnswer, setUserTypedAnswer] = useState(""); // Global para el input de flashcards
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // NUEVO: Estado para el progreso del diálogo de chat cuando la lección es un chatbot
  // Este índice ahora rastrea el progreso a través de los *ejercicios de la lección*
  // dentro del LessonChatModule, no solo los pasos internos de un diálogo.
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
  }, [lesson]);

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

  // Determinar si la lección actual es un módulo de chatbot
  const isChatbotLesson = lesson.Type === "chatbot_lesson";

  // --- Funciones de manejo de ejercicios (SOLO para lecciones estándar) ---
  const handleNextExercise = () => {
    const requiresAnswer = [
      "fill_in_the_blank",
      "multiple_choice",
      "listening",
    ].includes(lesson.exercises[currentExerciseIndex].Type);
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
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      setAppMessage("");
    }
  };

  const handleCheckAnswer = () => {
    /* Lógica de verificación para flashcards */
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      return;
    }
    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    let normalizedCorrectAnswer;
    const currentStandardExercise = lesson.exercises[currentExerciseIndex];

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
    /* Lógica para flashcards */
    if (matchFeedback !== null) return;
    setUserTypedAnswer(selectedOption);
    const normalizedSelected = normalizeText(selectedOption);
    const normalizedCorrect = normalizeText(
      lesson.exercises[currentExerciseIndex].AnswerEN || ""
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
    /* Lógica para flashcards */
    setRecordedMicrophoneText(transcript);
    if (matchFeedback !== null) return;
    const normalizedTranscript = normalizeText(transcript);
    const normalizedQuestionEN = normalizeText(
      lesson.exercises[currentExerciseIndex].QuestionEN || ""
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

  // Callback cuando la lección de chat completa ha terminado
  const onChatLessonCompleted = () => {
    setIsChatLessonComplete(true);
    setAppMessage("¡Lección de chat completada!");
    // Aquí puedes decidir si automáticamente vuelves a la lista de lecciones o qué hacer
    // setTimeout(() => onBack(), 2000); // Ejemplo: volver después de 2 segundos
  };

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
      {!isChatbotLesson &&
        lesson.exercises[currentExerciseIndex]?.Notes && ( // Mostrar notas solo para ejercicios estándar
          <div className='section-container lesson-notes'>
            <h3 className='subsection-title'>Notas:</h3>
            <p>{lesson.exercises[currentExerciseIndex].Notes}</p>
          </div>
        )}

      {/* Mostrar la imagen del ejercicio si existe */}
      {!isChatbotLesson &&
        lesson.exercises[currentExerciseIndex]?.Image && ( // Mostrar imagen solo para ejercicios estándar
          <div className='exercise-image-container'>
            <img
              src={lesson.exercises[currentExerciseIndex].Image}
              alt={`Imagen para ${lesson.exercises[currentExerciseIndex].Type} ejercicio`}
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
        // Si es una lección de chatbot, renderizamos el LessonChatModule
        // y le pasamos TODOS los ejercicios de la lección para que los gestione internamente
        <LessonChatModule
          lessonExercises={lesson.exercises} // ¡NUEVO! Pasar TODOS los ejercicios de la lección
          onPlayAudio={onPlayAudio}
          appIsLoading={appIsLoading}
          userTypedAnswer={userTypedAnswer}
          setUserTypedAnswer={setUserTypedAnswer}
          setAppMessage={setAppMessage}
          onDialogueComplete={onChatLessonCompleted} // Al completar toda la lección de chat, vuelve a la lista

          // currentDialogueIndex y setCurrentDialogueIndex ahora son gestionados por LessonChatModule
          // y no se pasan desde aquí.
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
            currentExercise={lesson.exercises[currentExerciseIndex]} // Asegurar que pasamos el ejercicio correcto
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
        </div>
      )}

      {/* El componente de navegación se muestra para TODOS los ejercicios,
          pero su botón "Siguiente" se deshabilitará si es un chat no completado. */}
      <ExerciseNavigation
        currentExerciseIndex={
          isChatbotLesson ? chatLessonProgressIndex : currentExerciseIndex
        } // Usar el índice correcto
        totalExercises={lesson.exercises.length}
        onNextExercise={handleNextExercise}
        onPrevExercise={handlePrevExercise}
        matchFeedback={matchFeedback}
        currentExerciseType={
          isChatbotLesson
            ? lesson.exercises[chatLessonProgressIndex]?.Type
            : lesson.exercises[currentExerciseIndex]?.Type
        } // Usar el tipo correcto
        // Para chat, el botón Siguiente se habilita solo si el diálogo está completo
        isChatDialogueComplete={
          isChatbotLesson && chatLessonProgressIndex >= lesson.exercises.length
        } // ¡CORREGIDO!
      />

      {/* Botón para volver a la lista de lecciones (siempre visible) */}
      <button
        onClick={onBack}
        className='button back-button return-to-list-button'
        disabled={isChatbotLesson && !isChatLessonComplete}
      >
        Volver a la lista de lecciones
      </button>
    </div>
  );
};

export default LessonCard;
