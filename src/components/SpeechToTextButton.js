// ===== /src/components/SpeechToTextButton.js =====
// Componente para el botón de reconocimiento de voz.

import React, { useState, useEffect, useRef } from "react";

const MicIcon = ({ isListening }) => (
  <svg
    className={`mic-icon ${isListening ? "listening" : ""}`}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' />
    <path d='M19 10v2a7 7 0 0 1-14 0v-2h2v2a5 5 0 0 0 10 0v-2z' />
    <path d='M12 19a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1z' />
  </svg>
);

const SpeechToTextButton = ({ onResult, lang = "en-US" }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [lang, onResult]);

  const handleToggleListen = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!recognitionRef.current) {
    return null; // No renderizar el botón si la API no es compatible
  }

  return (
    <button
      onClick={handleToggleListen}
      className='button-speech'
      aria-label='Grabar voz'
    >
      <MicIcon isListening={isListening} />
    </button>
  );
};

export default SpeechToTextButton;
