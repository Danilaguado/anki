// src/components/SpeechToTextButton.js
// Contenido original, asegúrate de que sea este mismo archivo.
import React, { useState, useEffect } from "react";

// Web Speech API
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

// Configuración de reconocimiento
if (recognition) {
  recognition.interimResults = false; // Solo resultados finales
  recognition.continuous = false; // Un solo reconocimiento por botón
  // recognition.maxAlternatives = 1; // La alternativa más probable
}

const SpeechToTextButton = ({ onResult, lang = "en-US", disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!recognition) {
      setError(
        "La API de reconocimiento de voz no está disponible en este navegador."
      );
      return;
    }

    recognition.lang = lang; // Establece el idioma dinámicamente

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      onResult(transcript);
      setIsRecording(false);
      setError(null);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      if (event.error === "not-allowed") {
        setError(
          "Acceso al micrófono denegado. Por favor, permite el acceso en la configuración del navegador."
        );
      } else if (event.error === "no-speech") {
        setError("No se detectó voz. Por favor, inténtalo de nuevo.");
      } else {
        setError(`Error de reconocimiento de voz: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      // Si onend se llama sin un resultado o error previo, significa que se detuvo manualmente
      // o no se detectó suficiente voz para un resultado.
      if (isRecording) {
        // Si el estado sigue siendo grabando, significa que no hubo onresult/onerror
        setIsRecording(false);
      }
    };

    return () => {
      recognition.stop();
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, [lang, onResult, isRecording]); // Dependencia de isRecording para manejar onend

  const toggleRecording = () => {
    if (!recognition) {
      setError("La API de reconocimiento de voz no está disponible.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setError(null); // Limpiar errores previos
      try {
        recognition.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Error al iniciar el reconocimiento:", e);
        setError(
          "Error al iniciar el reconocimiento de voz. Inténtalo de nuevo."
        );
        setIsRecording(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={toggleRecording}
        className={`speech-to-text-button button ${
          isRecording ? "recording" : ""
        }`}
        disabled={disabled || !recognition}
        aria-label={
          isRecording ? "Detener grabación de voz" : "Iniciar grabación de voz"
        }
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='100%'
          height='100%'
          fill='currentColor'
          viewBox='0 0 16 16'
        >
          {isRecording ? (
            <path d='M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z' />
          ) : (
            <path d='M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5' />
          )}
        </svg>
      </button>
      {error && <p className='error-text'>{error}</p>}
    </>
  );
};

export default SpeechToTextButton;
