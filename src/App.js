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

  // --- Función para cargar datos desde las API de Vercel ---
  const fetchCategories = async () => {
    setIsLoading(true);
    setMessage("Cargando datos...");
    try {
      const url = "/api/categories/get-all";
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP: ${response.status}. ${errorText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Formato inesperado de datos");
      setCategories(data);
      // Mantener o seleccionar la primera categoría
      if (data.length > 0) {
        setSelectedCategoryId((prev) =>
          prev && data.some((c) => c.id === prev) ? prev : data[0].id
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

  // --- Otras funciones CRUD ---
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    setMessage("Creando categoría...");
    try {
      const res = await fetch("/api/categories/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setNewCategoryName("");
      await fetchCategories();
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(`Error al crear categoría: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEditedCategory = async () => {
    if (!editedCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    setMessage("Actualizando categoría...");
    try {
      const res = await fetch("/api/categories/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isEditingCategory,
          name: editedCategoryName.trim(),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setIsEditingCategory(null);
      setEditedCategoryName("");
      await fetchCategories();
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(`Error al actualizar categoría: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteCategory = (id) => {
    setCategoryToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const deleteCategory = async () => {
    if (!categoryToDeleteId) return;
    setIsLoading(true);
    setMessage("Eliminando categoría...");
    try {
      const res = await fetch(
        `/api/categories/delete?id=${categoryToDeleteId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setShowDeleteConfirm(false);
      setCategoryToDeleteId(null);
      await fetchCategories();
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(`Error al eliminar categoría: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addCardManually = async () => {
    if (!selectedCategoryId) {
      setMessage("Por favor, selecciona una categoría primero.");
      return;
    }
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) {
      setMessage("La pregunta y la respuesta no pueden estar vacías.");
      return;
    }
    setIsLoading(true);
    setMessage("Añadiendo tarjeta...");
    try {
      const res = await fetch("/api/cards/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          question: newCardQuestion.trim(),
          answer: newCardAnswer.trim(),
          langQuestion: "en-US",
          langAnswer: "es-ES",
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setNewCardQuestion("");
      setNewCardAnswer("");
      await fetchCategories();
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(`Error al añadir tarjeta: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Hooks de carga/inicialización ---
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

      {/* ---------------- Gestionar Categorías ---------------- */}
      <div className='section-container'>
        <h2 className='section-title'>Gestionar Categorías</h2>
        <div className='input-group'>
          <input
            type='text'
            className='input-field'
            placeholder='Nombre de la nueva categoría'
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={addCategory}
            className='button primary-button'
            disabled={isLoading}
          >
            Crear Categoría
          </button>
        </div>

        <h3 className='subsection-title'>Tus Categorías:</h3>
        {categories.length === 0 ? (
          <p className='info-text'>No hay categorías. Crea una para empezar.</p>
        ) : (
          <div className='categories-grid'>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`category-item ${
                  selectedCategoryId === cat.id ? "selected" : ""
                }`}
              >
                {isEditingCategory === cat.id ? (
                  <div className='edit-category-form'>
                    <input
                      type='text'
                      className='input-field edit-input'
                      value={editedCategoryName}
                      onChange={(e) => setEditedCategoryName(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className='edit-buttons'>
                      <button
                        onClick={saveEditedCategory}
                        className='button save-button'
                        disabled={isLoading}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setIsEditingCategory(null)}
                        className='button cancel-button'
                        disabled={isLoading}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className='category-button'
                      disabled={isLoading}
                    >
                      {cat.name} ({cat.cards ? cat.cards.length : 0} tarjetas)
                    </button>
                    <div className='category-actions'>
                      <button
                        onClick={() => {
                          setIsEditingCategory(cat.id);
                          setEditedCategoryName(cat.name);
                        }}
                        className='button edit-button'
                        disabled={isLoading}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => confirmDeleteCategory(cat.id)}
                        className='button delete-button'
                        disabled={isLoading}
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- Tarjeta y Añadir ---------------- */}
      <div className='card-and-add-wrapper'>
        {selectedCategoryId && currentCategory ? (
          <div className='card-container'>
            <h2 className='card-title'>Tema Actual: {currentCategory.name}</h2>
            {currentCards.length > 0 ? (
              <>
                <div className='card-content-area'>
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
              Selecciona una categoría o crea una nueva para empezar a estudiar.
            </p>
          </div>
        )}

        {selectedCategoryId && (
          <div className='section-container'>
            <h2 className='section-title'>
              Añadir Tarjetas a "{currentCategory.name}"
            </h2>
            <div className='input-group-vertical'>
              <input
                type='text'
                className='input-field'
                placeholder='Pregunta (Inglés)'
                value={newCardQuestion}
                onChange={(e) => setNewCardQuestion(e.target.value)}
                disabled={isLoading}
              />
              <input
                type='text'
                className='input-field'
                placeholder='Respuesta (Español)'
                value={newCardAnswer}
                onChange={(e) => setNewCardAnswer(e.target.value)}
                disabled={isLoading}
              />
              <button
                onClick={addCardManually}
                className='button add-card-button'
                disabled={isLoading}
              >
                Añadir Tarjeta Manualmente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- Modal de Eliminar ---------------- */}
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
