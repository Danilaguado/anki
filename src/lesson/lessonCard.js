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
  const [userTypedAnswer, setUserTypedAnswer] = useState(""); // Global para el input de flashcards
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // --- DEBUG: LOGS DE INICIALIZACIÓN DE COMPONENTE ---
  console.log("DEBUG: LessonCard se ha renderizado.");
  console.log("DEBUG: Props recibidas en LessonCard:", { lesson, onBack });
  console.log("DEBUG: onPlayAudio en LessonCard (desde Context):", onPlayAudio);
  console.log(
    "DEBUG: appIsLoading en LessonCard (desde Context):",
    appIsLoading
  );
  // --- FIN DEBUG ---

  // Restablecer estados de interacción al cambiar de ejercicio o lección
  useEffect(() => {
    console.log(
      "DEBUG: LessonCard - useEffect de reinicio de estados de interacción disparado."
    );
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText("");
    console.log("DEBUG: LessonCard - Estados de interacción reiniciados.");
  }, [currentExerciseIndex, lesson]);

  // Resetear solo lo que depende de la lección (no del ejercicio actual)
  useEffect(() => {
    console.log(
      "DEBUG: LessonCard - useEffect de reinicio de lección disparado."
    );
    setCurrentExerciseIndex(0); // Esto sí, al cargar una nueva lección, empezamos por el primer ejercicio
    setAppMessage(""); // Limpiar mensaje global al cargar nueva lección
    console.log("DEBUG: LessonCard - Lección reiniciada a índice 0.");
  }, [lesson, setAppMessage]);

  // Si no hay lección o ejercicios, mostrar mensaje
  if (!lesson || !lesson.exercises || lesson.exercises.length === 0) {
    console.log(
      "DEBUG: LessonCard - No hay lección o ejercicios para mostrar."
    );
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
  const isChatbotLesson =
    (lesson.TypeModule || "").toLowerCase().trim() === "chatbot_lesson";
  console.log(
    `DEBUG: LessonCard - isChatbotLesson: ${isChatbotLesson} (lesson.TypeModule RAW: "${lesson.TypeModule}")`
  );

  // El ejercicio actual para las lecciones estándar (flashcards)
  // Solo se usa si !isChatbotLesson
  const currentStandardExercise = lesson.exercises[currentExerciseIndex];
  console.log(
    "DEBUG: LessonCard - currentStandardExercise:",
    currentStandardExercise
  );

  // --- Funciones de manejo de ejercicios (SOLO para lecciones estándar) ---
  const handleNextExercise = () => {
    console.log("DEBUG: LessonCard - handleNextExercise llamado.");
    const currentExercise = lesson.exercises[currentExerciseIndex];
    const requiresAnswer = [
      "fill_in_the_blank",
      "multiple_choice",
      "listening",
    ].includes(currentExercise.Type);

    if (requiresAnswer && matchFeedback === null) {
      console.log(
        "DEBUG: LessonCard - Requiere respuesta y no se ha respondido."
      );
      setAppMessage(
        "Por favor, completa el ejercicio actual antes de avanzar."
      );
      return;
    }

    if (currentExerciseIndex < lesson.exercises.length - 1) {
      console.log("DEBUG: LessonCard - Avanzando al siguiente ejercicio.");
      setCurrentExerciseIndex((prev) => prev + 1);
      setAppMessage("");
    } else {
      console.log("DEBUG: LessonCard - Lección estándar completada.");
      setAppMessage("¡Has completado esta lección!");
    }
  };

  const handlePrevExercise = () => {
    console.log("DEBUG: LessonCard - handlePrevExercise llamado.");
    if (currentExerciseIndex > 0) {
      console.log("DEBUG: LessonCard - Retrocediendo al ejercicio anterior.");
      setCurrentExerciseIndex((prev) => prev - 1);
      setAppMessage("");
    } else {
      console.log("DEBUG: LessonCard - Ya en el primer ejercicio.");
    }
  };

  const handleCheckAnswer = () => {
    /* Lógica de verificación para flashcards */
    console.log("DEBUG: LessonCard - handleCheckAnswer llamado.");
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      console.log("DEBUG: LessonCard - Respuesta vacía.");
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
      "DEBUG: LessonCard - Usuario:",
      normalizedUserAnswer,
      "Esperado:",
      normalizedCorrectAnswer
    );
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
      console.log("DEBUG: LessonCard - Respuesta CORRECTA.");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
      console.log("DEBUG: LessonCard - Respuesta INCORRECTA.");
    }
  };

  const handleOptionClick = (selectedOption) => {
    /* Lógica para flashcards */
    console.log(
      "DEBUG: LessonCard - handleOptionClick llamado con:",
      selectedOption
    );
    if (matchFeedback !== null) {
      console.log(
        "DEBUG: LessonCard - Ya hay feedback, ignorando clic de opción."
      );
      return;
    }
    setUserTypedAnswer(selectedOption);
    const normalizedSelected = normalizeText(selectedOption);
    const normalizedCorrect = normalizeText(
      lesson.exercises[currentExerciseIndex].AnswerEN || ""
    );
    console.log(
      "DEBUG: LessonCard - Opción seleccionada normalizada:",
      normalizedSelected,
      "Respuesta correcta normalizada:",
      normalizedCorrect
    );
    if (normalizedSelected === normalizedCorrect) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
      console.log("DEBUG: LessonCard - Opción CORRECTA.");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
      console.log("DEBUG: LessonCard - Opción INCORRECTA.");
    }
  };

  const handleSpeechResultForListening = (transcript) => {
    /* Lógica para flashcards */
    console.log(
      "DEBUG: LessonCard - handleSpeechResultForListening llamado con:",
      transcript
    );
    setRecordedMicrophoneText(transcript);
    if (matchFeedback !== null) {
      console.log(
        "DEBUG: LessonCard - Ya hay feedback, ignorando resultado de voz."
      );
      return;
    }
    const normalizedTranscript = normalizeText(transcript);
    const normalizedQuestionEN = normalizeText(
      lesson.exercises[currentExerciseIndex].QuestionEN || ""
    );
    console.log(
      "DEBUG: LessonCard - Transcripción normalizada:",
      normalizedTranscript,
      "Pregunta EN normalizada:",
      normalizedQuestionEN
    );
    if (normalizedTranscript === normalizedQuestionEN) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Excelente! Transcripción correcta.");
      console.log("DEBUG: LessonCard - Transcripción CORRECTA.");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Escucha de nuevo.");
      console.log("DEBUG: LessonCard - Transcripción INCORRECTA.");
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
          {console.log(
            "DEBUG: LessonCard - Renderizando ChatbotLessonRawDisplay."
          )}
          {console.log(
            "DEBUG: LessonCard - Pasando onPlayAudio a ChatbotLessonRawDisplay:",
            onPlayAudio
          )}
          {console.log(
            "DEBUG: LessonCard - Pasando appIsLoading a ChatbotLessonRawDisplay:",
            appIsLoading
          )}
          {console.log(
            "DEBUG: LessonCard - Pasando setAppMessage a ChatbotLessonRawDisplay:",
            setAppMessage
          )}
          <ChatbotLessonRawDisplay
            lessonExercises={lesson.exercises} // Pasar TODOS los ejercicios de la lección
            onPlayAudio={onPlayAudio} // <-- ¡NUEVO! Pasa onPlayAudio
            appIsLoading={appIsLoading} // <-- ¡NUEVO! Pasa appIsLoading
            setAppMessage={setAppMessage} // <-- ¡NUEVO! Pasa setAppMessage
          />
        </>
      ) : (
        // Si es una lección estándar (flashcards), el flujo es el mismo de antes
        <>
          {console.log(
            "DEBUG: LessonCard - Renderizando Ejercicio Estándar (Flashcard)."
          )}
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
          {console.log("DEBUG: LessonCard - Renderizando ExerciseNavigation.")}
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
