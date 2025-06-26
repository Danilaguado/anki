// src/utils/textUtils.js
import React from "react";

/**
 * Normaliza un texto para la comparación (quita puntuación, convierte a minúsculas, elimina apóstrofes, normaliza espacios).
 * @param {string} text - El texto a normalizar.
 * @returns {string} El texto normalizado.
 */
export const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase() // Convertir a minúsculas
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?¿!¡'"´`]/g, "") // Quitar puntuación y apóstrofes
    .replace(/\s{2,}/g, " ") // Reemplazar múltiples espacios con uno solo
    .trim(); // Eliminar espacios al inicio/final
};

/**
 * Renderiza un texto como una serie de palabras clicables.
 * @param {string} text - El texto a renderizar.
 * @param {string} lang - El código de idioma para la reproducción de audio.
 * @param {boolean} isClickable - Si el texto debe ser clicable para reproducir audio.
 * @param {function} playAudioFunction - La función playAudio que se pasará como prop.
 * @returns {JSX.Element[]} Un array de elementos <span> para cada palabra o texto plano.
 */
export const renderClickableText = (
  text,
  lang,
  isClickable = true,
  playAudioFunction
) => {
  if (!text) return null;
  if (!isClickable) {
    return <span>{text}</span>;
  }
  const parts = text.match(/(\w+|[^\w\s]+|\s+)/g) || [];

  return parts.map((part, index) => {
    if (part.trim() === "" || !/\w/.test(part)) {
      return <span key={index}>{part}</span>;
    }
    return (
      <span
        key={index}
        onClick={() => playAudioFunction(part.trim(), lang)}
        className='clickable-word'
        aria-label={`Reproducir ${part.trim()}`}
      >
        {part}
      </span>
    );
  });
};
