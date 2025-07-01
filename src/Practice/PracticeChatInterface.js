// src/Practice/components/PracticeChatInterface.js
// ¡Este componente ahora gestiona el flujo de toda la lección de chat!

import React, { useState, useEffect, useRef } from "react";
import { normalizeText } from "../utils/textUtils"; // Ruta relativa
import SpeechToTextButton from "../components/SpeechToTextButton"; // Ruta relativa
import "./PracticeChatInterface.css"; // Correcto: en la misma carpeta

const PracticeChatInterface = ({
  dialogueSequence, // ¡Ahora es el array COMPLETO de ejercicios de la lección!
  onPlayAudio,
  appIsLoading,
  userTypedAnswer,
  setUserTypedAnswer,
  setAppMessage,
  onDialogueComplete, // Callback al completar *toda la lección* de chat

  // currentDialogueIndex y setCurrentDialogueIndex ahora vienen del padre (LessonCard)
  currentDialogueIndex,
  setCurrentDialogueIndex,
}) => {
  // Estado local para los mensajes que se han mostrado en el chat
  const [chatMessages, setChatMessages] = useState([]);
  // Estado local para el feedback de la última respuesta del usuario
  const [lastFeedback, setLastFeedback] = useState(null);
  const [lastExpectedAnswer, setLastExpectedAnswer] = useState("");
  // Estado local para el texto grabado por el micrófono
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");
  // Estado local para mostrar la respuesta correcta
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  const chatMessagesRef = useRef(null); // Para hacer scroll automático

  // Efecto para inicializar el chat y avanzar automáticamente los mensajes de la IA
  useEffect(() => {
    setChatMessages([]);
    setLastFeedback(null);
    setLastExpectedAnswer("");
    setUserTypedAnswer("");
    setRecordedMicrophoneText("");
    setShowCorrectAnswer(false);
    setAppMessage(""); // Limpiar mensaje global al iniciar nuevo chat

    // Iniciar el chat con el primer elemento de la secuencia de diálogo (que es el primer ejercicio)
    if (dialogueSequence && dialogueSequence.length > 0) {
      const firstExercise = dialogueSequence[0];
      // Si el primer ejercicio es un chat de diálogo (Type: 'practice_chat')
      if (
        firstExercise.Type === "practice_chat" &&
        firstExercise.DialogueSequence &&
        firstExercise.DialogueSequence.length > 0
      ) {
        const firstChatStep = firstExercise.DialogueSequence[0];
        if (firstChatStep && firstChatStep.speaker === "ai") {
          setChatMessages([
            {
              id: `ai-${Date.now()}-0`,
              speaker: "ai",
              phraseEN: firstChatStep.phraseEN,
              phraseES: firstChatStep.phraseES,
            },
          ]);
          // Avanzar el índice del diálogo interno al siguiente paso del chat
          setCurrentDialogueIndex(1);
        } else if (firstChatStep && firstChatStep.speaker === "user") {
          setCurrentDialogueIndex(0); // El primer paso del chat es del usuario
        }
      } else {
        // Si el primer ejercicio NO es un 'practice_chat' (ej. es un multiple_choice de refuerzo),
        // lo tratamos como un mensaje de la IA para iniciar el flujo.
        setChatMessages([
          {
            id: `ai-${Date.now()}-0`,
            speaker: "ai",
            phraseEN: firstExercise.QuestionEN,
            phraseES: firstExercise.QuestionES,
          },
        ]);
        setCurrentDialogueIndex(0); // Mantenemos el índice en 0, esperando la respuesta del usuario para este ejercicio
      }
    }
  }, [
    dialogueSequence,
    onPlayAudio,
    setAppMessage,
    setUserTypedAnswer,
    setCurrentDialogueIndex,
  ]); // Dependencias para reinicializar si la lección cambia

  // Efecto para hacer scroll al final del chat y manejar las respuestas automáticas de la IA
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }

    // Lógica para que la IA responda automáticamente y para que el chat avance.
    // Esto se dispara cuando currentDialogueIndex cambia (después de una respuesta correcta del usuario)
    // o al inicializar si el primer mensaje es de la IA.
    if (dialogueSequence && currentDialogueIndex < dialogueSequence.length) {
      const currentExerciseData = dialogueSequence[currentDialogueIndex];

      // Si el ejercicio actual es de tipo 'practice_chat' y es el turno de la IA en su secuencia interna
      if (
        currentExerciseData.Type === "practice_chat" &&
        currentExerciseData.DialogueSequence &&
        currentDialogueStep < currentExerciseData.DialogueSequence.length
      ) {
        const currentChatStep =
          currentExerciseData.DialogueSequence[currentDialogueStep];

        if (currentChatStep && currentChatStep.speaker === "ai") {
          setTimeout(() => {
            setChatMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}-${currentDialogueIndex}-${currentDialogueStep}`,
                speaker: "ai",
                phraseEN: currentChatStep.phraseEN,
                phraseES: currentChatStep.phraseES,
              },
            ]);
            setCurrentDialogueIndex((prev) => prev + 1); // Avanza al siguiente paso interno del chat
            setLastFeedback(null);
            setLocalExpectedAnswer("");
            setAppMessage("");
            setShowCorrectAnswer(false);
          }, 1000);
        }
      } else if (currentExerciseData.Type !== "practice_chat") {
        // Si no es un chat de diálogo, pero es un ejercicio de refuerzo (multiple_choice, fill_in_the_blank, etc.)
        // y el usuario acaba de responder el anterior correctamente, mostramos la "pregunta" del ejercicio como si fuera la IA.
        // Esto solo se hará una vez por ejercicio.
        const lastMessageIsUserCorrect =
          chatMessages.length > 0 &&
          chatMessages[chatMessages.length - 1].speaker === "user" &&
          lastFeedback === "correct";

        if (lastMessageIsUserCorrect || currentDialogueStep === 0) {
          // Si el usuario acertó el anterior, o es el primer ejercicio (no chat)
          const messageId = `ai-exercise-${Date.now()}-${currentDialogueIndex}`;
          const existingMessage = chatMessages.find(
            (msg) => msg.id === messageId
          );

          if (!existingMessage) {
            // Evitar duplicar el mensaje del ejercicio
            setTimeout(() => {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: messageId,
                  speaker: "ai",
                  phraseEN: currentExerciseData.QuestionEN,
                  phraseES: currentExerciseData.QuestionES,
                  type: currentExerciseData.Type, // Para que el frontend sepa cómo renderizarlo
                  optionsEN: currentExerciseData.OptionsEN,
                  answerEN: currentExerciseData.AnswerEN,
                },
              ]);
              // No avanzamos currentDialogueIndex aquí, esperamos la respuesta del usuario
              setLastFeedback(null);
              setLocalExpectedAnswer("");
              setAppMessage("");
              setShowCorrectAnswer(false);
            }, 500);
          }
        }
      }
    } else if (dialogueCompleted && onDialogueComplete) {
      onDialogueComplete(); // Notificar al padre que toda la lección de chat ha terminado
    }
  }, [
    chatMessages,
    currentDialogueIndex,
    dialogueSequence,
    dialogueCompleted,
    onDialogueComplete,
    setAppMessage,
    setShowCorrectAnswer,
    setLastFeedback,
    setLocalExpectedAnswer,
  ]);

  // Manejar el envío de la respuesta del usuario en el chat
  const handleChatSubmit = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta para continuar.");
      return;
    }

    const currentExerciseData = dialogueSequence[currentDialogueIndex];
    let expectedAnswerForCurrentTurn = "";

    if (currentExerciseData.Type === "practice_chat") {
      // Si es un ejercicio de chat, la respuesta esperada viene de DialogueSequence
      const currentChatStep =
        currentExerciseData.DialogueSequence[currentDialogueStep];
      if (!currentChatStep || currentChatStep.speaker !== "user") {
        setAppMessage("No es tu turno de responder o el diálogo ha terminado.");
        return;
      }
      expectedAnswerForCurrentTurn = currentChatStep.expectedEN;
    } else {
      // Si es un ejercicio de refuerzo, la respuesta esperada es AnswerEN del ejercicio
      expectedAnswerForCurrentTurn = currentExerciseData.AnswerEN;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    const normalizedExpectedAnswer = normalizeText(
      expectedAnswerForCurrentTurn || ""
    );

    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}-${currentDialogueIndex}-${currentDialogueStep}`,
        speaker: "user",
        phraseEN: userTypedAnswer,
        expectedEN: expectedAnswerForCurrentTurn, // Guarda la respuesta esperada para referencia
      },
    ]);

    if (normalizedUserAnswer === normalizedExpectedAnswer) {
      setLastFeedback("correct");
      setAppMessage("¡Correcto!");
      setLocalExpectedAnswer("");
      setUserTypedAnswer(""); // Limpia el input
      setShowCorrectAnswer(true);

      // Avanzar al siguiente paso (si es chat interno) o al siguiente ejercicio (si es de refuerzo)
      if (currentExerciseData.Type === "practice_chat") {
        setCurrentDialogueIndex((prev) => prev + 1); // Avanza dentro del diálogo interno
      } else {
        // Si es un ejercicio de refuerzo y se acertó, avanzar al siguiente ejercicio de la lección
        setCurrentDialogueIndex((prev) => prev + 1);
      }
    } else {
      setLastFeedback("incorrect");
      setLocalExpectedAnswer(expectedAnswerForCurrentTurn);
      setAppMessage("Incorrecto. Intenta de nuevo.");
      setShowCorrectAnswer(true);
      // No avanzamos el currentDialogueIndex si es incorrecto
    }
  };

  // Renderizar el botón de reproducción de audio para la línea de la IA
  const playAudioButton = (phrase) => (
    <button
      onClick={() => onPlayAudio(phrase, "en-US")}
      className='button audio-button-round primary-button small-button'
      disabled={appIsLoading}
      aria-label={`Reproducir: ${phrase}`}
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

  // Renderizar el botón de micrófono para la línea del usuario
  const microphoneButton = (
    <SpeechToTextButton
      onResult={(transcript) => {
        setRecordedMicrophoneText(transcript);
        setUserTypedAnswer(transcript);
      }}
      lang='en-US'
      disabled={
        appIsLoading || (lastFeedback === "correct" && isUserTurnCurrent)
      }
    />
  );

  // Determinar si el diálogo ha terminado (no hay más pasos)
  const dialogueCompleted =
    dialogueSequence && currentDialogueIndex >= dialogueSequence.length;
  // Determinar si el turno actual es del usuario
  const isUserTurnCurrent =
    dialogueSequence &&
    currentDialogueIndex < dialogueSequence.length &&
    dialogueSequence[currentDialogueIndex]?.speaker === "user";

  // Renderizar el contenido del ejercicio de refuerzo si no es un 'practice_chat'
  const renderReinforcementExercise = (exercise) => {
    switch (exercise.Type) {
      case "practice_multiple_choice":
        const options = [...(exercise.OptionsEN || []), exercise.AnswerEN].sort(
          () => Math.random() - 0.5
        );
        return (
          <>
            <div className='chat-exercise-question'>
              <span className='chat-question-text'>{exercise.QuestionES}</span>
              {playAudioButton(exercise.QuestionEN)}
            </div>
            <div className='multiple-choice-options'>
              {options.map((option, idx) => (
                <button
                  key={idx}
                  className={`button multiple-choice-button 
                    ${
                      lastFeedback &&
                      normalizeText(option) === normalizeText(exercise.AnswerEN)
                        ? "correct-option"
                        : ""
                    }
                    ${
                      lastFeedback &&
                      normalizeText(option) ===
                        normalizeText(userTypedAnswer) &&
                      lastFeedback === "incorrect"
                        ? "incorrect-selected-option"
                        : ""
                    }
                  `}
                  onClick={() => {
                    if (lastFeedback === null) {
                      setAppMessage("");
                      setUserTypedAnswer(option); // Guarda la opción seleccionada
                      handleChatSubmit(); // Llama a la lógica de envío del chat
                    }
                  }}
                  disabled={lastFeedback !== null || appIsLoading}
                >
                  {option}
                </button>
              ))}
            </div>
            {lastFeedback && lastFeedback === "correct" && (
              <p className='chat-feedback-message correct'>¡Correcto!</p>
            )}
            {lastFeedback && lastFeedback === "incorrect" && (
              <p className='chat-feedback-message incorrect'>
                Incorrecto. La respuesta esperada era: {exercise.AnswerEN}
              </p>
            )}
          </>
        );
      case "practice_fill_in_the_blank":
        const blankPlaceholder = "_______";
        const parts = exercise.QuestionEN.split(blankPlaceholder);
        return (
          <>
            <div className='chat-exercise-question'>
              <span className='chat-question-text'>{parts[0]}</span>
              <input
                type='text'
                className='input-field chat-input-inline'
                value={userTypedAnswer}
                onChange={(e) => setUserTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleChatSubmit();
                }}
                disabled={lastFeedback !== null || appIsLoading}
              />
              <span className='chat-question-text'>{parts[1]}</span>
              {playAudioButton(exercise.QuestionEN)}
            </div>
            <p className='fill-in-the-blank-translation'>
              {exercise.QuestionES}
            </p>
            {lastFeedback && lastFeedback === "correct" && (
              <p className='chat-feedback-message correct'>¡Correcto!</p>
            )}
            {lastFeedback && lastFeedback === "incorrect" && (
              <p className='chat-feedback-message incorrect'>
                Incorrecto. La respuesta esperada era: {exercise.AnswerEN}
              </p>
            )}
            <button
              onClick={handleChatSubmit}
              className='button primary-button chat-send-button'
              disabled={lastFeedback !== null || appIsLoading}
            >
              Verificar
            </button>
          </>
        );
      case "practice_translation":
        return (
          <>
            <div className='chat-exercise-question'>
              <span className='chat-question-text'>{exercise.QuestionEN}</span>
              {playAudioButton(exercise.QuestionEN)}
            </div>
            <p className='chat-translation-hint'>{exercise.QuestionES}</p>
            {lastFeedback && lastFeedback === "correct" && (
              <p className='chat-feedback-message correct'>¡Correcto!</p>
            )}
            {lastFeedback && lastFeedback === "incorrect" && (
              <p className='chat-feedback-message incorrect'>
                Incorrecto. La respuesta esperada era: {exercise.AnswerEN}
              </p>
            )}
            <div className='chat-input-area'>
              <input
                type='text'
                className='input-field chat-input'
                placeholder='Tu traducción en inglés...'
                value={userTypedAnswer}
                onChange={(e) => setUserTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleChatSubmit();
                }}
                disabled={lastFeedback !== null || appIsLoading}
              />
              {microphoneButton}
              <button
                onClick={handleChatSubmit}
                className='button primary-button chat-send-button'
                disabled={lastFeedback !== null || appIsLoading}
              >
                Enviar
              </button>
            </div>
          </>
        );
      case "practice_listening":
        return (
          <>
            <div className='chat-exercise-question'>
              <span className='chat-question-text'>
                Escucha y escribe lo que oigas:
              </span>
              {playAudioButton(exercise.QuestionEN)}
            </div>
            <p className='chat-translation-hint'>{exercise.QuestionES}</p>
            {recordedMicrophoneText && (
              <div className='recorded-text-display'>
                {recordedMicrophoneText}
              </div>
            )}
            {lastFeedback && lastFeedback === "correct" && (
              <p className='chat-feedback-message correct'>¡Correcto!</p>
            )}
            {lastFeedback && lastFeedback === "incorrect" && (
              <p className='chat-feedback-message incorrect'>
                Incorrecto. La respuesta esperada era: {exercise.QuestionEN}
              </p>
            )}
            <div className='chat-input-area'>
              <input
                type='text'
                className='input-field chat-input'
                placeholder='Escribe lo que escuchaste aquí'
                value={userTypedAnswer}
                onChange={(e) => setUserTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleChatSubmit();
                }}
                disabled={lastFeedback !== null || appIsLoading}
              />
              {microphoneButton}
              <button
                onClick={handleChatSubmit}
                className='button primary-button chat-send-button'
                disabled={lastFeedback !== null || appIsLoading}
              >
                Verificar
              </button>
            </div>
          </>
        );
      default:
        return (
          <p className='info-text'>
            Tipo de ejercicio de refuerzo no soportado: {exercise.Type}
          </p>
        );
    }
  };

  return (
    <div className='chat-lesson-container'>
      <div className='chat-container' ref={chatMessagesRef}>
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.speaker}`}>
            {msg.speaker === "ai" ? (
              <div className='chat-text-with-audio'>
                <span>{msg.phraseEN || msg.QuestionEN}</span>{" "}
                {/* Puede ser phraseEN o QuestionEN */}
                {playAudioButton(msg.phraseEN || msg.QuestionEN)}
              </div>
            ) : (
              <span>{msg.phraseEN}</span>
            )}
            {msg.speaker === "ai" && (
              <p className='chat-translation'>
                {msg.phraseES || msg.QuestionES}
              </p>
            )}{" "}
            {/* Puede ser phraseES o QuestionES */}
            {/* Mostrar el contenido del ejercicio de refuerzo si es el turno de la IA y no es un chat interno */}
            {msg.speaker === "ai" &&
              msg.type &&
              msg.type !== "practice_chat" &&
              renderReinforcementExercise(msg)}
            {msg.speaker === "user" &&
              msg.id === chatMessages[chatMessages.length - 1]?.id &&
              lastFeedback === "incorrect" &&
              showCorrectAnswer && (
                <p className='chat-translation incorrect-answer-hint'>
                  Esperado: {lastExpectedAnswer}
                </p>
              )}
          </div>
        ))}
      </div>

      {/* Mostrar el input del usuario solo si es su turno y el diálogo no ha terminado */}
      {isUserTurnCurrent && !dialogueCompleted && (
        <div className='chat-input-area current-user-input'>
          <input
            type='text'
            className='input-field chat-input'
            placeholder='Tu respuesta en inglés...'
            value={userTypedAnswer}
            onChange={(e) => setUserTypedAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleChatSubmit();
            }}
            disabled={
              appIsLoading || (lastFeedback === "correct" && isUserTurnCurrent)
            }
          />
          {microphoneButton}
          <button
            onClick={handleChatSubmit}
            className='button primary-button chat-send-button'
            disabled={
              appIsLoading || (lastFeedback === "correct" && isUserTurnCurrent)
            }
          >
            Enviar
          </button>
        </div>
      )}

      {/* Mostrar feedback de acierto/error para la última interacción (debajo del input) */}
      {lastFeedback && lastFeedback === "correct" && (
        <p className='chat-feedback-message correct'>¡Correcto!</p>
      )}
      {lastFeedback && lastFeedback === "incorrect" && (
        <p className='chat-feedback-message incorrect'>
          Incorrecto. La respuesta esperada era: {localExpectedAnswer}
        </p>
      )}

      {/* Mensaje de diálogo completado */}
      {dialogueCompleted && (
        <p className='info-text'>
          ¡Diálogo completado! Haz clic en Siguiente Ejercicio para continuar.
        </p>
      )}
    </div>
  );
};

export default PracticeChatInterface;
