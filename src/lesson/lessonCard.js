// src/lesson/lessonCard.js
import React, { useState, useEffect, useContext } from "react";
import "./PrincipalPageLessons.css"; // Estilos compartidos para lecciones (mismo directorio)
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Utilidades de texto (sube un nivel)
import ExerciseDisplay from "./components/ExerciseDisplay"; // En la misma carpeta
import ExerciseNavigation from "./components/ExerciseNavigation"; // En la misma carpeta
import ChatbotLessonRawDisplay from "./components/ChatbotLessonRawDisplay"; // Componente para mostrar el chatbot en crudo

// Importar el contexto (Sube un nivel)
import AppContext from "../context/AppContext";

const LessonCard = ({ lesson, onBack }) => {
  // Consumir valores del contexto
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // --- ESTADOS DE INTERACCIÓN DE FLASHCARD (Solo para STANDARD_LESSON) ---
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // No se usa isChatLessonComplete en este flujo raw, ya que no hay interactividad de completado.
  // const [isChatLessonComplete, setIsChatLessonComplete] = useState(false);

  // --- DEBUG: LOGS DE INICIALIZACIÓN DE COMPONENTE ---
  console.log("DEBUG: LessonCard se ha renderizado.");
  console.log("DEBUG: Props recibidas en LessonCard:", { lesson, onBack });
  // --- FIN DEBUG ---

  // Restablecer estados de interacción al cambiar de ejercicio o lección
  useEffect(() => {
    console.log(
      "DEBUG: useEffect de reinicio de estados de interacción disparado."
    );
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText("");
    console.log("DEBUG: Estados de interacción reiniciados.");

    // DEBUG: Alerta para ver el índice del ejercicio actual
    // alert(`DEBUG: Reiniciando estados para Ejercicio Índice: ${currentExerciseIndex}`);
  }, [currentExerciseIndex, lesson]); // Dependencia 'lesson' y 'currentExerciseIndex' para reinicio de estados

  // Resetear solo lo que depende de la lección (no del ejercicio actual)
  useEffect(() => {
    console.log("DEBUG: useEffect de reinicio de lección disparado.");
    setCurrentExerciseIndex(0); // Esto sí, al cargar una nueva lección, empezamos por el primer ejercicio
    // setIsChatLessonComplete(false); // Ya no se usa aquí en este flujo raw
    setAppMessage(""); // Limpiar mensaje global al cargar nueva lección
    console.log("DEBUG: Lección reiniciada a índice 0.");
    // DEBUG: Alerta para ver el ID de la lección
    // alert(`DEBUG: Cargando nueva lección: ${lesson?.LessonID || 'N/A'}`);
  }, [lesson, setAppMessage]); // Dependencia 'lesson' para reinicio de la lección

  // Si no hay lección o ejercicios, mostrar mensaje
  if (!lesson || !lesson.exercises || lesson.exercises.length === 0) {
    console.log("DEBUG: No hay lección o ejercicios para mostrar.");
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
  console.log(
    `DEBUG: isChatbotLesson: ${isChatbotLesson} (lesson.TypeModule: ${lesson.TypeModule})`
  );
  // alert(`DEBUG: Tipo de Módulo: ${lesson.TypeModule}. Es Chatbot: ${isChatbotLesson}`);

  // El ejercicio actual para las lecciones estándar (flashcards)
  // Solo se usa si !isChatbotLesson
  const currentStandardExercise = lesson.exercises[currentExerciseIndex];
  console.log("DEBUG: currentStandardExercise:", currentStandardExercise);

  // --- Funciones de manejo de ejercicios (SOLO para lecciones estándar) ---
  const handleNextExercise = () => {
    console.log("DEBUG: handleNextExercise llamado.");
    const currentExercise = lesson.exercises[currentExerciseIndex];
    const requiresAnswer = [
      "fill_in_the_blank",
      "multiple_choice",
      "listening",
    ].includes(currentExercise.Type);

    if (requiresAnswer && matchFeedback === null) {
      console.log("DEBUG: Requiere respuesta y no se ha respondido.");
      setAppMessage(
        "Por favor, completa el ejercicio actual antes de avanzar."
      );
      // alert('DEBUG: Por favor, completa el ejercicio actual antes de avanzar.');
      return;
    }

    if (currentExerciseIndex < lesson.exercises.length - 1) {
      console.log("DEBUG: Avanzando al siguiente ejercicio.");
      setCurrentExerciseIndex((prev) => prev + 1);
      setAppMessage("");
    } else {
      console.log("DEBUG: Lección estándar completada.");
      setAppMessage("¡Has completado esta lección!");
      // alert('DEBUG: ¡Has completado esta lección estándar!');
    }
  };

  const handlePrevExercise = () => {
    console.log("DEBUG: handlePrevExercise llamado.");
    if (currentExerciseIndex > 0) {
      console.log("DEBUG: Retrocediendo al ejercicio anterior.");
      setCurrentExerciseIndex((prev) => prev - 1);
      setAppMessage("");
    } else {
      console.log("DEBUG: Ya en el primer ejercicio.");
    }
  };

  const handleCheckAnswer = () => {
    /* Lógica de verificación para flashcards */
    console.log("DEBUG: handleCheckAnswer llamado.");
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      console.log("DEBUG: Respuesta vacía.");
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
    console.log(
      "DEBUG: Usuario:",
      normalizedUserAnswer,
      "Esperado:",
      normalizedCorrectAnswer
    );
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
      console.log("DEBUG: Respuesta CORRECTA.");
      // alert('DEBUG: Respuesta CORRECTA.');
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
      console.log("DEBUG: Respuesta INCORRECTA.");
      // alert('DEBUG: Respuesta INCORRECTA.');
    }
  };

  const handleOptionClick = (selectedOption) => {
    /* Lógica para flashcards */
    console.log("DEBUG: handleOptionClick llamado con:", selectedOption);
    if (matchFeedback !== null) {
      console.log("DEBUG: Ya hay feedback, ignorando clic de opción.");
      return;
    }
    setUserTypedAnswer(selectedOption);
    const normalizedSelected = normalizeText(selectedOption);
    const normalizedCorrect = normalizeText(
      lesson.exercises[currentExerciseIndex].AnswerEN || ""
    );
    console.log(
      "DEBUG: Opción seleccionada normalizada:",
      normalizedSelected,
      "Respuesta correcta normalizada:",
      normalizedCorrect
    );
    if (normalizedSelected === normalizedCorrect) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
      console.log("DEBUG: Opción CORRECTA.");
      // alert('DEBUG: Opción CORRECTA.');
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
      console.log("DEBUG: Opción INCORRECTA.");
      // alert('DEBUG: Opción INCORRECTA.');
    }
  };

  const handleSpeechResultForListening = (transcript) => {
    /* Lógica para flashcards */
    console.log(
      "DEBUG: handleSpeechResultForListening llamado con:",
      transcript
    );
    setRecordedMicrophoneText(transcript);
    if (matchFeedback !== null) {
      console.log("DEBUG: Ya hay feedback, ignorando resultado de voz.");
      return;
    }
    const normalizedTranscript = normalizeText(transcript);
    const normalizedQuestionEN = normalizeText(
      lesson.exercises[currentExerciseIndex].QuestionEN || ""
    );
    console.log(
      "DEBUG: Transcripción normalizada:",
      normalizedTranscript,
      "Pregunta EN normalizada:",
      normalizedQuestionEN
    );
    if (normalizedTranscript === normalizedQuestionEN) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Excelente! Transcripción correcta.");
      console.log("DEBUG: Transcripción CORRECTA.");
      // alert('DEBUG: Transcripción CORRECTA.');
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Escucha de nuevo.");
      console.log("DEBUG: Transcripción INCORRECTA.");
      // alert('DEBUG: Transcripción INCORRECTA.');
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

      {/* DEBUG: Alerta para ver el tipo de módulo */}
      {/* <p>DEBUG: Tipo de Módulo: {lesson.TypeModule}</p> */}

      {/* Renderizado condicional: Flujo de CHATBOT (RAW) vs. Flashcards Estándar */}
      {isChatbotLesson ? (
        // Si es una lección de chatbot, renderizamos el ChatbotLessonRawDisplay
        // y le pasamos TODOS los ejercicios para que los muestre en crudo.
        <>
          {console.log("DEBUG: Renderizando ChatbotLessonRawDisplay.")}
          {/* alert('DEBUG: Mostrando ejercicios de CHATBOT (RAW).') */}
          <ChatbotLessonRawDisplay
            lessonExercises={lesson.exercises} // Pasar TODOS los ejercicios de la lección
          />
        </>
      ) : (
        // Si es una lección estándar (flashcards), el flujo es el mismo de antes
        <>
          {console.log("DEBUG: Renderizando Ejercicio Estándar (Flashcard).")}
          {/* alert('DEBUG: Mostrando ejercicio ESTÁNDAR (Flashcard).') */}
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
        </>
      )}

      {/* El componente de navegación YA NO SE RENDERIZA para chatbot, solo para estándar. */}
      {!isChatbotLesson && (
        <>
          {console.log("DEBUG: Renderizando ExerciseNavigation.")}
          <ExerciseNavigation
            currentExerciseIndex={currentExerciseIndex}
            totalExercises={lesson.exercises.length}
            onNextExercise={handleNextExercise}
            onPrevExercise={handlePrevExercise}
            matchFeedback={matchFeedback}
            currentExerciseType={lesson.exercises[currentExerciseIndex]?.Type}
            isChatDialogueComplete={false}
          />
        </>
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
