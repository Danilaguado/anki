// src/Practice/components/PracticeChatInterface.js
import React, { useState, useEffect, useRef } from "react";
import { normalizeText } from "../../utils/textUtils";
import SpeechToTextButton from "../../components/SpeechToTextButton";

const PracticeChatInterface = ({
  dialogueSequence,
  onPlayAudio,
  appIsLoading,
  userTypedAnswer,
  setUserTypedAnswer,
  matchFeedback, // Mantener para feedback visual del último intento
  setMatchFeedback,
  setAppMessage,
  setShowCorrectAnswer, // Mantener para feedback visual del último intento
  showCorrectAnswer, // Mantener para feedback visual del último intento
  recordedMicrophoneText,
  handleSpeechResultForListening,
  expectedAnswerEN, // La respuesta EN esperada para la línea actual del usuario
}) => {
  // Estado local para el progreso del diálogo
  const [currentDialogueStep, setCurrentDialogueStep] = useState(0);
  // Nuevo estado para almacenar todos los mensajes renderizados en el chat
  const [chatMessages, setChatMessages] = useState([]);
  const chatMessagesRef = useRef(null); // Para hacer scroll automático

  // Efecto para inicializar el chat y avanzar automáticamente los mensajes de la IA
  useEffect(() => {
    // Si el diálogo no ha comenzado o se ha reiniciado
    if (
      chatMessages.length === 0 &&
      dialogueSequence &&
      dialogueSequence.length > 0
    ) {
      // Encontrar el primer mensaje de la IA para iniciar el chat
      const firstAiMessage = dialogueSequence.find(
        (step) => step.speaker === "ai"
      );
      if (firstAiMessage) {
        setChatMessages([
          {
            id: `ai-${Date.now()}-0`,
            speaker: "ai",
            phraseEN: firstAiMessage.phraseEN,
            phraseES: firstAiMessage.phraseES,
          },
        ]);
        // Establecer el currentDialogueStep al índice del primer mensaje del usuario
        const firstUserStepIndex = dialogueSequence.findIndex(
          (step) => step.speaker === "user"
        );
        setCurrentDialogueStep(
          firstUserStepIndex !== -1 ? firstUserStepIndex : 0
        );
      }
    }
  }, [dialogueSequence]); // Se ejecuta al cargar el ejercicio de chat

  // Efecto para hacer scroll al final del chat y manejar las respuestas automáticas de la IA
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }

    // Lógica para que la IA responda automáticamente después de que el usuario acierte
    if (
      matchFeedback === "correct" &&
      currentDialogueStep < dialogueSequence.length
    ) {
      const nextStep = dialogueSequence[currentDialogueStep];
      if (nextStep && nextStep.speaker === "ai") {
        setTimeout(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}-${currentDialogueStep}`,
              speaker: "ai",
              phraseEN: nextStep.phraseEN,
              phraseES: nextStep.phraseES,
            },
          ]);
          setCurrentDialogueStep((prev) => prev + 1); // Avanza al siguiente paso (que debería ser el turno del usuario o fin)
          setMatchFeedback(null); // Reinicia feedback para la siguiente interacción del usuario
          setShowCorrectAnswer(false);
          setAppMessage("");
        }, 1000); // Pequeño retraso para la respuesta de la IA
      }
    }
  }, [chatMessages, currentDialogueStep, matchFeedback, dialogueSequence]); // Dependencias para re-scroll y lógica de IA

  // Manejar el envío de la respuesta del usuario en el chat
  const handleChatSubmit = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage(
        "Por favor, escribe tu respuesta para continuar el diálogo."
      );
      return;
    }

    // Añadir el mensaje del usuario al array de chatMessages
    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}-${currentDialogueStep}`,
        speaker: "user",
        phraseEN: userTypedAnswer, // La frase del usuario es lo que escribió
        expectedEN: dialogueSequence[currentDialogueStep]?.expectedEN, // Guarda la respuesta esperada para referencia
      },
    ]);

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    const normalizedExpectedAnswer = normalizeText(
      dialogueSequence[currentDialogueStep]?.expectedEN || ""
    ); // Usa la respuesta esperada del paso actual

    if (normalizedUserAnswer === normalizedExpectedAnswer) {
      setMatchFeedback("correct");
      setAppMessage("¡Correcto!");
      setShowCorrectAnswer(true);
      setUserTypedAnswer(""); // Limpia el input inmediatamente
      // La lógica de avance de la IA está en el useEffect de arriba
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
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
        setUserTypedAnswer(transcript); // Rellenar el input con la transcripción
      }}
      lang='en-US'
      disabled={appIsLoading || matchFeedback === "correct"}
    />
  );

  // Determinar si el diálogo ha terminado
  const dialogueCompleted =
    dialogueSequence && currentDialogueStep >= dialogueSequence.length;
  // Determinar si es el turno del usuario para escribir
  const isUserTurn =
    dialogueSequence &&
    dialogueSequence[currentDialogueStep]?.speaker === "user";

  return (
    <div className='chat-lesson-container'>
      <div className='chat-container' ref={chatMessagesRef}>
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.speaker}`}>
            {msg.speaker === "ai" ? (
              <div className='chat-text-with-audio'>
                <span>{msg.phraseEN}</span>
                {playAudioButton(msg.phraseEN)}
              </div>
            ) : (
              <span>{msg.phraseEN}</span> // User's spoken/typed phrase
            )}
            {msg.speaker === "ai" && (
              <p className='chat-translation'>{msg.phraseES}</p>
            )}
            {msg.speaker === "user" &&
              showCorrectAnswer &&
              matchFeedback === "incorrect" && (
                <p className='chat-translation incorrect-answer-hint'>
                  Esperado:{" "}
                  {dialogueSequence[chatMessages.indexOf(msg)]?.expectedEN ||
                    expectedAnswerEN}
                </p>
              )}
          </div>
        ))}

        {/* Mostrar el input del usuario solo si es su turno y el diálogo no ha terminado */}
        {isUserTurn && !dialogueCompleted && (
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
              disabled={appIsLoading || matchFeedback === "correct"}
            />
            {microphoneButton}
            <button
              onClick={handleChatSubmit}
              className='button primary-button chat-send-button'
              disabled={appIsLoading || matchFeedback === "correct"}
            >
              Enviar
            </button>
          </div>
        )}
      </div>

      {/* Mostrar feedback de acierto/error para la última interacción */}
      {matchFeedback && (
        <p className={`chat-feedback-message ${matchFeedback}`}>
          {matchFeedback === "correct"
            ? "¡Correcto!"
            : `Incorrecto. La respuesta esperada era: ${
                dialogueSequence[currentDialogueStep]?.expectedEN ||
                expectedAnswerEN
              }`}
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
