// src/lesson/lessonCard.js
import React, { useState, useEffect, useContext } from "react";
import "./PrincipalPageLessons.css"; // Estilos compartidos para lecciones (mismo directorio)
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Utilidades de texto (sube un nivel)
import ExerciseDisplay from "./components/ExerciseDisplay"; // En la misma carpeta
import ExerciseNavigation from "./components/ExerciseNavigation"; // En la misma carpeta
// ¡NUEVO! Importar el componente para mostrar el chatbot en crudo
import ChatbotLessonRawDisplay from "./components/ChatbotLessonRawDisplay";

// Importar el contexto (Sube un nivel)
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
  const [userTypedAnswer, setUserTypedAnswer] = useState(""); // Global para el input de flashcards
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // Estado para indicar si toda la lección de chat ha sido completada (ya no se usa aquí para el flujo raw)
  // const [isChatLessonComplete, setIsChatLessonComplete] = useState(false);

  // Restablecer estados al cambiar de ejercicio o lección
  useEffect(() => {
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText("");
    setCurrentExerciseIndex(0); // Resetear el índice del ejercicio para flashcards
    // setIsChatLessonComplete(false); // Ya no se usa aquí
  }, [currentExerciseIndex, lesson]); // Dependencia 'lesson' para resetear al cambiar la lección

  // Resetear solo lo que depende de la lección (no del ejercicio actual)
  useEffect(() => {
    setCurrentExerciseIndex(0); // Esto sí, al cargar una nueva lección, empezamos por el primer ejercicio
    // setIsChatLessonComplete(false); // Esto sí, al cargar una nueva lección, el chat no está completo
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
  const isChatbotLesson = lesson.TypeModule === "chatbot_lesson";

  // El ejercicio actual para las lecciones estándar (flashcards)
  // Solo se usa si !isChatbotLesson
  const currentStandardExercise = lesson.exercises[currentExerciseIndex];

  // --- Funciones de manejo de ejercicios (SOLO para lecciones estándar) ---
  const handleNextExercise = () => {
    // currentStandardExercise se define dentro del return para lecciones estándar
    const currentExercise = lesson.exercises[currentExerciseIndex]; // Usar variable local
    const requiresAnswer = [
      "fill_in_the_blank",
      "multiple_choice",
      "listening",
    ].includes(currentExercise.Type);
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
    const currentExercise = lesson.exercises[currentExerciseIndex]; // Usar variable local
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
    ); // Usar lesson.exercises[currentExerciseIndex]
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
    ); // Usar lesson.exercises[currentExerciseIndex]
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

  // onChatLessonCompleted ya no es necesario aquí, ya que el ChatbotLessonRawDisplay no tiene interactividad de completado.
  // const onChatLessonCompleted = () => { /* ... */ };

  return (
    <div className='lesson-detail-view section-container'>
      <h2 className='section-title'>Lección: {lesson.Title}</h2>
      <p className='lesson-meta-info'>
        <strong>Tema:</strong> {lesson.Topic} |<strong>Dificultad:</strong>{" "}
        {lesson.Difficulty} |<strong>Fecha:</strong>{" "}
        {new Date(lesson.GeneratedDate).toLocaleDateString()}
      </p>
      <p className='lesson-description'>{lesson.Description}</p>

      {/* Renderizado condicional: Flujo de CHATBOT (RAW) vs. Flashcards Estándar */}
      {isChatbotLesson ? (
        // Si es una lección de chatbot, renderizamos el ChatbotLessonRawDisplay
        // y le pasamos TODOS los ejercicios para que los muestre en crudo.
        <ChatbotLessonRawDisplay
          lessonExercises={lesson.exercises} // Pasar TODOS los ejercicios de la lección
        />
      ) : (
        // Si es una lección estándar (flashcards), el flujo es el mismo de antes
        <div
          className={`card-container lesson-exercise-card ${
            matchFeedback ? `match-${matchFeedback}` : ""
          }`}
        >
          {/* Mostrar notas y imagen para ejercicios estándar */}
          {lesson.exercises[currentExerciseIndex]?.Notes && (
            <div className='section-container lesson-notes'>
              <h3 className='subsection-title'>Notas:</h3>
              <p>{lesson.exercises[currentExerciseIndex].Notes}</p>
            </div>
          )}
          {lesson.exercises[currentExerciseIndex]?.Image && (
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

      {/* El componente de navegación se muestra para TODOS los ejercicios estándar */}
      {!isChatbotLesson && ( // ¡NUEVO! Solo mostrar navegación si NO es chatbot
        <ExerciseNavigation
          currentExerciseIndex={currentExerciseIndex} // Usar el índice correcto
          totalExercises={lesson.exercises.length}
          onNextExercise={handleNextExercise}
          onPrevExercise={handlePrevExercise}
          matchFeedback={matchFeedback}
          currentExerciseType={lesson.exercises[currentExerciseIndex]?.Type} // Usar el tipo correcto
          isChatDialogueComplete={false} // Siempre falso para lecciones estándar
        />
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
