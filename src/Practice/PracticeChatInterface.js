// src/Practice/components/PracticeChatInterface.js
import React, { useState, useEffect, useRef } from "react";
import { normalizeText } from "../../utils/textUtils"; // Solo para normalizar texto
import SpeechToTextButton from "../../components/SpeechToTextButton"; // Para el botón de micrófono

const PracticeChatInterface = ({
  dialogueSequence,
  onPlayAudio,
  appIsLoading,
  userTypedAnswer,
  setUserTypedAnswer,
  matchFeedback,
  setMatchFeedback,
  handleCheckAnswer, // Se reutiliza para la verificación del input de texto
  setAppMessage,
  setShowCorrectAnswer,
  showCorrectAnswer,
  recordedMicrophoneText,
  handleSpeechResultForListening, // Se reutiliza para el STT
  expectedAnswerEN, // La respuesta EN esperada para la línea actual del usuario
}) => {
  // Estado local para el progreso del diálogo
  const [currentDialogueStep, setCurrentDialogueStep] = useState(0);
  const chatMessagesRef = useRef(null); // Para hacer scroll automático

  // Efecto para hacer scroll al final del chat
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [
    dialogueSequence,
    currentDialogueStep,
    recordedMicrophoneText,
    matchFeedback,
  ]); // Dependencias para re-scroll

  // Manejar el envío de la respuesta del usuario en el chat
  const handleChatSubmit = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage(
        "Por favor, escribe tu respuesta para continuar el diálogo."
      );
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    const normalizedExpectedAnswer = normalizeText(expectedAnswerEN || ""); // Usa la respuesta esperada del ejercicio

    if (normalizedUserAnswer === normalizedExpectedAnswer) {
      setMatchFeedback("correct");
      setAppMessage("¡Correcto! Continúa el diálogo.");
      setShowCorrectAnswer(true); // Muestra la respuesta correcta si se quiere
      setTimeout(() => {
        // Avanza al siguiente paso del diálogo (la respuesta de la IA)
        setCurrentDialogueStep((prev) => prev + 1);
        setUserTypedAnswer(""); // Limpia el input
        setMatchFeedback(null); // Reinicia feedback
        setShowCorrectAnswer(false);
        setAppMessage("");
      }, 1000); // Pequeño retraso para ver el feedback
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
    }
  };

  // Renderizar el botón de reproducción de audio para la línea actual de la IA
  const playAudioButton = (phrase) => (
    <button
      onClick={() => onPlayAudio(phrase, "en-US")}
      className='button audio-button-round primary-button small-button' // Clase para botón más pequeño
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
        // No llamar handleCheckAnswer aquí directamente, el usuario debe presionar Verificar/Enviar
      }}
      lang='en-US'
      disabled={appIsLoading || matchFeedback === "correct"}
    />
  );

  // Construir los mensajes del chat hasta el paso actual
  const renderedMessages = [];
  if (dialogueSequence) {
    for (
      let i = 0;
      i <= currentDialogueStep && i < dialogueSequence.length;
      i++
    ) {
      const step = dialogueSequence[i];
      if (step.speaker === "ai") {
        renderedMessages.push(
          <div key={`ai-${i}`} className='chat-message ai'>
            <div className='chat-text-with-audio'>
              <span>{step.phraseEN}</span>
              {playAudioButton(step.phraseEN)}
            </div>
            <p className='chat-translation'>{step.phraseES}</p>
          </div>
        );
      } else if (step.speaker === "user") {
        // Si es el paso actual del usuario, se muestra el input
        if (i === currentDialogueStep) {
          renderedMessages.push(
            <div key={`user-input-${i}`} className='chat-input-placeholder'>
              {/* Este es el marcador de posición para el input actual del usuario */}
            </div>
          );
        } else {
          // Si ya es un paso anterior del usuario (ya respondido)
          renderedMessages.push(
            <div key={`user-${i}`} className='chat-message user'>
              {step.expectedEN}{" "}
              {/* Mostrar la respuesta esperada del usuario para pasos anteriores */}
            </div>
          );
        }
      }
    }
  }

  // Determinar si el diálogo ha terminado
  const dialogueCompleted =
    dialogueSequence && currentDialogueStep >= dialogueSequence.length;

  return (
    <div className='chat-lesson-container'>
      <div className='chat-container' ref={chatMessagesRef}>
        {renderedMessages}
        {/* Mostrar el input del usuario solo si es su turno y el diálogo no ha terminado */}
        {!dialogueCompleted &&
          dialogueSequence[currentDialogueStep]?.speaker === "user" && (
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
                disabled={appIsLoading || matchFeedback === "correct"} // Deshabilitar si se está procesando o ya acertó
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
            : `Incorrecto. La respuesta esperada era: ${expectedAnswerEN}`}
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
