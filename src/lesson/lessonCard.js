// src/lesson/LessonCard.js
import React, { useState } from "react";
import "./PrincipalPageLessons.css"; // Estilos compartidos para lecciones
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Utilidades de texto

const LessonCard = ({
  lesson,
  onBack,
  onPlayAudio,
  setAppMessage,
  setAppIsLoading,
}) => {
  // Estado para el índice del ejercicio actual dentro de la lección
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  // Estado para la visibilidad de la respuesta (para ejercicios de traducción)
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  // Estados para la entrada del usuario y el feedback en ejercicios interactivos
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null); // null, 'correct', 'incorrect'
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false); // Para mostrar la respuesta correcta si falla

  // Restablecer estados al cambiar de ejercicio
  // Este useEffect debe estar al inicio, antes de cualquier return condicional.
  React.useEffect(() => {
    setIsAnswerVisible(false);
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
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
    if (currentExerciseIndex < lesson.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      // Opcional: Lógica para finalizar la lección si es el último ejercicio
      setAppMessage("¡Has completado esta lección!");
      // Aquí podrías volver a la lista de lecciones o mostrar un resumen
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
    }
  };

  const handleCheckAnswer = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    const normalizedCorrectAnswer = normalizeText(
      currentExercise.AnswerES || ""
    ); // Asegurarse de tener la respuesta correcta

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true); // Mostrar la respuesta correcta si acierta (para consistencia visual)
      // Opcional: Emitir un sonido de acierto
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true); // Mostrar la respuesta correcta para que el usuario la vea
      // Opcional: Emitir un sonido de error
    }
    setAppMessage(""); // Limpiar mensaje de "Por favor, escribe..."
  };

  const handleOptionClick = (selectedOption) => {
    const normalizedSelected = normalizeText(selectedOption);
    const normalizedCorrect = normalizeText(currentExercise.AnswerES || "");

    if (normalizedSelected === normalizedCorrect) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
    }
  };

  // Función para renderizar el ejercicio actual basado en su tipo
  const renderExercise = () => {
    switch (currentExercise.Type) {
      case "translation":
        return (
          <>
            <div id='question-text' className='card-text question'>
              {renderClickableText(
                currentExercise.QuestionEN,
                "en-US",
                true,
                onPlayAudio
              )}
            </div>
            <div
              id='answer-text'
              className={`card-text answer ${isAnswerVisible ? "" : "hidden"}`}
            >
              {currentExercise.AnswerES}
            </div>
            <button
              onClick={() => setIsAnswerVisible(!isAnswerVisible)}
              className='button toggle-answer-button'
            >
              {isAnswerVisible ? "Ocultar Traducción" : "Mostrar Traducción"}
            </button>
          </>
        );

      case "fill_in_the_blank":
        const blankPlaceholder = "_______"; // Puedes hacer esto más sofisticado si la IA lo genera con marcadores
        const parts = currentExercise.QuestionEN.split(blankPlaceholder);

        return (
          <>
            <div
              className={`card-content-area quiz-content-area ${
                matchFeedback ? `match-${matchFeedback}` : ""
              }`}
            >
              <div className='card-text quiz-question'>
                {parts[0]}
                <input
                  type='text'
                  className='input-field quiz-answer-input-inline'
                  value={userTypedAnswer}
                  onChange={(e) => setUserTypedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCheckAnswer();
                  }}
                  disabled={matchFeedback !== null} // Deshabilitar después de responder
                />
                {parts[1]}
              </div>
              {showCorrectAnswer && matchFeedback !== "correct" && (
                <p className='correct-answer-display'>
                  La respuesta correcta era: {currentExercise.AnswerES}
                </p>
              )}
              {showCorrectAnswer && matchFeedback === "correct" && (
                <p className='correct-answer-display'>¡Correcto!</p>
              )}
            </div>
            <button
              onClick={handleCheckAnswer}
              className='button quiz-check-button'
              disabled={matchFeedback !== null}
            >
              Verificar
            </button>
          </>
        );

      case "multiple_choice":
        const options = [
          ...(currentExercise.OptionsES || []),
          currentExercise.AnswerES,
        ].sort(() => Math.random() - 0.5); // Mezclar opciones

        return (
          <>
            <div id='question-text' className='card-text question'>
              {currentExercise.QuestionEN}
            </div>
            <div className='multiple-choice-options'>
              {options.map((option, idx) => (
                <button
                  key={idx}
                  className={`button multiple-choice-button 
                    ${
                      matchFeedback &&
                      normalizeText(option) ===
                        normalizeText(currentExercise.AnswerES)
                        ? "correct-option"
                        : ""
                    }
                    ${
                      matchFeedback &&
                      normalizeText(option) ===
                        normalizeText(userTypedAnswer) &&
                      matchFeedback === "incorrect"
                        ? "incorrect-selected-option"
                        : ""
                    }
                  `}
                  onClick={() => {
                    if (matchFeedback === null) {
                      // Solo permitir clic si no se ha respondido
                      setUserTypedAnswer(option); // Almacenar la opción seleccionada
                      handleOptionClick(option);
                    }
                  }}
                  disabled={matchFeedback !== null}
                >
                  {option}
                </button>
              ))}
            </div>
            {showCorrectAnswer && matchFeedback !== "correct" && (
              <p className='correct-answer-display'>
                La respuesta correcta era: {currentExercise.AnswerES}
              </p>
            )}
            {showCorrectAnswer && matchFeedback === "correct" && (
              <p className='correct-answer-display'>¡Correcto!</p>
            )}
          </>
        );

      default:
        return (
          <p className='info-text'>
            Tipo de ejercicio no soportado: {currentExercise.Type}
          </p>
        );
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
        <div className='card-counter'>
          Ejercicio {currentExerciseIndex + 1} de {lesson.exercises.length}
        </div>

        {/* Renderizar el ejercicio actual */}
        {renderExercise()}

        {/* Botones de navegación de ejercicio */}
        <div className='navigation-buttons-group'>
          <button
            onClick={handlePrevExercise}
            className='button nav-button prev'
            disabled={currentExerciseIndex === 0}
          >
            Anterior
          </button>
          <button
            onClick={handleNextExercise}
            className='button nav-button next'
            disabled={
              currentExerciseIndex === lesson.exercises.length - 1 &&
              matchFeedback === null
            } // Deshabilitar si es el último y no ha respondido aún
          >
            Siguiente
          </button>
        </div>
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
