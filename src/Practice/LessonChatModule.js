// src/Practice/LessonChatModule.js
// ¡Este componente ahora gestiona el flujo de toda la lección de chat!

import React, { useState, useEffect, useRef } from "react";
import { normalizeText, renderClickableText } from "../utils/textUtils"; // Ruta relativa
import SpeechToTextButton from "../components/SpeechToTextButton"; // Ruta relativa
import "./PracticeChatInterface.css"; // Correcto: en la misma carpeta

const LessonChatModule = ({
  lessonExercises, // Recibe TODOS los ejercicios de la lección
  onPlayAudio,
  appIsLoading,
  userTypedAnswer,
  setUserTypedAnswer,
  setAppMessage,
  onDialogueComplete, // Callback al completar *toda la lección* de chat

  // currentDialogueIndex y setCurrentDialogueIndex ahora vienen del padre (LessonCard)
  currentLessonExerciseIndex, // <-- ¡CORREGIDO! Usar el nombre del padre
  setCurrentLessonExerciseIndex, // <-- ¡CORREGIDO! Usar el nombre del padre
}) => {
  // Estado local para el progreso *interno* de un diálogo de chat (si el ejercicio es 'practice_chat')
  const [currentChatDialogueStep, setCurrentChatDialogueStep] = useState(0); // <-- Declarado
  // Estado para almacenar todos los mensajes que ya se han mostrado en el chat
  const [chatMessages, setChatMessages] = useState([]);
  // Estados de feedback y micrófono (ahora locales a este componente)
  const [lastFeedback, setLastFeedback] = useState(null);
  const [localExpectedAnswer, setLocalExpectedAnswer] = useState("");
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  const chatMessagesRef = useRef(null); // Para hacer scroll automático

  // Determinar si toda la lección de chat ha terminado (todos los ejercicios)
  const dialogueCompleted =
    lessonExercises && currentLessonExerciseIndex >= lessonExercises.length;
  // Determinar si el turno actual es del usuario
  const isUserTurnCurrent =
    lessonExercises &&
    currentLessonExerciseIndex < lessonExercises.length &&
    lessonExercises[currentLessonExerciseIndex].Type === "practice_chat" &&
    lessonExercises[currentLessonExerciseIndex].DialogueSequence &&
    currentChatDialogueStep <
      lessonExercises[currentLessonExerciseIndex].DialogueSequence.length &&
    lessonExercises[currentLessonExerciseIndex].DialogueSequence[
      currentChatDialogueStep
    ]?.speaker === "user";

  // Efecto para inicializar el chat con el primer ejercicio de la lección
  useEffect(() => {
    // Resetear todos los estados relevantes al cargar un nuevo diálogo
    setChatMessages([]);
    setCurrentLessonExerciseIndex(0); // Reinicia el progreso de la lección
    setCurrentChatDialogueStep(0); // Reinicia el paso del diálogo interno
    setLastFeedback(null);
    setLocalExpectedAnswer("");
    setUserTypedAnswer("");
    setRecordedMicrophoneText("");
    setShowCorrectAnswer(false);
    setAppMessage(""); // Limpiar mensaje global al iniciar nuevo chat

    if (lessonExercises && lessonExercises.length > 0) {
      const firstExercise = lessonExercises[currentLessonExerciseIndex];

      if (
        firstExercise &&
        firstExercise.Type === "practice_chat" &&
        firstExercise.DialogueSequence &&
        firstExercise.DialogueSequence.length > 0
      ) {
        const firstChatStep = firstExercise.DialogueSequence[0];
        if (firstChatStep && firstChatStep.speaker === "ai") {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `ai-intro-${Date.now()}`,
              speaker: "ai",
              phraseEN: firstChatStep.phraseEN,
              phraseES: firstChatStep.phraseES,
              notes: firstExercise.Notes, // Añadir notas del ejercicio si es el primer mensaje
            },
          ]);
          setCurrentChatDialogueStep(1); // Avanza al siguiente paso del diálogo interno
        } else if (firstChatStep && firstChatStep.speaker === "user") {
          // Si el primer paso del chat es del usuario, esperamos su input
          setChatMessages((prev) => [
            ...prev,
            {
              // Añadir mensaje introductorio si el usuario empieza
              id: `ai-intro-${Date.now()}`,
              speaker: "ai",
              phraseEN: firstExercise.QuestionEN,
              phraseES: firstExercise.QuestionES,
              notes: firstExercise.Notes,
            },
          ]);
          setCurrentChatDialogueStep(0);
        }
        setLocalExpectedAnswer(firstExercise.AnswerEN || ""); // Inicializar con la AnswerEN del primer ejercicio
      } else if (firstExercise) {
        // Si el primer ejercicio NO es un 'practice_chat'
        setChatMessages((prev) => [
          ...prev,
          {
            id: `ai-exercise-intro-${Date.now()}`,
            speaker: "ai",
            phraseEN: firstExercise.QuestionEN,
            phraseES: firstExercise.QuestionES,
            type: firstExercise.Type,
            optionsEN: firstExercise.OptionsEN,
            answerEN: firstExercise.AnswerEN,
            notes: firstExercise.Notes,
          },
        ]);
        setLocalExpectedAnswer(
          firstExercise.AnswerEN || firstExercise.QuestionEN || ""
        ); // Inicializar con la AnswerEN/QuestionEN
      }
    }
  }, [
    lessonExercises,
    setAppMessage,
    setUserTypedAnswer,
    setRecordedMicrophoneText,
    setShowCorrectAnswer,
    setLastFeedback,
    setLocalExpectedAnswer,
    setCurrentLessonExerciseIndex,
    setCurrentChatDialogueStep,
  ]); // Dependencias completas y correctas

  // Efecto para hacer scroll al final del chat y manejar el avance automático
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }

    if (
      lessonExercises &&
      currentLessonExerciseIndex < lessonExercises.length
    ) {
      const currentExerciseData = lessonExercises[currentLessonExerciseIndex];

      if (currentExerciseData && currentExerciseData.Type === "practice_chat") {
        if (
          currentChatDialogueStep < currentExerciseData.DialogueSequence.length
        ) {
          const currentChatStep =
            currentExerciseData.DialogueSequence[currentChatDialogueStep];
          if (currentChatStep && currentChatStep.speaker === "ai") {
            setTimeout(() => {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: `ai-${Date.now()}-${currentLessonExerciseIndex}-${currentChatDialogueStep}`,
                  speaker: "ai",
                  phraseEN: currentChatStep.phraseEN,
                  phraseES: currentChatStep.phraseES,
                  notes: currentExerciseData.Notes,
                },
              ]);
              setCurrentChatDialogueStep((prev) => prev + 1);
              setLastFeedback(null);
              setLocalExpectedAnswer("");
              setAppMessage("");
              setShowCorrectAnswer(false);
            }, 1000);
          }
        } else {
          // El diálogo interno del 'practice_chat' ha terminado, avanzar al siguiente ejercicio de la lección
          if (currentLessonExerciseIndex < lessonExercises.length - 1) {
            setCurrentLessonExerciseIndex((prev) => prev + 1);
            setCurrentChatDialogueStep(0); // Reiniciar el diálogo interno para el nuevo ejercicio
            setLastFeedback(null);
            setLocalExpectedAnswer("");
            setAppMessage("¡Diálogo completado! Siguiente ejercicio.");
            setShowCorrectAnswer(false);
          } else {
            // Todos los ejercicios de la lección han terminado
            if (onDialogueComplete) {
              onDialogueComplete();
            }
          }
        }
      } else if (currentExerciseData) {
        // Si es un ejercicio de refuerzo (no chat)
        const lastMessageIsUserCorrect =
          chatMessages.length > 0 &&
          chatMessages[chatMessages.length - 1].speaker === "user" &&
          lastFeedback === "correct";
        const isFirstRenderOfExercise =
          chatMessages.length > 0 &&
          chatMessages[chatMessages.length - 1].id.startsWith(
            "ai-exercise-intro-"
          ) &&
          chatMessages[chatMessages.length - 1].id.includes(
            currentLessonExerciseIndex.toString()
          );

        if (
          lastMessageIsUserCorrect ||
          (currentChatDialogueStep === 0 && !isFirstRenderOfExercise)
        ) {
          const messageId = `ai-exercise-${Date.now()}-${currentLessonExerciseIndex}`;
          const existingMessage = chatMessages.find(
            (msg) => msg.id === messageId
          );

          if (!existingMessage) {
            setTimeout(() => {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: messageId,
                  speaker: "ai",
                  phraseEN: currentExerciseData.QuestionEN,
                  phraseES: currentExerciseData.QuestionES,
                  type: currentExerciseData.Type,
                  optionsEN: currentExerciseData.OptionsEN,
                  answerEN: currentExerciseData.AnswerEN,
                  notes: currentExerciseData.Notes,
                },
              ]);
              setLastFeedback(null);
              setLocalExpectedAnswer("");
              setAppMessage("");
              setShowCorrectAnswer(false);
            }, 500);
          }
        }
      }
    } else if (dialogueCompleted && onDialogueComplete) {
      onDialogueComplete();
    }
  }, [
    chatMessages,
    currentLessonExerciseIndex,
    currentChatDialogueStep,
    lessonExercises,
    dialogueCompleted,
    onDialogueComplete,
    setAppMessage,
    setShowCorrectAnswer,
    setLastFeedback,
    setLocalExpectedAnswer,
    setCurrentLessonExerciseIndex,
    setCurrentChatDialogueStep,
  ]);

  // Manejar el envío de la respuesta del usuario en el chat
  const handleChatSubmit = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta para continuar.");
      return;
    }

    const currentExerciseData = lessonExercises[currentLessonExerciseIndex];
    let expectedAnswerForCurrentTurn = "";

    if (currentExerciseData.Type === "practice_chat") {
      const currentChatStep =
        currentExerciseData.DialogueSequence[currentChatDialogueStep];
      if (!currentChatStep || currentChatStep.speaker !== "user") {
        setAppMessage("No es tu turno de responder o el diálogo ha terminado.");
        return;
      }
      expectedAnswerForCurrentTurn = currentChatStep.expectedEN;
    } else {
      expectedAnswerForCurrentTurn = currentExerciseData.AnswerEN;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    const normalizedExpectedAnswer = normalizeText(
      expectedAnswerForCurrentTurn || ""
    );

    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}-${currentLessonExerciseIndex}-${currentChatDialogueStep}`,
        speaker: "user",
        phraseEN: userTypedAnswer,
        expectedEN: expectedAnswerForCurrentTurn,
      },
    ]);

    if (normalizedUserAnswer === normalizedExpectedAnswer) {
      setLastFeedback("correct");
      setAppMessage("¡Correcto!");
      setLocalExpectedAnswer("");
      setUserTypedAnswer("");
      setShowCorrectAnswer(true);

      if (currentExerciseData.Type === "practice_chat") {
        setCurrentChatDialogueStep((prev) => prev + 1);
      } else {
        setCurrentLessonExerciseIndex((prev) => prev + 1);
        setCurrentChatDialogueStep(0);
      }
    } else {
      setLastFeedback("incorrect");
      setLocalExpectedAnswer(expectedAnswerForCurrentTurn);
      setAppMessage("Incorrecto. Intenta de nuevo.");
      setShowCorrectAnswer(true);
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

  // Renderizar el contenido del ejercicio de refuerzo si no es un 'practice_chat'
  const renderReinforcementExerciseContent = (exercise) => {
    // Determinar la respuesta esperada para este ejercicio de refuerzo
    const expectedReinforcementAnswer =
      exercise.AnswerEN || exercise.QuestionEN;

    switch (
      exercise.type // Usar exercise.type
    ) {
      case "practice_multiple_choice":
        const options = [...(exercise.OptionsEN || []), exercise.AnswerEN].sort(
          () => Math.random() - 0.5
        );
        return (
          <>
            <p className='chat-exercise-question'>{exercise.QuestionES}</p>
            <div className='multiple-choice-options'>
              {options.map((option, idx) => (
                <button
                  key={idx}
                  className={`button multiple-choice-button 
                    ${
                      lastFeedback &&
                      normalizeText(option) ===
                        normalizeText(expectedReinforcementAnswer)
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
                      setUserTypedAnswer(option);
                      handleChatSubmit(); // Llama a la lógica de envío del chat
                    }
                  }}
                  disabled={lastFeedback !== null || appIsLoading}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        );
      case "practice_fill_in_the_blank":
        const blankPlaceholder = "_______";
        const parts = exercise.QuestionEN.split(blankPlaceholder);
        return (
          <>
            <p className='chat-exercise-question'>
              {parts[0]}
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
              {parts[1]}
            </p>
            <p className='fill-in-the-blank-translation'>
              {exercise.QuestionES}
            </p>
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
            <p className='chat-exercise-question'>{exercise.QuestionEN}</p>
            <p className='chat-translation-hint'>{exercise.QuestionES}</p>
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
            <p className='chat-exercise-question'>
              Escucha y escribe lo que oigas:
            </p>
            <p className='chat-translation-hint'>{exercise.QuestionES}</p>
            {recordedMicrophoneText && (
              <div className='recorded-text-display'>
                {recordedMicrophoneText}
              </div>
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
            Tipo de ejercicio de refuerzo no soportado: {exercise.type}
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
                <span>{msg.phraseEN || msg.QuestionEN}</span>
                {onPlayAudio && playAudioButton(msg.phraseEN || msg.QuestionEN)}
              </div>
            ) : (
              <span>{msg.phraseEN}</span>
            )}
            {msg.speaker === "ai" && (
              <p className='chat-translation'>
                {msg.phraseES || msg.QuestionES}
              </p>
            )}

            {/* Renderizar el contenido del ejercicio de refuerzo si es el turno de la IA y no es un chat interno */}
            {msg.speaker === "ai" &&
              msg.type &&
              msg.type !== "practice_chat" &&
              renderReinforcementExerciseContent(msg)}

            {/* Mostrar feedback de acierto/error para el mensaje del usuario */}
            {msg.speaker === "user" &&
              msg.id === chatMessages[chatMessages.length - 1]?.id &&
              lastFeedback === "incorrect" &&
              showCorrectAnswer && (
                <p className='chat-feedback-message incorrect'>
                  Esperado: {localExpectedAnswer}
                </p>
              )}
            {msg.speaker === "user" &&
              msg.id === chatMessages[chatMessages.length - 1]?.id &&
              lastFeedback === "correct" && (
                <p className='chat-feedback-message correct'>¡Correcto!</p>
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

      {/* Mensaje de diálogo/lección completado */}
      {dialogueCompleted && (
        <p className='info-text'>
          ¡Lección de chat completada! Haz clic en Siguiente Ejercicio para
          continuar.
        </p>
      )}
    </div>
  );
};

export default PracticeChatInterface;
