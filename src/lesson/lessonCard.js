// src/lesson/components/lessonCard.js
import React, { useState, useEffect, useContext } from "react";
import "./PrincipalPageLessons.css"; // Estilos compartidos para lecciones (mismo directorio)
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Utilidades de texto (sube un nivel)
import ExerciseDisplay from "./components/ExerciseDisplay"; // En la misma carpeta
// ExerciseNavigation ya no se importa ni se renderiza para ningún tipo de lección
// import ExerciseNavigation from './components/ExerciseNavigation';
import ChatbotLessonRawDisplay from "./components/ChatbotLessonRawDisplay"; // Componente para mostrar el chatbot en crudo

// Importar el contexto (Sube dos niveles)
import AppContext from "../context/AppContext";

const LessonCard = ({ lesson, onBack, onShowNotes }) => {
  // ¡NUEVO! Recibe onShowNotes
  // Consumir valores del contexto
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // --- ESTADOS DE INTERACCIÓN DE EJERCICIO ---
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false); // Para traducción
  const [userTypedAnswer, setUserTypedAnswer] = useState(""); // Input del usuario
  const [matchFeedback, setMatchFeedback] = useState(null); // null, 'correct', 'incorrect'
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false); // Para mostrar la respuesta correcta
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // Estados para el pop-up de notas (ya no son necesarios aquí, se gestionan en el padre)
  // const [showNotesModal, setShowNotesModal] = useState(false);
  // const [notesContent, setNotesContent] = useState('');

  // Restablecer estados al cambiar de ejercicio o lección
  useEffect(() => {
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText("");
    // Al cambiar de ejercicio, ocultar el modal de notas si está abierto
    // setShowNotesModal(false);
    // setNotesContent('');
  }, [currentExerciseIndex, lesson]); // Dependencia 'lesson' y 'currentExerciseIndex' para reinicio de estados

  // Resetear solo lo que depende de la lección (no del ejercicio actual)
  useEffect(() => {
    setCurrentExerciseIndex(0); // Al cargar una nueva lección, empezamos por el primer ejercicio
    setAppMessage(""); // Limpiar mensaje global al cargar nueva lección
  }, [lesson, setAppMessage]);

  // Si no hay lección o ejercicios, mostrar mensaje
  if (!lesson || !lesson.exercises || lesson.exercises.length === 0) {
    return (
      <div className='lesson-detail-view-content'>
        {" "}
        {/* Usar el div de contenido */}
        <p className='info-text'>
          No se ha seleccionado ninguna lección o esta lección no tiene
          ejercicios.
        </p>
        {/* El botón de volver a la lista de lecciones se gestiona con el close-lesson-button */}
      </div>
    );
  }

  // Determinar si la lección actual es un módulo de chatbot
  const isChatbotLesson =
    (lesson.TypeModule || "").toLowerCase().trim() === "chatbot_lesson";

  // El ejercicio actual para las lecciones estándar (flashcards)
  // Solo se usa si !isChatbotLesson
  const currentStandardExercise = lesson.exercises[currentExerciseIndex];

  // --- Funciones de manejo de ejercicios (SOLO para lecciones estándar) ---
  const handleCheckAnswer = () => {
    /* Lógica de verificación para flashcards */
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
      // setAppMessage('¡Correcto!'); // ¡ELIMINADO! Alerta de correcto
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage(
        "Incorrecto. La respuesta esperada era: " +
          (currentExercise.AnswerEN || currentExercise.QuestionEN)
      ); // Mensaje de error
    }
  };

  const handleOptionClick = (selectedOption) => {
    /* Lógica para flashcards */
    // ¡CORREGIDO! Solo establece la respuesta, no comprueba inmediatamente
    if (matchFeedback !== null) return; // No permitir cambiar la selección si ya se comprobó
    setUserTypedAnswer(selectedOption);
    // setAppMessage(''); // Opcional: limpiar mensaje al seleccionar
  };

  const handleSpeechResultForListening = (transcript) => {
    /* Lógica para flashcards */
    setRecordedMicrophoneText(transcript);
    // No se llama handleCheckAnswer aquí, se espera el botón "Comprobar"
  };

  // --- LÓGICA DE BOTÓN "COMPROBAR" / "CONTINUAR" ---
  const handleCheckOrContinue = () => {
    if (matchFeedback === "correct" || matchFeedback === "incorrect") {
      // Si ya se comprobó (correcto o incorrecto), avanzar
      // Si ya es correcto o incorrecto, avanzar al siguiente ejercicio
      if (currentExerciseIndex < lesson.exercises.length - 1) {
        setCurrentExerciseIndex((prev) => prev + 1);
        setAppMessage(""); // Limpiar mensaje al avanzar
      } else {
        setAppMessage("¡Has completado esta lección!");
      }
    } else {
      // Si no se ha comprobado, realizar la comprobación
      handleCheckAnswer();
    }
  };

  // Lógica para el Pop-up de Notas (ahora se pasa desde el padre)
  // const handleShowNotes = (content) => { /* ... */ };
  // const handleCloseNotesModal = () => { /* ... */ };

  return (
    <div className='lesson-detail-view-content'>
      {" "}
      {/* Cambiado a un div de contenido para que LessonDisplayPage maneje el section-container */}
      {/* El botón de cerrar para volver a la lista de lecciones ahora está en LessonDisplayPage */}
      {/* Pop-up de Notas (Modal) - Ahora gestionado en LessonDisplayPage */}
      {/* Renderizado condicional: Flujo de CHATBOT (RAW) vs. Flashcards Estándar */}
      {isChatbotLesson ? (
        // Si es una lección de chatbot, renderizamos el ChatbotLessonRawDisplay
        // y le pasamos TODOS los ejercicios para que los muestre en crudo.
        <ChatbotLessonRawDisplay
          lessonExercises={lesson.exercises} // Pasar TODOS los ejercicios de la lección
          onPlayAudio={onPlayAudio} // Pasa onPlayAudio
          appIsLoading={appIsLoading} // Pasa appIsLoading
          setAppMessage={setAppMessage} // Pasa setAppMessage
          onShowNotes={onShowNotes} // ¡NUEVO! Pasa la función onShowNotes del padre
        />
      ) : (
        // Si es una lección estándar (flashcards), el flujo es el mismo de antes
        <div
          className={`card-container lesson-exercise-card ${
            matchFeedback ? `match-${matchFeedback}` : ""
          }`}
        >
          {/* Botón de notas para flashcards */}
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

          {/* Mostrar imagen para ejercicios estándar */}
          {currentStandardExercise?.Image && (
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

          {/* Botón Comprobar / Continuar */}
          <div className='navigation-buttons-group'>
            {" "}
            {/* Reutiliza el grupo para el botón */}
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
