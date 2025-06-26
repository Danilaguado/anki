// src/App.js
import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import SpeechToTextButton from "./components/SpeechToTextButton";

// Main App Component
const App = () => {
  // State para gestionar categorías y tarjetas
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState(""); // Inicialización correcta
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State para la edición de categorías
  const [isEditingCategory, setIsEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState(""); // Inicialización correcta

  // State para el modal de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

  // Nuevo estado para la navegación de páginas
  const [currentPage, setCurrentPage] = useState("home");

  // Nuevo estado para el texto grabado del STT
  const [recordedText, setRecordedText] = useState("");

  // Nuevo estado para el feedback de coincidencia de pronunciación
  const [matchFeedback, setMatchFeedback] = useState(null);

  // Caché para los URLs de audio (persistirá mientras App esté montada)
  const audioCache = useRef(new Map());

  // --- Funciones de Navegación ---
  const navigateToHome = () => {
    // Limpiar todos los Blob URLs del caché al volver al inicio
    audioCache.current.forEach((url) => URL.revokeObjectURL(url));
    audioCache.current.clear(); // Vaciar el mapa
    console.log("Caché de audio limpiado al volver al inicio.");

    setCurrentPage("home");
    setRecordedText("");
    setMatchFeedback(null);
  };
  const navigateToAddCard = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("addCardPage");
    setRecordedText("");
    setMatchFeedback(null);
  };
  const navigateToPracticePage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("practicePage");
    setRecordedText("");
    setMatchFeedback(null);
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
        data = [];
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
    setCurrentCardIndex(0);
    setIsAnswerVisible(false);
    setRecordedText("");
    setMatchFeedback(null);
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
    setRecordedText(transcript);

    if (currentCard && currentCard.question) {
      const normalizedTranscript = transcript.toLowerCase().trim();
      const normalizedQuestion = currentCard.question.toLowerCase().trim();

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
      setMatchFeedback(null);
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

    const cacheKey = `${text}-${lang}`; // Clave única para el caché

    // 1. Intentar obtener el audio del caché
    if (audioCache.current.has(cacheKey)) {
      const cachedAudioUrl = audioCache.current.get(cacheKey);
      console.log("Reproduciendo desde caché:", text);
      setMessage("Reproduciendo (desde caché)...");
      setIsLoading(true); // Deshabilitar botones mientras se reproduce
      const audio = new Audio(cachedAudioUrl);
      audio.play();

      audio.onended = () => {
        setMessage("");
        setIsLoading(false);
      };
      audio.onerror = (e) => {
        console.error("Error al reproducir desde caché:", e);
        setMessage("Error al reproducir audio desde caché.");
        setIsLoading(false);
      };
      return; // Salir, ya hemos manejado la reproducción
    }

    // 2. Si no está en caché, hacer la petición a ElevenLabs
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

        // Guardar en caché antes de reproducir
        audioCache.current.set(cacheKey, audioUrl);
        console.log("Audio cacheado:", text);

        const audio = new Audio(audioUrl);
        audio.play();

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl); // Liberar el Blob URL cuando termine
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
      console.error(
        "Error al generar o reproducir audio con ElevenLabs TTS:",
        error
      );
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
      setRecordedText("");
      setMatchFeedback(null);
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
      setRecordedText("");
      setMatchFeedback(null);
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
    setShowDeleteConfirm(false);
    setCategoryToDeleteId(null);
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

  const renderPracticePage = () => {
    return (
      <>
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
          {currentCard ? (
            <div className='card-container'>
              {/* Texto grabado del micrófono */}
              {recordedText && (
                <div className='recorded-text-display'>{recordedText}</div>
              )}

              {/* Área de contenido de la tarjeta con pregunta y respuesta */}
              <div
                className={`card-content-area ${
                  matchFeedback === "correct" ? "match-correct" : ""
                } ${matchFeedback === "incorrect" ? "match-incorrect" : ""}`}
              >
                <div id='question-text' className='card-text question'>
                  {renderClickableText(
                    currentCard.question,
                    currentCard.langQuestion || "en-US",
                    true
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
                    currentCard.langAnswer || "es-ES",
                    false
                  )}
                </div>
              </div>

              {/* Contenedor para el botón de micrófono y reproducir tarjeta (flexbox) */}
              <div className='microphone-play-buttons-group'>
                <SpeechToTextButton
                  onResult={handleSpeechResult}
                  disabled={isLoading}
                  lang={currentCard.langQuestion || "en-US"}
                />

                <button
                  onClick={() =>
                    playAudio(
                      currentCard.question,
                      currentCard.langQuestion || "en-US"
                    )
                  }
                  className='button audio-button-round primary-button'
                  disabled={isLoading}
                  aria-label='Reproducir Tarjeta Completa'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='100%'
                    height='100%'
                    fill='currentColor'
                    viewBox='0 0 16 16'
                  >
                    <path d='M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z' />
                  </svg>
                </button>
              </div>

              {/* Botón de Mostrar/Ocultar Traducción */}
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
            <p className='info-text'>
              No hay tarjetas en esta categoría. Puedes añadir algunas desde la
              sección "Gestionar Categorías".
            </p>
          )}
          <button
            onClick={navigateToHome}
            className='button back-button'
            disabled={isLoading}
          >
            Volver al Inicio
          </button>
        </div>
      </>
    );
  };

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
