// src/lesson/components/ExerciseDisplay.js
import React from "react";
import { normalizeText, renderClickableText } from "../../utils/textUtils"; // Ajusta la ruta si es necesario
import SpeechToTextButton from "../../components/SpeechToTextButton"; // Ajusta la ruta si es necesario

const ExerciseDisplay = ({
  currentExercise,
  onPlayAudio,
  setAppMessage,
  appIsLoading, // Recibido como booleano
  isAnswerVisible,
  userTypedAnswer,
  matchFeedback,
  showCorrectAnswer,
  recordedMicrophoneText,
  handleCheckAnswer,
  handleOptionClick,
  handleSpeechResultForListening,
}) => {
  // Función para renderizar el botón de reproducción de audio
  const playAudioButton = (
    <button
      onClick={() => onPlayAudio(currentExercise.QuestionEN, "en-US")}
      className='button audio-button-round primary-button'
      disabled={appIsLoading} // Utiliza el booleano appIsLoading
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
                disabled={matchFeedback !== null || appIsLoading} // Utiliza el booleano appIsLoading
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
            disabled={matchFeedback !== null || appIsLoading}
          >
            {" "}
            // Utiliza el booleano appIsLoading Verificar
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
                    setAppMessage(""); // Limpiar mensaje si había
                    handleOptionClick(option);
                  }
                }}
                disabled={matchFeedback !== null || appIsLoading} // Utiliza el booleano appIsLoading
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
              disabled={appIsLoading} // Utiliza el booleano appIsLoading
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
              disabled={matchFeedback !== null || appIsLoading} // Utiliza el booleano appIsLoading
            />
          </div>

          {/* Mostrar lo que se grabó del micrófono (estilo flashcard) */}
          {recordedMicrophoneText && (
            <div className='recorded-text-display'>
              {recordedMicrophoneText}
            </div>
          )}

          {/* Contenido de la pregunta y respuesta oculta hasta que se intente responder */}
          {showCorrectAnswer && ( // Solo mostrar el contenido si ya hubo un intento de respuesta
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
          {/* Input de texto para el ejercicio de escucha si el usuario quiere escribir además de hablar */}
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
              disabled={matchFeedback !== null || appIsLoading} // Utiliza el booleano appIsLoading
            />
            <button
              onClick={handleCheckAnswer}
              className='button quiz-check-button'
              disabled={matchFeedback !== null || appIsLoading}
            >
              {" "}
              // Utiliza el booleano appIsLoading Verificar
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
