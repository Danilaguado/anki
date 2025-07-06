// src/lesson/components/ExerciseDisplay.js
import React, { useContext } from "react";
import { normalizeText, renderClickableText } from "../../utils/textUtils";
import SpeechToTextButton from "../../components/SpeechToTextButton";
import AppContext from "../../context/AppContext";
import "./ExerciseDisplay.css";

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
  onShowNotes, // Recibe la función para mostrar notas
}) => {
  const { onPlayAudio, appIsLoading } = useContext(AppContext);

  // Componente reutilizable para el botón de Play
  const PlayButton = ({ text, lang }) => (
    <button
      onClick={() => onPlayAudio(text, lang)}
      className='audio-button-round play-beside-text'
      disabled={appIsLoading}
      aria-label='Reproducir audio'
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='currentColor'
      >
        <path d='M8 5v14l11-7z'></path>
      </svg>
    </button>
  );

  const microphoneButton = (
    <SpeechToTextButton
      onResult={handleSpeechResultForListening}
      lang='en-US'
      disabled={matchFeedback !== null || appIsLoading}
    />
  );

  return (
    <>
      {/* El grupo superior ahora solo tiene el micrófono si es necesario */}
      {currentExercise.Type === "listening" && (
        <div className='microphone-play-buttons-group'>{microphoneButton}</div>
      )}

      {recordedMicrophoneText && (
        <div className='recorded-text-display'>{recordedMicrophoneText}</div>
      )}

      <div
        className={`card-content-area quiz-content-area ${
          matchFeedback ? `match-${matchFeedback}` : ""
        }`}
      >
        {/* CAMBIO: Botón de notas renderizado aquí para posicionamiento absoluto */}
        {currentExercise?.Notes && (
          <button
            className='notes-toggle-button'
            onClick={() => onShowNotes(currentExercise.Notes)}
            aria-label='Mostrar notas del ejercicio'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path
                fillRule='evenodd'
                d='M4.475 5.458c-.284 0-.514-.237-.47-.517C4.28 3.24 5.576 2 7.825 2c2.25 0 3.767 1.36 3.767 3.215 0 1.344-.665 2.288-1.79 2.973-1.1.659-1.414 1.118-1.414 2.01v.03a.5.5 0 0 1-.5.5h-.77a.5.5 0 0 1-.5-.495l-.003-.2c-.043-1.221.477-2.001 1.645-2.712 1.03-.632 1.397-1.135 1.397-2.028 0-.979-.758-1.698-1.926-1.698-1.009 0-1.71.529-1.938 1.402-.066.254-.278.461-.54.461h-.777ZM7.496 14c.622 0 1.095-.474 1.095-1.09 0-.618-.473-1.092-1.095-1.092-.606 0-1.087.474-1.087 1.091S6.89 14 7.496 14'
              />
            </svg>
          </button>
        )}

        {/* Lógica para cada tipo de ejercicio */}

        {currentExercise.Type === "translation" && (
          <>
            {/* CAMBIO: Contenedor flex para pregunta y botón */}
            <div className='question-container'>
              <div id='question-text' className='card-text question'>
                {renderClickableText(
                  currentExercise.QuestionEN,
                  "en-US",
                  true,
                  onPlayAudio
                )}
              </div>
              <PlayButton text={currentExercise.QuestionEN} lang='en-US' />
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

        {currentExercise.Type === "multiple_choice" && (
          <>
            {/* CAMBIO: Contenedor flex para pregunta y botón */}
            <div className='question-container'>
              <div id='question-text' className='card-text question'>
                {currentExercise.QuestionES}
              </div>
              <PlayButton text={currentExercise.QuestionES} lang='es' />
            </div>
            <div className='multiple-choice-options'>
              {currentExercise.OptionsEN.map((option, idx) => (
                <button
                  key={idx}
                  className={`button multiple-choice-button ${
                    normalizeText(option) === normalizeText(userTypedAnswer)
                      ? "selected-option"
                      : ""
                  } ${
                    matchFeedback &&
                    normalizeText(option) ===
                      normalizeText(currentExercise.AnswerEN)
                      ? "correct-option"
                      : ""
                  } ${
                    matchFeedback === "incorrect" &&
                    normalizeText(option) === normalizeText(userTypedAnswer)
                      ? "incorrect-selected-option"
                      : ""
                  }`}
                  onClick={() => handleOptionClick(option)}
                  disabled={matchFeedback !== null || appIsLoading}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ... (resto de tus tipos de ejercicio como 'fill_in_the_blank', 'listening', etc.) */}
      </div>
    </>
  );
};

export default ExerciseDisplay;
