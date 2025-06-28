// src/lesson/LessonCard.js
import React, { useState } from "react";
import "./PrincipalPageLessons.css"; // Estilos compartidos para lecciones
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Utilidades de texto
import SpeechToTextButton from "../components/SpeechToTextButton"; // Para el ejercicio de escucha

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
    // Para fill_in_the_blank, AnswerES debería ser la palabra en inglés del espacio
    const normalizedCorrectAnswer = normalizeText(
      currentExercise.AnswerES || ""
    );

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
      // Opcional: Emitir un sonido de acierto
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo."); // O dar más info
      // Opcional: Emitir un sonido de error
    }
  };

  const handleOptionClick = (selectedOption) => {
    // Si ya se respondió, no hacer nada
    if (matchFeedback !== null) return;

    setUserTypedAnswer(selectedOption); // Almacenar la opción seleccionada para la comprobación

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

  /**
   * Maneja el resultado del reconocimiento de voz para el ejercicio de escucha.
   * Compara lo que el usuario dijo con QuestionEN.
   */
  const handleSpeechResultForListening = (transcript) => {
    setRecordedMicrophoneText(transcript); // Mostrar lo que se grabó
    if (matchFeedback !== null) return; // No re-evaluar si ya se dio feedback

    const normalizedTranscript = normalizeText(transcript);
    const normalizedQuestionEN = normalizeText(
      currentExercise.QuestionEN || ""
    );

    if (normalizedTranscript === normalizedQuestionEN) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true); // Mostrar la frase original en inglés y su traducción
      setAppMessage("¡Excelente! Transcripción correcta.");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true); // Mostrar la frase original para que el usuario compare
      setAppMessage("Incorrecto. Escucha de nuevo.");
    }
  };

  // Función para renderizar el ejercicio actual basado en su tipo
  const playAudioButton = (
    <button
      onClick={() => onPlayAudio(currentExercise.QuestionEN, "en-US")}
      className='button audio-button-round primary-button'
      disabled={setAppIsLoading} // Deshabilitar si la app principal está cargando (ej. generando audio)
      aria-label='Reproducir frase en inglés'
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='100%'
        height='100%'
        fill='currentColor'
        viewBox='0 0 16 16'
      >
        <path d='M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z' />
      </svg>
    </button>
  );

  switch (currentExercise.Type) {
    case "translation":
      return (
        <>
          <div className='microphone-play-buttons-group'>{playAudioButton}</div>
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
      const blankPlaceholder = "_______";
      const parts = currentExercise.QuestionEN.split(blankPlaceholder);

      return (
        <>
          <div className='microphone-play-buttons-group'>{playAudioButton}</div>
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
                La respuesta correcta era:{" "}
                <span className='correct-answer-text'>
                  {currentExercise.AnswerES}
                </span>
              </p>
            )}
            {showCorrectAnswer && matchFeedback === "correct" && (
              <p className='correct-answer-display success-text'>¡Correcto!</p>
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
          <div className='microphone-play-buttons-group'>{playAudioButton}</div>
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
                    normalizeText(option) === normalizeText(userTypedAnswer) &&
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
              La respuesta correcta era:{" "}
              <span className='correct-answer-text'>
                {currentExercise.AnswerES}
              </span>
            </p>
          )}
          {showCorrectAnswer && matchFeedback === "correct" && (
            <p className='correct-answer-display success-text'>¡Correcto!</p>
          )}
        </>
      );

    case "listening":
      return (
        <>
          <div className='microphone-play-buttons-group'>
            {/* Botón de reproducción de audio para la escucha */}
            <button
              onClick={() => onPlayAudio(currentExercise.QuestionEN, "en-US")}
              className='button audio-button-round primary-button large-play-button'
              disabled={setAppIsLoading}
              aria-label='Reproducir audio de la frase'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='100%'
                height='100%'
                fill='currentColor'
                viewBox='0 0 16 16'
              >
                <path d='M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z' />
              </svg>
            </button>
            {/* Botón de micrófono */}
            <SpeechToTextButton
              onResult={handleSpeechResultForListening}
              lang='en-US' // El idioma a reconocer es el inglés de la pregunta
              disabled={matchFeedback !== null} // Deshabilitar después de responder
            />
          </div>

          {/* Mostrar lo que se grabó del micrófono (estilo flashcard) */}
          {recordedMicrophoneText && (
            <div className='recorded-text-display'>
              {recordedMicrophoneText}
            </div>
          )}

          {/* Contenido de la pregunta y respuesta oculta hasta que se intente responder */}
          {showCorrectAnswer && (
            <div
              className={`card-content-area quiz-content-area ${
                matchFeedback ? `match-${matchFeedback}` : ""
              }`}
            >
              <div id='question-text' className='card-text question'>
                {renderClickableText(
                  currentExercise.QuestionEN,
                  "en-US",
                  true,
                  onPlayAudio
                )}
              </div>
              <div className='card-text answer'>{currentExercise.AnswerES}</div>
            </div>
          )}
          {showCorrectAnswer && matchFeedback !== "correct" && (
            <p className='correct-answer-display'>
              La frase correcta era:{" "}
              <span className='correct-answer-text'>
                {currentExercise.QuestionEN}
              </span>
            </p>
          )}
          {showCorrectAnswer && matchFeedback === "correct" && (
            <p className='correct-answer-display success-text'>¡Correcto!</p>
          )}
          {/* En el modo escucha, el usuario no escribe, solo habla. Si se quiere un input de texto, se añadiría aquí. */}
          {/* Si quieres un input de texto además del micrófono: */}
          <div className='quiz-input-group'>
            <input
              type='text'
              className='input-field quiz-answer-input'
              placeholder='Escribe lo que escuchaste aquí'
              value={userTypedAnswer}
              onChange={(e) => setUserTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCheckAnswer();
              }}
              disabled={matchFeedback !== null}
            />
            <button
              onClick={handleCheckAnswer}
              className='button quiz-check-button'
              disabled={matchFeedback !== null}
            >
              Verificar
            </button>
          </div>
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

export default LessonCard;
