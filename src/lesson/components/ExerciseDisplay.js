// src/lesson/components/ExerciseDisplay.js
import React, { useContext } from "react";
import { normalizeText, renderClickableText } from "../../utils/textUtils";
import SpeechToTextButton from "../../components/SpeechToTextButton";

// Importa el contexto
import AppContext from "../../context/AppContext";

const ExerciseDisplay = ({
  currentExercise,
  isAnswerVisible,
  setIsAnswerVisible,
  userTypedAnswer,
  setUserTypedAnswer,
  matchFeedback,
  showCorrectAnswer, // Mantener para mostrar el mensaje "La respuesta correcta era:"
  recordedMicrophoneText,
  handleCheckAnswer,
  handleOptionClick,
  handleSpeechResultForListening,
}) => {
  // Consumir valores del contexto directamente
  const { onPlayAudio, setAppMessage, appIsLoading } = useContext(AppContext);

  // Función para renderizar el botón de reproducción de audio
  const playAudioButton = (
    <button
      onClick={() => onPlayAudio(currentExercise.QuestionEN, "en-US")}
      className='button audio-button-round primary-button'
      disabled={appIsLoading}
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

  // Función para renderizar el botón de micrófono
  const microphoneButton = (
    <SpeechToTextButton
      onResult={handleSpeechResultForListening}
      lang='en-US' // El idioma a reconocer es el inglés de la pregunta (QuestionEN)
      disabled={matchFeedback !== null || appIsLoading}
    />
  );

  return (
    <>
      {/* Las notas se gestionan con un botón de pop-up en LessonCard */}
      {/* Botones de audio y micrófono siempre en todos los ejercicios */}
      <div className='microphone-play-buttons-group'>
        {playAudioButton}
        {microphoneButton}
      </div>
      {recordedMicrophoneText && (
        <div className='recorded-text-display'>{recordedMicrophoneText}</div>
      )}
      <div
        className={`card-content-area quiz-content-area ${
          matchFeedback ? `match-${matchFeedback}` : ""
        }`}
      >
        {currentExercise.Type === "translation" && (
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
              {currentExercise.QuestionES}
            </div>
            <button
              onClick={() => setIsAnswerVisible(!isAnswerVisible)}
              className='button toggle-answer-button'
            >
              {isAnswerVisible ? "Ocultar Traducción" : "Mostrar Traducción"}
            </button>
          </>
        )}

        {currentExercise.Type === "fill_in_the_blank" && (
          <>
            <div className='card-text quiz-question'>
              {currentExercise.QuestionEN.split("_______")[0]}
              <input
                type='text'
                className='input-field quiz-answer-input-inline'
                value={userTypedAnswer}
                onChange={(e) => setUserTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCheckAnswer();
                }}
                disabled={matchFeedback !== null || appIsLoading}
              />
              {currentExercise.QuestionEN.split("_______")[1]}
            </div>
            <p className='fill-in-the-blank-translation'>
              {currentExercise.QuestionES}
            </p>

            {showCorrectAnswer && matchFeedback !== "correct" && (
              <p className='correct-answer-display'>
                La respuesta correcta era:{" "}
                <span className='correct-answer-text'>
                  {currentExercise.AnswerEN}
                </span>
              </p>
            )}
            {showCorrectAnswer && matchFeedback === "correct" && (
              <p className='correct-answer-display success-text'>
                ¡Correcto! {/* Este mensaje visual se mantiene */}
              </p>
            )}
          </>
        )}

        {currentExercise.Type === "multiple_choice" && (
          <>
            <div id='question-text' className='card-text question'>
              {currentExercise.QuestionES}
            </div>
            <div className='multiple-choice-options'>
              {currentExercise.OptionsEN.map(
                (
                  option,
                  idx // Iterar sobre OptionsEN
                ) => (
                  <button
                    key={idx}
                    className={`button multiple-choice-button 
                    ${
                      matchFeedback &&
                      normalizeText(option) ===
                        normalizeText(currentExercise.AnswerEN)
                        ? "correct-option"
                        : ""
                    }
                    ${
                      normalizeText(option) ===
                        normalizeText(userTypedAnswer) && matchFeedback === null
                        ? "selected-option"
                        : ""
                    } {/* ¡CORREGIDO! Resaltar opción seleccionada solo si no se ha comprobado */}
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
                      // ¡CORREGIDO! Solo selecciona la opción, no la verifica inmediatamente
                      if (matchFeedback === null) {
                        // Solo permitir seleccionar si no se ha comprobado
                        setUserTypedAnswer(option); // Establece la opción seleccionada
                      }
                    }}
                    disabled={matchFeedback !== null || appIsLoading} // Deshabilitar si ya se comprobó
                  >
                    {option}
                  </button>
                )
              )}
            </div>
            {showCorrectAnswer && matchFeedback === "correct" && (
              <p className='correct-answer-display success-text'>
                ¡Correcto! {/* Este mensaje visual se mantiene */}
              </p>
            )}
            {showCorrectAnswer && matchFeedback !== "correct" && (
              <p className='correct-answer-display'>
                La respuesta correcta era:{" "}
                <span className='correct-answer-text'>
                  {currentExercise.AnswerEN}
                </span>
              </p>
            )}
          </>
        )}

        {currentExercise.Type === "listening" && (
          <>
            {showCorrectAnswer && (
              <div className='card-text question'>
                {renderClickableText(
                  currentExercise.QuestionEN,
                  "en-US",
                  true,
                  onPlayAudio
                )}
              </div>
            )}
            <p className='listening-instruction'>
              Escucha y escribe lo que oigas:
            </p>
            <p className='listening-translation-hint'>
              {currentExercise.QuestionES}
            </p>

            {showCorrectAnswer && matchFeedback !== "correct" && (
              <p className='correct-answer-display'>
                La frase correcta era:{" "}
                <span className='correct-answer-text'>
                  {currentExercise.QuestionEN}
                </span>
              </p>
            )}
            {showCorrectAnswer && matchFeedback === "correct" && (
              <p className='correct-answer-display success-text'>
                ¡Correcto! {/* Este mensaje visual se mantiene */}
              </p>
            )}
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
                disabled={matchFeedback !== null || appIsLoading}
              />
              {/* El botón de verificar/enviar ahora está en LessonCard */}
            </div>
          </>
        )}

        {/* Mensaje si el tipo de ejercicio no es reconocido (solo para tipos de lección estándar) */}
        {![
          "translation",
          "fill_in_the_blank",
          "multiple_choice",
          "listening",
        ].includes(currentExercise.Type) && (
          <p className='info-text'>
            Tipo de ejercicio no soportado en esta lección:{" "}
            {currentExercise.Type}
          </p>
        )}
      </div>{" "}
      {/* Fin de card-content-area */}
    </>
  );
};

export default ExerciseDisplay;
