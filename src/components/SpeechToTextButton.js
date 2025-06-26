// src/components/SpeechToTextButton.js
import React, { useState, useRef } from "react";

const SpeechToTextButton = ({ onResult, disabled, lang = "en-US" }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert(
        "Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome u otro navegador compatible."
      );
      return;
    }

    if (disabled) return; // No iniciar si está deshabilitado por isLoading

    // Detener cualquier escucha previa si existe
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current.onend = null; // Prevenir que onend se dispare accidentalmente
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang; // Usar el idioma pasado por prop
    recognition.interimResults = false; // Solo resultados finales
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript); // Pasa el resultado al componente padre
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento de voz:", event.error);
      if (event.error === "not-allowed") {
        alert(
          "Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración de tu navegador."
        );
      } else if (event.error === "no-speech") {
        onResult("No se detectó voz.");
      } else {
        onResult(`Error de reconocimiento: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null; // Limpiar referencia
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return (
    <button
      onMouseDown={startListening}
      onMouseUp={stopListening}
      onTouchStart={startListening}
      onTouchEnd={stopListening}
      className={`speech-to-text-button ${isListening ? "listening" : ""}`}
      disabled={disabled}
      aria-label='Iniciar/Detener reconocimiento de voz'
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='currentColor'
        viewBox='0 0 16 16'
      >
        <path d='M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z' />
        <path d='M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5' />
      </svg>
    </button>
  );
};

export default SpeechToTextButton;
