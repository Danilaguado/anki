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
  const [message, setMessage] = useState(""); // Para feedback al usuario
  const [isLoading, setIsLoading] = useState(false); // Indica carga/procesamiento

  // State para la edición de categorías
  const [isEditingCategory, setIsEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  // State para el modal de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

  // --- Función para cargar datos desde la API ---
  const fetchCategories = async () => {
    setIsLoading(true);
    setMessage("Cargando datos...");
    try {
      const response = await fetch("/api/categories/get-all");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Formato inesperado de datos");
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId((prev) =>
          data.some((c) => c.id === prev) ? prev : data[0].id
        );
      } else {
        setSelectedCategoryId(null);
      }
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(`Error al cargar categorías: ${error.message}`);
      setCategories([]);
      setSelectedCategoryId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- CRUD para categorías y tarjetas ---
  const addCategory = async () => {
    /* tu código original */
  };
  const saveEditedCategory = async () => {
    /* tu código original */
  };
  const confirmDeleteCategory = (id) => {
    /* tu código original */
  };
  const deleteCategory = async () => {
    /* tu código original */
  };
  const addCardManually = async () => {
    /* tu código original */
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
        <div className='message-box'>
          <span className='message-text'>{message}</span>
        </div>
      )}
      {isLoading && (
        <div className='loading-box'>
          <span className='loading-text'>Cargando o procesando...</span>
        </div>
      )}

      {/* Gestión de Categorías */}
      <div className='section-container'>
        <h2 className='section-title'>Gestionar Categorías</h2>
        {/* ... tu UI original para categorías aquí ... */}
      </div>

      {/* Tarjeta y Añadir */}
      <div className='card-and-add-wrapper'>
        {selectedCategoryId && currentCategory ? (
          <div className='card-container'>
            <h2 className='card-title'>Tema Actual: {currentCategory.name}</h2>
            {currentCards.length > 0 ? (
              <>
                <div className='card-content-area'>
                  <div id='question-text' className='card-text question'>
                    {currentCard.question.split(" ").map((word, idx) => (
                      <span
                        key={idx}
                        className='word'
                        onClick={() =>
                          playAudio(word, currentCard.langQuestion)
                        }
                        style={{ cursor: "pointer", margin: "0 4px" }}
                      >
                        {word}
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
                  {isAnswerVisible
                    ? "Ocultar Traducción"
                    : "Mostrar Traducción"}
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
              </>
            ) : (
              <p className='info-text'>No hay tarjetas en esta categoría.</p>
            )}
          </div>
        ) : (
          <div className='card-container placeholder'>
            <p className='info-text'>
              Selecciona o crea una categoría para empezar a estudiar.
            </p>
          </div>
        )}

        {selectedCategoryId && (
          <div className='section-container'>
            <h2 className='section-title'>
              Añadir Tarjetas a "{currentCategory.name}"
            </h2>
            {/* ... tu UI original para añadir tarjetas ... */}
          </div>
        )}
      </div>

      {/* Modal de eliminar */}
      {showDeleteConfirm && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <p className='modal-title'>
              ¿Estás seguro que quieres eliminar esta categoría?
            </p>
            <div className='modal-buttons'>
              <button
                onClick={deleteCategory}
                className='button modal-delete-button'
                disabled={isLoading}
              >
                Sí, Eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className='button modal-cancel-button'
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
