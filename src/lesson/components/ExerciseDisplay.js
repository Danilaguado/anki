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
  showCorrectAnswer,
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

  switch (currentExercise.Type) {
    case "translation":
      return (
        <>
          <div className='microphone-play-buttons-group'>
            {playAudioButton}
            {microphoneButton}
          </div>
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
            {currentExercise.QuestionES}{" "}
            {/* Mostrar QuestionES como traducción */}
          </div>
          <button
            onClick={() => setIsAnswerVisible(!isAnswerVisible)}
            className='button toggle-answer-button'
          >
            {isAnswerVisible ? "Ocultar Traducción" : "Mostrar Traducción"}
          </button>
          {recordedMicrophoneText && (
            <div className='recorded-text-display'>
              {recordedMicrophoneText}
            </div>
          )}
        </>
      );

    case "fill_in_the_blank":
      const blankPlaceholder = "_______";
      const parts = currentExercise.QuestionEN.split(blankPlaceholder);

      return (
        <>
          <div className='microphone-play-buttons-group'>
            {playAudioButton}
            {microphoneButton}
          </div>
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
                disabled={matchFeedback !== null || appIsLoading}
              />
              {parts[1]}
            </div>
            {showCorrectAnswer && matchFeedback !== "correct" && (
              <p className='correct-answer-display'>
                La respuesta correcta era:{" "}
                <span className='correct-answer-text'>
                  {currentExercise.AnswerEN}
                </span>{" "}
                {/* Usa AnswerEN aquí */}
              </p>
            )}
            {showCorrectAnswer && matchFeedback === "correct" && (
              <p className='correct-answer-display success-text'>¡Correcto!</p>
            )}
          </div>
          <button
            onClick={handleCheckAnswer}
            className='button quiz-check-button'
            disabled={matchFeedback !== null || appIsLoading}
          >
            Verificar
          </button>
          {recordedMicrophoneText && (
            <div className='recorded-text-display'>
              {recordedMicrophoneText}
            </div>
          )}
        </>
      );

    case "multiple_choice":
      // Las opciones ahora se esperan en inglés en currentExercise.OptionsEN
      const options = [
        ...(currentExercise.OptionsEN || []),
        currentExercise.AnswerEN,
      ].sort(() => Math.random() - 0.5); // Mezclar optionsEN y AnswerEN

      return (
        <>
          <div className='microphone-play-buttons-group'>
            {playAudioButton}
            {microphoneButton}
          </div>
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
                      normalizeText(currentExercise.AnswerEN)
                      ? "correct-option"
                      : ""
                  } {/* Compara con AnswerEN */}
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
                    setAppMessage("");
                    setUserTypedAnswer(option); // Guarda la opción seleccionada para el feedback visual
                    handleOptionClick(option);
                  }
                }}
                disabled={matchFeedback !== null || appIsLoading}
              >
                {option}
              </button>
            ))}
          </div>
          {showCorrectAnswer && matchFeedback === "correct" && (
            <p className='correct-answer-display success-text'>¡Correcto!</p>
          )}
          {showCorrectAnswer && matchFeedback !== "correct" && (
            <p className='correct-answer-display'>
              La respuesta correcta era:{" "}
              <span className='correct-answer-text'>
                {currentExercise.AnswerEN}
              </span>{" "}
              {/* Muestra AnswerEN */}
            </p>
          )}
          {recordedMicrophoneText && (
            <div className='recorded-text-display'>
              {recordedMicrophoneText}
            </div>
          )}
        </>
      );

    case "listening":
      return (
        <>
          <div className='microphone-play-buttons-group'>
            {playAudioButton}
            {microphoneButton}
          </div>

          {recordedMicrophoneText && (
            <div className='recorded-text-display'>
              {recordedMicrophoneText}
            </div>
          )}

          {/* El contenido de la pregunta y respuesta se muestra después de intentar responder (showCorrectAnswer) */}
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
              <div className='card-text answer'>
                {currentExercise.QuestionES}{" "}
                {/* Muestra la traducción en español de QuestionEN */}
              </div>
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
            <button
              onClick={handleCheckAnswer}
              className='button quiz-check-button'
              disabled={matchFeedback !== null || appIsLoading}
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

export default ExerciseDisplay;
