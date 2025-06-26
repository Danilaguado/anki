// src/App.js
import React, { useState, useEffect } from "react";
import "./index.css";
import SpeechToTextButton from "./components/SpeechToTextButton"; // Importar el nuevo componente STT

// Main App Component
const App = () => {
  // State para gestionar categorías y tarjetas
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCardQuestion, setNewCardQuestion] = useState("");
  // CORRECCIÓN: Inicialización correcta de useState
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [message, setMessage] = useState(""); // Para feedback al usuario
  const [isLoading, setIsLoading] = useState(false); // Estado para indicar carga/procesamiento de cualquier operación

  // State para la edición de categorías
  // CORRECCIÓN: Inicialización correcta de useState
  const [isEditingCategory, setIsEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  // State para el modal de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

  // Nuevo estado para la navegación de páginas
  const [currentPage, setCurrentPage] = useState("home"); // 'home', 'addCardPage', 'practicePage'

  // Nuevo estado para el texto grabado del STT
  const [recordedText, setRecordedText] = useState("");

  // Nuevo estado para el feedback de coincidencia de pronunciación
  const [matchFeedback, setMatchFeedback] = useState(null); // null, 'correct', 'incorrect'

  // --- Funciones de Navegación ---
  const navigateToHome = () => {
    setCurrentPage("home");
    setRecordedText(""); // Limpiar texto grabado al volver a la home
    setMatchFeedback(null); // Limpiar feedback al cambiar de página
  };
  const navigateToAddCard = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("addCardPage");
    setRecordedText(""); // Limpiar texto grabado al ir a añadir tarjeta
    setMatchFeedback(null); // Limpiar feedback al cambiar de página
  };
  const navigateToPracticePage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("practicePage");
    setRecordedText(""); // Limpiar texto grabado al ir a practicar
    setMatchFeedback(null); // Limpiar feedback al cambiar de página
  };

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

      if (
        currentPage === "home" ||
        !data.some((cat) => cat.id === selectedCategoryId)
      ) {
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        } else {
          setSelectedCategoryId(null);
        }
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
    setCurrentCardIndex(0); // Reiniciar el índice de la tarjeta
    setIsAnswerVisible(false); // Ocultar la respuesta
    setRecordedText(""); // Limpiar texto grabado al cambiar de categoría
    setMatchFeedback(null); // Limpiar feedback al cambiar de categoría
  }, [selectedCategoryId]);

  // Obtiene los datos de la categoría actual
  const currentCategory = Array.isArray(categories)
    ? categories.find((cat) => cat.id === selectedCategoryId)
    : undefined;
  const currentCards = currentCategory ? currentCategory.cards || [] : [];
  // Asegurarse de que currentCard no sea undefined si currentCards está vacío
  const currentCard =
    currentCards.length > 0 ? currentCards[currentCardIndex] : null;

  /**
   * Maneja el resultado del reconocimiento de voz.
   * @param {string} transcript - El texto transcrito.
   */
  const handleSpeechResult = (transcript) => {
    setRecordedText(transcript); // Actualiza el estado con el texto grabado

    // Comparar la transcripción con el texto de la pregunta
    if (currentCard && currentCard.question) {
      // Asegurarse de que currentCard exista
      const normalizedTranscript = transcript.toLowerCase().trim();
      const normalizedQuestion = currentCard.question.toLowerCase().trim();

      // Simplificar comparación: quitar puntuación y múltiples espacios para una mejor coincidencia
      const cleanTranscript = normalizedTranscript
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/\s{2,}/g, " ");
      const cleanQuestion = normalizedQuestion
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/\s{2,}/g, " ");

      if (cleanTranscript === cleanQuestion) {
        setMatchFeedback("correct");
      } else {
        setMatchFeedback("incorrect");
      }
    } else {
      setMatchFeedback(null); // No hay pregunta para comparar
    }
  };

  /**
   * Reproduce audio para un texto dado en un idioma específico usando ElevenLabs.
   * @param {string} text - El texto a reproducir.
   * @param {string} lang - El código de idioma (ej. 'en-US' para inglés, 'es-ES' para español).
   */
  const playAudio = async (text, lang) => {
    if (!text) {
      setMessage("No hay texto para reproducir audio.");
      return;
    }

    setIsLoading(true);
    setMessage("Generando audio con ElevenLabs...");

    try {
      const response = await fetch("/api/speech/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          lang: lang,
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
        const audioBlob = b64toBlob(audioContent, "audio/mpeg");
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audio.play();

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setMessage("");
          setIsLoading(false);
        };
        audio.onerror = (e) => {
          console.error("Error al reproducir audio:", e);
          setMessage("Error al reproducir el audio.");
          URL.revokeObjectURL(audioUrl);
          setIsLoading(false);
        };
        setMessage("Reproduciendo...");
      } else {
        throw new Error("No se recibió contenido de audio de ElevenLabs.");
      }
    } catch (error) {
      console.error("Error al reproducir audio con ElevenLabs TTS:", error);
      setMessage(`No se pudo generar voz: ${error.message}.`);
      setIsLoading(false);
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
   * @param {boolean} isClickable - Si el texto debe ser clicable para reproducir audio.
   * @returns {JSX.Element[]} Un array de elementos <span> para cada palabra o texto plano.
   */
  const renderClickableText = (text, lang, isClickable = true) => {
    if (!text) return null;
    if (!isClickable) {
      return <span>{text}</span>; // Si no es clicable, renderiza el texto plano
    }
    const parts = text.match(/(\w+|[^\w\s]+|\s+)/g) || [];

    return parts.map((part, index) => {
      if (part.trim() === "" || !/\w/.test(part)) {
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
      setRecordedText(""); // Limpiar texto grabado al cambiar de tarjeta
      setMatchFeedback(null); // Limpiar feedback de coincidencia
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
      setRecordedText(""); // Limpiar texto grabado al cambiar de tarjeta
      setMatchFeedback(null); // Limpiar feedback de coincidencia
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
      const url = "/api/categories/add";
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
      const url = "/api/cards/add";
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

  // --- Renderización de Páginas ---

  const renderHomePage = () => (
    <>
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
                        onClick={() =>
                          navigateToPracticePage(cat.id)
                        } /* Navega a la página de práctica */
                        className='category-button'
                        disabled={isLoading}
                      >
                        {cat.name} ({cat.cards ? cat.cards.length : 0} tarjetas)
                      </button>
                      <div className='category-actions'>
                        <button
                          onClick={() =>
                            navigateToAddCard(cat.id)
                          } /* Nuevo botón para añadir tarjetas */
                          className='button add-item-button'
                          disabled={isLoading}
                        >
                          Agregar
                        </button>
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
      </div>
    </>
  );

  const renderAddCardPage = () => (
    <>
      <h1 className='app-title'>Añadir Tarjetas</h1>
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
          <button
            onClick={navigateToHome}
            className='button back-button'
            disabled={isLoading}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </>
  );

  const renderPracticePage = () => (
    <>
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
      <div className='main-content-wrapper'>
        {currentCard ? (
          <div className='card-container'>
            {recordedText && (
              <div className='recorded-text-display'>{recordedText}</div>
            )}
            <div className={`card-content-area ${matchFeedback}`}>
              <div className='card-text question'>
                {renderClickableText(
                  currentCard.question,
                  currentCard.langQuestion || "en-US",
                  true
                )}
              </div>
              {isAnswerVisible && (
                <div className='card-text answer'>
                  {renderClickableText(
                    currentCard.answer,
                    currentCard.langAnswer || "es-ES",
                    false
                  )}
                </div>
              )}
            </div>
            <div className='controls'>
              <SpeechToTextButton
                onResult={handleSpeechResult}
                disabled={isLoading}
                lang={currentCard.langQuestion}
              />
              <button
                onClick={() =>
                  playAudio(currentCard.question, currentCard.langQuestion)
                }
              >
                🔈
              </button>
              <button onClick={toggleAnswerVisibility}>
                {isAnswerVisible ? "Ocultar" : "Mostrar"}
              </button>
              <button onClick={prevCard}>Anterior</button>
              <button onClick={nextCard}>Siguiente</button>
            </div>
            <div className='card-counter'>
              Tarjeta {currentCardIndex + 1} de {currentCards.length}
            </div>
            <button onClick={navigateToHome}>Volver al Inicio</button>
          </div>
        ) : (
          <p className='info-text'>
            No hay tarjetas en esta categoría. Agrégalas desde "Gestionar
            Categorías".
          </p>
        )}
      </div>
    </>
  );

  // --- Renderización Principal de App ---
  return (
    <div className='app-container'>
      {currentPage === "home" && renderHomePage()}
      {currentPage === "addCardPage" && renderAddCardPage()}
      {currentPage === "practicePage" && renderPracticePage()}

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
