// src/Practice/components/PracticeExerciseDisplay.js
import React from "react";
import { normalizeText, renderClickableText } from "../../utils/textUtils";
import SpeechToTextButton from "../../components/SpeechToTextButton";

const PracticeExerciseDisplay = ({
  currentExercise,
  onPlayAudio,
  setAppMessage,
  appIsLoading,
  userTypedAnswer,
  setUserTypedAnswer,
  matchFeedback,
  showCorrectAnswer,
  recordedMicrophoneText,
  handleCheckAnswer,
  handleOptionClick,
  handleSpeechResultForListening,
  isAnswerVisible,
  setIsAnswerVisible,
}) => {
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

  const microphoneButton = (
    <SpeechToTextButton
      onResult={handleSpeechResultForListening}
      lang='en-US'
      disabled={matchFeedback !== null || appIsLoading}
    />
  );

  return (
    <>
      {currentExercise.Notes && (
        <div className='exercise-notes-display'>
          <p>{currentExercise.Notes}</p>
        </div>
      )}

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
        {currentExercise.Type === "practice_translation" && (
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

        {currentExercise.Type === "practice_fill_in_the_blank" && (
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
              <p className='correct-answer-display success-text'>¡Correcto!</p>
            )}
            <button
              onClick={handleCheckAnswer}
              className='button quiz-check-button'
              disabled={matchFeedback !== null || appIsLoading}
            >
              Verificar
            </button>
          </>
        )}

        {currentExercise.Type === "practice_multiple_choice" && (
          <>
            <div id='question-text' className='card-text question'>
              {currentExercise.QuestionES}
            </div>
            <div className='multiple-choice-options'>
              {currentExercise.OptionsEN.map((option, idx) => (
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
                      setAppMessage("");
                      setUserTypedAnswer(option);
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
                </span>
              </p>
            )}
          </>
        )}

        {currentExercise.Type === "practice_listening" && (
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
        )}

        {/* ¡NUEVO! Tipo de ejercicio de chat */}
        {currentExercise.Type === "practice_chat" && (
          <PracticeChatInterface
            dialogueSequence={currentExercise.DialogueSequence}
            onPlayAudio={onPlayAudio}
            appIsLoading={appIsLoading}
            userTypedAnswer={userTypedAnswer}
            setUserTypedAnswer={setUserTypedAnswer}
            matchFeedback={matchFeedback}
            setMatchFeedback={setMatchFeedback}
            handleCheckAnswer={handleCheckAnswer}
            setAppMessage={setAppMessage}
            setShowCorrectAnswer={setShowCorrectAnswer}
            showCorrectAnswer={showCorrectAnswer}
            recordedMicrophoneText={recordedMicrophoneText}
            handleSpeechResultForListening={handleSpeechResultForListening}
            expectedAnswerEN={currentExercise.AnswerEN} // Pasar la respuesta esperada para el chat
          />
        )}

        {/* Mensaje si el tipo de ejercicio no es reconocido */}
        {![
          "practice_translation",
          "practice_multiple_choice",
          "practice_fill_in_the_blank",
          "practice_listening",
          "practice_chat",
        ].includes(currentExercise.Type) && (
          <p className='info-text'>
            Tipo de ejercicio no soportado: {currentExercise.Type}
          </p>
        )}
      </div>
    </>
  );
};

export default PracticeExerciseDisplay;
