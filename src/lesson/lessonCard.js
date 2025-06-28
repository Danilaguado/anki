// src/lesson/LessonCard.js
import React, { useState } from "react";
import "./PrincipalPageLessons.css"; // Estilos compartidos para lecciones
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Utilidades de texto
import SpeechToTextButton from "../components/SpeechToTextButton"; // Para el ejercicio de escucha
import ExerciseDisplay from "./components/ExerciseDisplay"; // Importar el nuevo componente
import ExerciseNavigation from "./components/ExerciseNavigation"; // Importar el nuevo componente

const LessonCard = ({
  lesson,
  onBack,
  onPlayAudio,
  setAppMessage,
  setAppIsLoading,
  appIsLoading,
}) => {
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
  // Este useEffect debe estar al inicio, antes de cualquier return condicional.
  React.useEffect(() => {
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

  // Las funciones handleCheckAnswer, handleOptionClick, handleSpeechResultForListening
  // ahora son gestionadas y pasadas a ExerciseDisplay
  const handleCheckAnswer = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    const normalizedCorrectAnswer = normalizeText(
      currentExercise.AnswerES || ""
    );

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
    const normalizedCorrect = normalizeText(currentExercise.AnswerES || "");

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

  const handleNextExercise = () => {
    // La lógica de validación de avance ahora está también en ExerciseNavigation.js
    // Esta función solo avanza el índice.
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
          appIsLoading={appIsLoading} // Pasar el estado booleano
          isAnswerVisible={isAnswerVisible}
          setIsAnswerVisible={setIsAnswerVisible} // Permitir que ExerciseDisplay alterne su visibilidad
          userTypedAnswer={userTypedAnswer}
          setUserTypedAnswer={setUserTypedAnswer}
          matchFeedback={matchFeedback}
          showCorrectAnswer={showCorrectAnswer}
          recordedMicrophoneText={recordedMicrophoneText}
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
