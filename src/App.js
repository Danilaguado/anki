// src/App.js
import React, { useState, useEffect } from "react";
import "./index.css"; // Asegúrate de que esta línea esté presente para importar tu CSS

// Main App Component
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
  const [isLoading, setIsLoading] = useState(false); // Estado para indicar carga/procesamiento de cualquier operación

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
      console.log("Intentando fetch GET de:", url);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta: ${errorText.substring(0, 200)}...`
        );
      }

      let data = await response.json();

      if (data && typeof data === "object" && data.error) {
        throw new Error(data.error);
      }
      if (!Array.isArray(data)) {
        console.error("La API no devolvió un array como se esperaba:", data);
        data = []; // Tratar como array vacío si el formato no es el esperado
        setMessage(
          "Advertencia: Formato de datos inesperado, mostrando categorías vacías."
        );
      }

      setCategories(data);

      const prevSelectedId = selectedCategoryId;
      if (prevSelectedId && data.some((cat) => cat.id === prevSelectedId)) {
        setSelectedCategoryId(prevSelectedId);
      } else if (data.length > 0) {
        setSelectedCategoryId(data[0].id);
      } else {
        setSelectedCategoryId(null);
      }

      setMessage("Datos cargados exitosamente.");
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      setMessage(`Error al cargar datos: ${error.message}.`);
      setCategories([]);
      setSelectedCategoryId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Cargar datos al iniciar y cuando sea necesario ---
  useEffect(() => {
    fetchCategories();
  }, []);

  // Reinicia el índice de la tarjeta y la visibilidad de la respuesta cuando cambia la categoría seleccionada
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsAnswerVisible(false);
  }, [selectedCategoryId]);

  // Obtiene los datos de la categoría actual
  const currentCategory = Array.isArray(categories)
    ? categories.find((cat) => cat.id === selectedCategoryId)
    : undefined;
  const currentCards = currentCategory ? currentCategory.cards || [] : [];
  const currentCard = currentCards[currentCardIndex];

  /**
   * Reproduce audio para un texto dado en un idioma específico usando ElevenLabs.
   * @param {string} text - El texto a reproducir.
   * @param {string} lang - El código de idioma (ej. 'en-US' para inglés, 'es-ES' para español).
   */
  const playAudio = async (text, lang) => {
    // 'rate' ya no se usa directamente aquí
    if (!text) {
      setMessage("No hay texto para reproducir audio.");
      return;
    }

    // Un nuevo estado local para solo controlar la reproducción de audio si es necesario,
    // o simplemente usar isLoading para simplificar si no hay solapamiento.
    // Por ahora, usaremos isLoading para deshabilitar los botones mientras se carga/reproduce.
    setIsLoading(true);
    setMessage("Generando audio con ElevenLabs...");

    try {
      const response = await fetch("/api/speech/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          lang: lang,
          // rate: rate // Ya no se envía 'rate' directamente, ElevenLabs usa estabilidad/claridad
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Error HTTP: ${response.status} - ${response.statusText}`
        );
      }

      const { audioContent } = await response.json();
      if (audioContent) {
        // Construye un Blob desde el Base64 y crea un URL de objeto
        const audioBlob = b64toBlob(audioContent, "audio/mpeg");
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audio.play();

        // Libera el Blob URL cuando el audio termine de reproducirse
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setMessage(""); // Limpia el mensaje al terminar
          setIsLoading(false); // Habilita los botones de nuevo
        };
        audio.onerror = (e) => {
          console.error("Error al reproducir audio:", e);
          setMessage("Error al reproducir el audio.");
          URL.revokeObjectURL(audioUrl);
          setIsLoading(false); // Habilita los botones de nuevo
        };
        setMessage("Reproduciendo...");
      } else {
        throw new Error("No se recibió contenido de audio de ElevenLabs.");
      }
    } catch (error) {
      console.error("Error al reproducir audio con ElevenLabs TTS:", error);
      setMessage(`No se pudo generar voz: ${error.message}.`);
      setIsLoading(false); // Asegúrate de restablecer isLoading en caso de error
    }
  };

  /**
   * Convierte un Base64 string en un Blob
   */
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

  /**
   * Renderiza un texto como una serie de palabras clicables.
   * @param {string} text - El texto a renderizar.
   * @param {string} lang - El código de idioma para la reproducción de audio.
   * @returns {JSX.Element[]} Un array de elementos <span> para cada palabra.
   */
  const renderClickableText = (text, lang) => {
    if (!text) return null;
    // Dividir el texto por espacios, mantener los delimitadores (espacios, puntuación)
    // Usamos una expresión regular para capturar palabras y separadores
    const parts = text.match(/(\w+|[^\w\s]+|\s+)/g) || [];

    return parts.map((part, index) => {
      // Si la parte es solo espacio o puntuación, no la hacemos clicable
      if (part.trim() === "" || !/\w/.test(part)) {
        // Si no contiene caracteres de palabra
        return <span key={index}>{part}</span>;
      }
      return (
        <span
          key={index}
          onClick={() => playAudio(part.trim(), lang)}
          className='clickable-word'
          aria-label={`Reproducir ${part.trim()}`}
        >
          {part}
        </span>
      );
    });
  };

  /**
   * Alterna la visibilidad de la respuesta en la tarjeta actual.
   */
  const toggleAnswerVisibility = () => {
    setIsAnswerVisible(!isAnswerVisible);
  };

  /**
   * Avanza a la siguiente tarjeta en la categoría actual.
   */
  const nextCard = () => {
    if (currentCards.length > 0) {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % currentCards.length);
      setIsAnswerVisible(false);
    }
  };

  /**
   * Retrocede a la tarjeta anterior en la categoría actual.
   */
  const prevCard = () => {
    if (currentCards.length > 0) {
      setCurrentCardIndex(
        (prevIndex) =>
          (prevIndex - 1 + currentCards.length) % currentCards.length
      );
      setIsAnswerVisible(false);
    }
  };

  /**
   * Añade una nueva categoría llamando a la API de Vercel.
   */
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    setMessage("Creando categoría...");
    try {
      const url = "/api/categories/add"; // Ruta de la API de Vercel
      console.log("Intentando fetch POST (addCategory) a:", url);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setNewCategoryName("");
        setMessage(`Categoría "${newCategoryName}" creada.`);
        await fetchCategories();
      } else {
        throw new Error(
          result.error || "Error desconocido al añadir categoría."
        );
      }
    } catch (error) {
      console.error("Error al añadir categoría:", error);
      setMessage(`Error al crear la categoría: ${error.message}.`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Añade una nueva tarjeta a la categoría seleccionada llamando a la API de Vercel.
   */
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
      const url = "/api/cards/add"; // Ruta de la API de Vercel
      const response = await fetch(url, {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setNewCardQuestion("");
        setNewCardAnswer("");
        setMessage("Tarjeta añadida manualmente.");
        await fetchCategories();
      } else {
        throw new Error(result.error || "Error desconocido al añadir tarjeta.");
      }
    } catch (error) {
      console.error("Error al añadir tarjeta manualmente:", error);
      setMessage(`Error al añadir la tarjeta: ${error.message}.`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicia el proceso de edición para una categoría.
   * @param {object} category - El objeto de la categoría a editar.
   */
  const startEditCategory = (category) => {
    setIsEditingCategory(category.id);
    setEditedCategoryName(category.name);
  };

  /**
   * Guarda el nombre editado de la categoría llamando a la API de Vercel.
   */
  const saveEditedCategory = async () => {
    if (!editedCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    setMessage("Actualizando categoría...");
    try {
      const url = "/api/categories/update";
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isEditingCategory,
          name: editedCategoryName.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setMessage(`Categoría "${editedCategoryName}" actualizada.`);
        setIsEditingCategory(null);
        setEditedCategoryName("");
        await fetchCategories();
      } else {
        throw new Error(
          result.error || "Error desconocido al actualizar categoría."
        );
      }
    } catch (error) {
      console.error("Error al guardar categoría editada:", error);
      setMessage(`Error al actualizar la categoría: ${error.message}.`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancela el proceso de edición de la categoría.
   */
  const cancelEditCategory = () => {
    setIsEditingCategory(null);
    setEditedCategoryName("");
  };

  /**
   * Muestra el modal de confirmación de eliminación.
   * @param {string} categoryId - El ID de la categoría a eliminar.
   */
  const confirmDeleteCategory = (categoryId) => {
    setCategoryToDeleteId(categoryId);
    setShowDeleteConfirm(true);
  };

  /**
   * Realiza la eliminación de una categoría llamando a la API de Vercel.
   */
  const deleteCategory = async () => {
    if (!categoryToDeleteId) return;
    setIsLoading(true);
    setMessage("Eliminando categoría...");
    try {
      const url = `/api/categories/delete?id=${categoryToDeleteId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setMessage(`Categoría eliminada.`);
        setShowDeleteConfirm(false);
        setCategoryToDeleteId(null);
        await fetchCategories();
      } else {
        throw new Error(
          result.error || "Error desconocido al eliminar categoría."
        );
      }
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      setMessage(`Error al eliminar la categoría: ${error.message}.`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancela la operación de eliminación.
   */
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setCategoryToDeleteId(null);
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

      <div className='main-content-wrapper'>
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
            <p className='info-text'>
              No hay categorías. Crea una para empezar.
            </p>
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
                          onClick={cancelEditCategory}
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
                          onClick={() => startEditCategory(cat)}
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

        <div className='card-and-add-wrapper'>
          {selectedCategoryId && currentCategory ? (
            <div className='card-container'>
              <h2 className='card-title'>
                Tema Actual: {currentCategory.name}
              </h2>
              {currentCards.length > 0 ? (
                <>
                  <div className='card-content-area'>
                    <div id='question-text' className='card-text question'>
                      {renderClickableText(
                        currentCard.question,
                        currentCard.langQuestion || "en-US"
                      )}
                    </div>
                    <div
                      id='answer-text'
                      className={`card-text answer ${
                        isAnswerVisible ? "" : "hidden"
                      }`}
                    >
                      {renderClickableText(
                        currentCard.answer,
                        currentCard.langAnswer || "es-ES"
                      )}
                    </div>
                  </div>

                  {/* Único botón de Reproducir para toda la pregunta */}
                  <button
                    onClick={() =>
                      playAudio(
                        currentCard.question,
                        currentCard.langQuestion || "en-US"
                      )
                    }
                    className='button audio-button full-card'
                    disabled={isLoading}
                  >
                    Reproducir Tarjeta
                  </button>

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
                    Tarjeta {currentCards.length > 0 ? currentCardIndex + 1 : 0}{" "}
                    de {currentCards.length}
                  </div>
                </>
              ) : (
                <p className='info-text'>
                  No hay tarjetas en esta categoría. Añade algunas manualmente.
                </p>
              )}
            </div>
          ) : (
            <div className='card-container placeholder'>
              <p className='info-text'>
                Selecciona una categoría o crea una nueva para empezar a
                estudiar.
              </p>
            </div>
          )}

          {selectedCategoryId && (
            <div className='section-container'>
              <h2 className='section-title'>
                Añadir Tarjetas a "{currentCategory?.name || "..."}"
              </h2>

              <h3 className='subsection-title'>Añadir Manualmente:</h3>
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
      </div>

      {showDeleteConfirm && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <p className='modal-title'>
              ¿Estás seguro que quieres eliminar esta categoría?
            </p>
            <p className='modal-text'>
              Esta acción no se puede deshacer y la categoría se perderá.
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
                onClick={cancelDelete}
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
