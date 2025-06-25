// src/App.js
import React, { useState, useEffect } from "react";
import "./index.css"; // Asegúrate de que esta línea esté presente para importar tu CSS

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
  // State para gestionar categorías y tarjetas
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State para la edición de categorías
  const [isEditingCategory, setIsEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  // State para el modal de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

  // --- Funciones CRUD (tu implementación actual) ---
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

  // Datos de la tarjeta actual
  const currentCategory = Array.isArray(categories)
    ? categories.find((cat) => cat.id === selectedCategoryId)
    : undefined;
  const currentCards = currentCategory ? currentCategory.cards || [] : [];
  const currentCard = currentCards[currentCardIndex];

  /**
   * Reproduce audio con ElevenLabs + fallback nativo
   */
  const playAudio = async (text, lang = "en-US") => {
    if (!text) {
      setMessage("No hay texto para reproducir audio.");
      return;
    }
    setIsLoading(true);
    setMessage("Generando audio...");
    try {
      const res = await fetch("/api/speech/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status} ${res.statusText}`);
      }
      const { audioContent } = await res.json();
      const blob = b64toBlob(audioContent, "audio/mpeg");
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.addEventListener("ended", () => URL.revokeObjectURL(url));
      setMessage("");
    } catch (e) {
      console.warn("Fallback native TTS:", e);
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang;
        speechSynthesis.speak(utter);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnswerVisibility = () => setIsAnswerVisible((v) => !v);
  const nextCard = () => {
    if (currentCards.length > 0) {
      setCurrentCardIndex((i) => (i + 1) % currentCards.length);
      setIsAnswerVisible(false);
    }
  };
  const prevCard = () => {
    if (currentCards.length > 0) {
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
        <div className='message-box' role='alert'>
          <span className='message-text'>{message}</span>
        </div>
      )}
      {isLoading && (
        <div className='loading-box'>
          <span className='loading-text'>Cargando o procesando...</span>
        </div>
      )}

      {/* Gestión de Categorías (idéntico a tu código) */}

      <div className='card-and-add-wrapper'>
        {currentCard ? (
          <div className='card-container'>
            <h2 className='card-title'>Tema Actual: {currentCategory.name}</h2>
            <div className='card-content-area'>
              {/* Cada letra clicable */}
              <div id='question-text' className='card-text question'>
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
              <div
                id='answer-text'
                className={`card-text answer ${
                  isAnswerVisible ? "" : "hidden"
                }`}
              >
                {currentCard.answer}
              </div>
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
              <button
                onClick={prevCard}
                className='button nav-button prev'
                disabled={isLoading}
              >
                Anterior
              </button>
              <button
                onClick={nextCard}
                className='button nav-button next'
                disabled={isLoading}
              >
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
              Selecciona una categoría o crea una nueva para empezar a estudiar.
            </p>
          </div>
        )}

        {/* Sección de Añadir Tarjetas (igual que tu código) */}
      </div>
      {/* Fin main-content-wrapper */}

      {/* Modal de eliminación, etc., igual que tu código */}
    </div>
  );
};

export default App;
