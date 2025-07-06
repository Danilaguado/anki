// src/lesson/components/ExerciseDisplay.js
import React, { useContext } from "react";
import { normalizeText, renderClickableText } from "../../utils/textUtils";
import SpeechToTextButton from "../../components/SpeechToTextButton";
import AppContext from "../../context/AppContext";
import "./ExerciseDisplay.css"; // Importa la hoja de estilos

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
  onShowNotes,
}) => {
  const { onPlayAudio, appIsLoading } = useContext(AppContext);

  const microphoneButton = (
    <SpeechToTextButton
      onResult={(transcript) => {
        setUserTypedAnswer(transcript);
        handleSpeechResultForListening(transcript);
      }}
      lang='en-US'
      disabled={matchFeedback !== null || appIsLoading}
    />
  );

  const showFooter = [
    "multiple_choice",
    "fill_in_the_blank",
    "listening",
    "translation",
  ].includes(currentExercise.Type);

  return (
    <>
      <div className='card-content-area'>
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

        <div className='question-container'>
          <div className='question-line'>
            {/* CAMBIO: Botón de Play movido a la izquierda del texto */}
            <button
              className='play-button-inline'
              onClick={() =>
                onPlayAudio(
                  currentExercise.Type === "multiple_choice"
                    ? currentExercise.QuestionES
                    : currentExercise.QuestionEN,
                  currentExercise.Type === "multiple_choice" ? "es" : "en-US"
                )
              }
              disabled={appIsLoading}
              aria-label='Reproducir audio de la pregunta'
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
            <h2 className='question-text'>
              {currentExercise.Type === "multiple_choice"
                ? currentExercise.QuestionES
                : currentExercise.QuestionEN}
            </h2>
          </div>

          {currentExercise.Type !== "multiple_choice" && (
            <p className='question-translation'>{currentExercise.QuestionES}</p>
          )}
        </div>

        {recordedMicrophoneText && (
          <div className='recorded-text-display'>{recordedMicrophoneText}</div>
        )}
      </div>

      {showFooter && (
        <div className='exercise-footer'>
          {currentExercise.Type === "multiple_choice" && (
            <div className='multiple-choice-options'>
              {currentExercise.OptionsEN.map((option, idx) => (
                <button
                  key={idx}
                  className={`button option-button ${
                    userTypedAnswer === option ? "selected" : ""
                  }`}
                  onClick={() => handleOptionClick(option)}
                  disabled={matchFeedback !== null || appIsLoading}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {(currentExercise.Type === "fill_in_the_blank" ||
            currentExercise.Type === "listening") && (
            <div className='input-with-mic-group'>
              <input
                type='text'
                className='input-field'
                placeholder='Escribe tu respuesta...'
                value={userTypedAnswer}
                onChange={(e) => setUserTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCheckAnswer();
                }}
                disabled={matchFeedback !== null || appIsLoading}
                autoFocus
              />
              {microphoneButton}
            </div>
          )}

          {currentExercise.Type === "translation" && (
            <div className='input-with-mic-group'>
              <button
                onClick={() => setIsAnswerVisible(!isAnswerVisible)}
                className='button toggle-answer-button'
              >
                {isAnswerVisible ? "Ocultar" : "Mostrar"} Traducción
              </button>
              {microphoneButton}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ExerciseDisplay;
