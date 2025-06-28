// src/lesson/LessonCard.js
import React, { useState, useEffect, useContext } from "react"; // Importar useContext y useEffect
import "./PrincipalPageLessons.css"; // Estilos compartidos para lecciones
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Utilidades de texto
// SpeechToTextButton, ExerciseDisplay, ExerciseNavigation se importan dentro de ExerciseDisplay o aquí si es necesario
import ExerciseDisplay from "./components/ExerciseDisplay";
import ExerciseNavigation from "./components/ExerciseNavigation";

// Importar el contexto
import AppContext from "../context/AppContext";

const LessonCard = ({ lesson, onBack }) => {
  // Ya no recibe props de contexto directamente
  // Consumir valores del contexto
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // Estado para el índice del ejercicio actual dentro de la lección
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  // Estado para la visibilidad de la respuesta (para ejercicios de traducción)
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  // Estados para la entrada del usuario y el feedback en ejercicios interactivos
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null); // null, 'correct', 'incorrect'
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false); // Para mostrar la respuesta correcta si falla
  // Nuevo estado para el texto grabado por el micrófono en el ejercicio de escucha
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");

  // Restablecer estados al cambiar de ejercicio
  useEffect(() => {
    // Usar useEffect en lugar de React.useEffect
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText(""); // Limpiar texto del micrófono
    // Asegurarse de que el índice del ejercicio actual no exceda el límite si la lección cambia dinámicamente
    if (
      lesson &&
      lesson.exercises &&
      currentExerciseIndex >= lesson.exercises.length
    ) {
      setCurrentExerciseIndex(0);
    }
  }, [currentExerciseIndex, lesson]); // Dependencia 'lesson' para resetear al cambiar la lección

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

  const handleNextExercise = () => {
    // Solo permitir avanzar si el ejercicio actual ha sido respondido o si no requiere respuesta.
    // Para los que requieren respuesta (fill_in_the_blank, multiple_choice, listening), matchFeedback no debe ser null.
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
      setAppMessage(""); // Limpiar mensaje al avanzar
    } else {
      setAppMessage("¡Has completado esta lección!");
      // Aquí podrías volver a la lista de lecciones o mostrar un resumen
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      setAppMessage(""); // Limpiar mensaje al retroceder
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

    // Lógica de verificación basada en el tipo de ejercicio
    if (
      currentExercise.Type === "fill_in_the_blank" ||
      currentExercise.Type === "multiple_choice"
    ) {
      normalizedCorrectAnswer = normalizeText(currentExercise.AnswerEN || ""); // <-- Usa AnswerEN y normaliza
    } else if (currentExercise.Type === "listening") {
      normalizedCorrectAnswer = normalizeText(currentExercise.QuestionEN || ""); // <-- Usa QuestionEN y normaliza para escucha
    } else {
      normalizedCorrectAnswer = normalizeText(currentExercise.AnswerES || ""); // Fallback para otros tipos
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
    setUserTypedAnswer(selectedOption); // Almacenar la opción seleccionada

    const normalizedSelected = normalizeText(selectedOption);
    const normalizedCorrect = normalizeText(currentExercise.AnswerEN || ""); // <-- Compara con AnswerEN y normaliza

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

  /**
   * Maneja el resultado del reconocimiento de voz para el ejercicio de escucha.
   * Compara lo que el usuario dijo con QuestionEN.
   */
  const handleSpeechResultForListening = (transcript) => {
    setRecordedMicrophoneText(transcript);
    if (matchFeedback !== null) return;

    const normalizedTranscript = normalizeText(transcript);
    const normalizedQuestionEN = normalizeText(
      currentExercise.QuestionEN || ""
    ); // <-- Usa QuestionEN y normaliza

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

  return (
    <div className='lesson-detail-view section-container'>
      <h2 className='section-title'>Lección: {lesson.Title}</h2>
      <p className='lesson-meta-info'>
        <strong>Tema:</strong> {lesson.Topic} |<strong>Dificultad:</strong>{" "}
        {lesson.Difficulty} |<strong>Fecha:</strong>{" "}
        {new Date(lesson.GeneratedDate).toLocaleDateString()}
      </p>
      <p className='lesson-description'>{lesson.Description}</p>

      <div
        className={`card-container lesson-exercise-card ${
          matchFeedback ? `match-${matchFeedback}` : ""
        }`}
      >
        {/* Componente para mostrar el ejercicio actual */}
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
          // Pasar las funciones handle que se adaptan al tipo de ejercicio
          handleCheckAnswer={handleCheckAnswer}
          handleOptionClick={handleOptionClick}
          handleSpeechResultForListening={handleSpeechResultForListening}
        />

        {/* Componente para la navegación entre ejercicios */}
        <ExerciseNavigation
          currentExerciseIndex={currentExerciseIndex}
          totalExercises={lesson.exercises.length}
          onNextExercise={handleNextExercise}
          onPrevExercise={handlePrevExercise}
          matchFeedback={matchFeedback}
          currentExerciseType={currentExercise.Type}
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
