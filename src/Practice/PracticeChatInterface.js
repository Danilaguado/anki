// src/Practice/components/PracticeChatInterface.js
import React, { useState, useEffect, useRef } from "react";
import { normalizeText } from "../utils/textUtils";
import SpeechToTextButton from "../components/SpeechToTextButton";

const PracticeChatInterface = ({
  dialogueSequence, // Secuencia completa del diálogo
  onPlayAudio,
  appIsLoading,
  userTypedAnswer,
  setUserTypedAnswer,
  // matchFeedback, // Ya no se pasa directamente para controlar la UI principal
  // setMatchFeedback, // Ya no se pasa directamente para controlar la UI principal
  setAppMessage, // Para mensajes globales de la app
  // setShowCorrectAnswer, // Ya no se usa para controlar la visibilidad principal
  // showCorrectAnswer, // Ya no se usa para controlar la visibilidad principal
  recordedMicrophoneText,
  handleSpeechResultForListening,
  expectedAnswerEN: initialExpectedAnswerEN, // La respuesta esperada para el primer turno del usuario
}) => {
  // Estado local para el progreso del diálogo (índice actual en dialogueSequence)
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  // Estado para almacenar todos los mensajes que ya se han mostrado en el chat
  const [chatMessages, setChatMessages] = useState([]);
  // Estado para el feedback de la última respuesta del usuario (local al chat)
  const [lastFeedback, setLastFeedback] = useState(null); // 'correct', 'incorrect'
  const [lastExpectedAnswer, setLastExpectedAnswer] = useState(""); // Para mostrar la respuesta si falla

  const chatMessagesRef = useRef(null); // Para hacer scroll automático

  // Efecto para inicializar el chat y avanzar automáticamente los mensajes de la IA
  useEffect(() => {
    // Resetear el chat cuando cambie el dialogueSequence (nuevo ejercicio)
    setChatMessages([]);
    setCurrentDialogueStep(0);
    setLastFeedback(null);
    setLastExpectedAnswer("");
    setUserTypedAnswer("");
    setAppMessage("");

    if (dialogueSequence && dialogueSequence.length > 0) {
      // Iniciar el chat con el primer mensaje de la IA si es su turno
      const firstStep = dialogueSequence[0];
      if (firstStep && firstStep.speaker === "ai") {
        setChatMessages([
          {
            id: `ai-${Date.now()}-0`,
            speaker: "ai",
            phraseEN: firstStep.phraseEN,
            phraseES: firstStep.phraseES,
          },
        ]);
        setCurrentDialogueStep(1); // Avanzar al siguiente paso (que debería ser el turno del usuario)
      } else if (firstStep && firstStep.speaker === "user") {
        // Si el primer paso es del usuario, no añadimos nada, esperamos su input
        setCurrentDialogueStep(0);
      }
    }
  }, [dialogueSequence]); // Se ejecuta al cargar un nuevo ejercicio de chat

  // Efecto para hacer scroll al final del chat y manejar las respuestas automáticas de la IA
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }

    // Lógica para que la IA responda automáticamente después de que el usuario acierte
    // y para que el chat avance si el siguiente paso es de la IA.
    if (dialogueSequence && currentDialogueStep < dialogueSequence.length) {
      const currentStepData = dialogueSequence[currentDialogueStep];

      if (currentStepData.speaker === "ai") {
        // Si es el turno de la IA, añadimos su mensaje y avanzamos
        setTimeout(() => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}-${currentDialogueStep}`,
              speaker: "ai",
              phraseEN: currentStepData.phraseEN,
              phraseES: currentStepData.phraseES,
            },
          ]);
          setCurrentDialogueStep((prev) => prev + 1); // Avanza al siguiente paso
          setLastFeedback(null); // Reinicia feedback visual
          setLastExpectedAnswer(""); // Limpia la respuesta esperada anterior
          setAppMessage("");
        }, 1000); // Pequeño retraso para la respuesta de la IA
      }
    }
  }, [chatMessages, currentDialogueStep, dialogueSequence]); // Dependencias para re-scroll y lógica de IA

  // Manejar el envío de la respuesta del usuario en el chat
  const handleChatSubmit = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage(
        "Por favor, escribe tu respuesta para continuar el diálogo."
      );
      return;
    }

    const currentExpectedStep = dialogueSequence[currentDialogueStep];
    if (!currentExpectedStep || currentExpectedStep.speaker !== "user") {
      setAppMessage("No es tu turno de responder o el diálogo ha terminado.");
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    const normalizedExpectedAnswer = normalizeText(
      currentExpectedStep.expectedEN || ""
    );

    // Añadir el mensaje del usuario al array de chatMessages ANTES de la verificación
    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}-${currentDialogueStep}`,
        speaker: "user",
        phraseEN: userTypedAnswer, // La frase del usuario es lo que escribió
        expectedEN: currentExpectedStep.expectedEN, // Guarda la respuesta esperada para referencia
      },
    ]);

    if (normalizedUserAnswer === normalizedExpectedAnswer) {
      setLastFeedback("correct");
      setAppMessage("¡Correcto!");
      setLastExpectedAnswer(""); // Limpiar si fue correcto
      setUserTypedAnswer(""); // Limpia el input
      setCurrentDialogueStep((prev) => prev + 1); // Avanza al siguiente paso (IA o fin)
    } else {
      setLastFeedback("incorrect");
      setLastExpectedAnswer(currentExpectedStep.expectedEN); // Guarda la respuesta correcta para mostrar
      setAppMessage("Incorrecto. Intenta de nuevo.");
      // No avanzamos el currentDialogueStep si es incorrecto, para que el usuario pueda reintentar
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
      disabled={appIsLoading || (lastFeedback === "correct" && isUserTurn)} // Deshabilitar si se está procesando o si ya acertó y es su turno
    />
  );

  // Determinar si el diálogo ha terminado (no hay más pasos)
  const dialogueCompleted =
    dialogueSequence && currentDialogueStep >= dialogueSequence.length;
  // Determinar si el turno actual es del usuario
  const isUserTurnCurrent =
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
              // Mensaje del usuario: mostrar lo que escribió. Si falló, mostrar el esperado.
              <span>
                {msg.phraseEN}
                {msg.speaker === "user" &&
                  msg.id === chatMessages[chatMessages.length - 1]?.id &&
                  lastFeedback === "incorrect" && (
                    <p className='chat-translation incorrect-answer-hint'>
                      Esperado: {msg.expectedEN}
                    </p>
                  )}
              </span>
            )}
            {msg.speaker === "ai" && (
              <p className='chat-translation'>{msg.phraseES}</p>
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
            } // Deshabilitar si se está procesando o ya acertó
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
          Incorrecto. La respuesta esperada era: {lastExpectedAnswer}
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
