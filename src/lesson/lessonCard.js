// src/lesson/components/lessonCard.js
import React, { useState, useEffect, useContext } from "react";
import "../PrincipalPageLessons.css"; // Subir un nivel para encontrar PrincipalPageLessons.css
import { normalizeText, renderClickableText } from "../../utils/textUtils"; // Subir dos niveles para utils
import ExerciseDisplay from "./ExerciseDisplay"; // Correcto: en la misma carpeta
import ExerciseNavigation from "./ExerciseNavigation"; // Correcto: en la misma carpeta
import PracticeChatInterface from "../../Practice/PracticeChatInterface"; // ¡CORREGIDO! Ahora en src/Practice/ (subir dos niveles, luego bajar a Practice)

// Importar el contexto
import AppContext from "../../context/AppContext"; // Correcto: Subir dos niveles para context

const LessonCard = ({ lesson, onBack }) => {
  // Consumir valores del contexto
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // Estado para el índice del ejercicio actual dentro de la lección
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  // Estado para la visibilidad de la respuesta (para ejercicios de traducción)
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  // Estados para la entrada del usuario y el feedback en ejercicios interactivos
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  // Nuevo estado para el texto grabado por el micrófono en el ejercicio de escucha
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // Restablecer estados al cambiar de ejercicio
  useEffect(() => {
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText("");
    if (
      lesson &&
      lesson.exercises &&
      currentExerciseIndex >= lesson.exercises.length
    ) {
      setCurrentExerciseIndex(0);
    }
  }, [currentExerciseIndex, lesson]);

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

  const currentExercise = lesson.exercises[currentExerciseIndex];

  // --- Funciones de manejo de ejercicios (pasadas a ExerciseDisplay o usadas directamente) ---
  const handleNextExercise = () => {
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
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
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
    if (matchFeedback !== null) return;
    setUserTypedAnswer(selectedOption);

    const normalizedSelected = normalizeText(selectedOption);
    const normalizedCorrect = normalizeText(currentExercise.AnswerEN || "");

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
      currentExercise.QuestionEN || ""
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

  // --- NUEVA FUNCIÓN: Manejar la finalización del diálogo de chat ---
  const handleChatDialogueComplete = () => {
    setAppMessage("¡Diálogo completado! Avanzando al siguiente ejercicio.");
    // Avanzar al siguiente ejercicio de la lección
    if (currentExerciseIndex < lesson.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      setAppMessage("¡Has completado esta lección!");
    }
    setMatchFeedback(null); // Reiniciar feedback
    setShowCorrectAnswer(false);
    setUserTypedAnswer("");
    setRecordedMicrophoneText("");
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
      {currentExercise.Notes && (
        <div className='section-container lesson-notes'>
          <h3 className='subsection-title'>Notas:</h3>
          <p>{currentExercise.Notes}</p>
        </div>
      )}

      {/* Mostrar la imagen del ejercicio si existe */}
      {currentExercise.Image && (
        <div className='exercise-image-container'>
          <img
            src={currentExercise.Image}
            alt={`Imagen para ${currentExercise.Type} ejercicio`}
            className='exercise-image'
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/300x200/cccccc/ffffff?text=No+Image`;
            }}
          />
        </div>
      )}

      <div
        className={`card-container lesson-exercise-card ${
          matchFeedback ? `match-${matchFeedback}` : ""
        }`}
      >
        {/* Renderizado condicional: CHATBOT vs. ESTÁNDAR */}
        {currentExercise.Type === "practice_chat" ? (
          <PracticeChatInterface
            dialogueSequence={currentExercise.DialogueSequence}
            onPlayAudio={onPlayAudio}
            appIsLoading={appIsLoading}
            userTypedAnswer={userTypedAnswer}
            setUserTypedAnswer={setUserTypedAnswer}
            matchFeedback={matchFeedback}
            setMatchFeedback={setMatchFeedback}
            setAppMessage={setAppMessage}
            setShowCorrectAnswer={setShowCorrectAnswer}
            showCorrectAnswer={showCorrectAnswer}
            recordedMicrophoneText={recordedMicrophoneText}
            handleSpeechResultForListening={handleSpeechResultForListening}
            expectedAnswerEN={currentExercise.AnswerEN} // La primera respuesta esperada del usuario en el chat
            onDialogueComplete={handleChatDialogueComplete} // ¡NUEVO! Callback al completar el diálogo
          />
        ) : (
          // Componente para mostrar los ejercicios estándar (flashcard-style)
          <ExerciseDisplay
            currentExercise={currentExercise}
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
        )}

        {/* El componente de navegación se muestra para TODOS los ejercicios,
            pero su botón "Siguiente" se deshabilitará si es un chat no completado. */}
        <ExerciseNavigation
          currentExerciseIndex={currentExerciseIndex}
          totalExercises={lesson.exercises.length}
          onNextExercise={handleNextExercise}
          onPrevExercise={handlePrevExercise}
          matchFeedback={matchFeedback}
          currentExerciseType={currentExercise.Type}
          // Para chat, el botón Siguiente se habilita solo si el diálogo está completo
          isChatDialogueComplete={
            currentExercise.Type === "practice_chat" &&
            currentExercise.DialogueSequence &&
            currentExercise.DialogueSequence.length > 0 &&
            (currentExercise.DialogueSequence[
              currentExercise.DialogueSequence.length - 1
            ]?.speaker === "ai"
              ? currentDialogueIndex >= currentExercise.DialogueSequence.length
              : currentDialogueIndex >=
                currentExercise.DialogueSequence.length - 1)
          } // Verifica si el diálogo ha avanzado hasta el final
        />
      </div>

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
