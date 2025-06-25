// src/App.js
import React, { useState, useEffect } from "react";
import "./index.css";

// Convierte Base64 a Blob
function b64toBlob(b64Data, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
}

const App = () => {
  // Estados
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Edición y eliminación
  const [isEditingCategory, setIsEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

  // --- Funciones CRUD (usa tu implementación existente) ---
  const fetchCategories = async () => {
    /* ... */
  };
  const addCategory = async () => {
    /* ... */
  };
  const saveEditedCategory = async () => {
    /* ... */
  };
  const confirmDeleteCategory = (id) => {
    /* ... */
  };
  const deleteCategory = async () => {
    /* ... */
  };
  const addCardManually = async () => {
    /* ... */
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsAnswerVisible(false);
  }, [selectedCategoryId]);

  const currentCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );
  const currentCards = currentCategory?.cards || [];
  const currentCard = currentCards[currentCardIndex];

  // Reproduce audio con ElevenLabs + fallback nativo
  const playAudio = async (text, lang = "en-US") => {
    if (!text) return;
    setIsLoading(true);
    setMessage("Generando audio...");
    try {
      const res = await fetch("/api/speech/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      const { audioContent } = await res.json();
      const blob = b64toBlob(audioContent, "audio/mpeg");
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
      setMessage("");
    } catch (e) {
      console.warn("Fallback native TTS:", e);
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        speechSynthesis.speak(u);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnswerVisibility = () => setIsAnswerVisible((v) => !v);
  const nextCard = () => {
    if (currentCards.length) {
      setCurrentCardIndex((i) => (i + 1) % currentCards.length);
      setIsAnswerVisible(false);
    }
  };
  const prevCard = () => {
    if (currentCards.length) {
      setCurrentCardIndex(
        (i) => (i - 1 + currentCards.length) % currentCards.length
      );
      setIsAnswerVisible(false);
    }
  };

  return (
    <div className='app-container'>
      <h1 className='app-title'>Mi Entrenador de Vocabulario</h1>
      {message && (
        <div className='message-box'>
          <span>{message}</span>
        </div>
      )}
      {isLoading && (
        <div className='loading-box'>
          <span>Cargando...</span>
        </div>
      )}

      {/* Gestión de categorías omitida para brevedad */}

      {currentCard ? (
        <div className='card-container'>
          <h2 className='card-title'>Tema Actual: {currentCategory.name}</h2>
          <div className='card-content-area'>
            {/* Mapa de letras con onClick */}
            <div className='card-text question'>
              {currentCard.question.split("").map((ch, idx) => (
                <span
                  key={idx}
                  className='letter'
                  onClick={() => playAudio(ch, currentCard.langQuestion)}
                  style={{ cursor: "pointer", padding: "0 2px" }}
                >
                  {ch}
                </span>
              ))}
            </div>

            {isAnswerVisible && (
              <div className='card-text answer'>{currentCard.answer}</div>
            )}
          </div>

          {/* Botón único Reproducir */}
          <div className='audio-buttons-group'>
            <button
              onClick={() =>
                playAudio(currentCard.question, currentCard.langQuestion)
              }
              className='button primary-button'
              disabled={isLoading}
            >
              Reproducir
            </button>
          </div>

          <button
            onClick={toggleAnswerVisibility}
            className='button toggle-answer-button'
            disabled={isLoading}
          >
            {isAnswerVisible ? "Ocultar Traducción" : "Mostrar Traducción"}
          </button>

          <div className='navigation-buttons-group'>
            <button onClick={prevCard} disabled={isLoading} className='button'>
              Anterior
            </button>
            <button onClick={nextCard} disabled={isLoading} className='button'>
              Siguiente
            </button>
          </div>

          <div className='card-counter'>
            Tarjeta {currentCardIndex + 1} de {currentCards.length}
          </div>
        </div>
      ) : (
        <div className='card-container placeholder'>
          <p className='info-text'>
            Selecciona o crea una categoría para empezar.
          </p>
        </div>
      )}

      {/* Resto de UI para añadir tarjetas y categorías aquí... */}
    </div>
  );
};

export default App;
