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
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para indicar carga/procesamiento

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
      // Llamada a la API de Vercel para obtener todas las categorías y tarjetas
      const url = "/api/categories/get-all";
      console.log("Intentando fetch GET de:", url);
      const response = await fetch(url);

      console.log("Raw response status (fetchCategories):", response.status);
      console.log(
        "Raw response statusText (fetchCategories):",
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error HTTP Response Text (fetchCategories):", errorText);
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta del servidor: ${errorText.substring(0, 200)}...`
        );
      }

      let data;
      try {
        const rawText = await response.text();
        console.log(
          "Respuesta de la API de Vercel (texto crudo fetchCategories):",
          rawText
        );
        data = JSON.parse(rawText);
      } catch (jsonError) {
        console.error("Error al parsear JSON (fetchCategories):", jsonError);
        throw new Error(
          `Respuesta no es JSON válido o está vacía. Error de parseo: "${jsonError.message}". Contenido recibido: "(ver consola para texto crudo)"`
        );
      }

      console.log(
        "Datos recibidos de la API de Vercel (tipo y contenido fetchCategories):",
        typeof data,
        data
      );

      if (data && typeof data === "object" && data.error) {
        throw new Error(data.error);
      }
      if (!Array.isArray(data)) {
        console.error(
          "La API de Vercel no devolvió un array como se esperaba (fetchCategories):",
          data
        );
        if (typeof data === "object" && Object.keys(data).length === 0) {
          data = [];
          setMessage(
            "Advertencia: El servidor devolvió un objeto vacío, interpretado como categorías vacías."
          );
        } else {
          throw new Error(
            "El servidor no devolvió los datos en el formato esperado (se esperaba un array de categorías)."
          );
        }
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
      console.error(
        "Error al cargar categorías (catch principal fetchCategories):",
        error
      );
      setMessage(
        `Error al cargar los datos: ${error.message}. Asegúrate de que las funciones Serverless de Vercel estén desplegadas y configuradas correctamente.`
      );
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
   * Reproduce audio para un texto dado en un idioma específico a una velocidad determinada.
   * @param {string} text - El texto a reproducir.
   * @param {string} lang - El código de idioma (ej. 'en-US' para inglés).
   * @param {number} rate - La velocidad del habla (ej. 1 para normal, 0.8 para más lento, 0.5 para el más lento).
   */
  const playAudio = async (text, lang, rate = 1) => {
    if (!text) {
      setMessage("No hay texto para reproducir audio.");
      return;
    }

    setIsLoading(true);
    setMessage("Generando audio con ElevenLabs...");

    try {
      const res = await fetch("/api/speech/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang, rate }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status} ${res.statusText}`);
      }

      const { audioContent } = await res.json();
      // Construimos un URL de blob a partir del Base64
      const audioBlob = b64toBlob(audioContent, "audio/mpeg");
      const url = URL.createObjectURL(audioBlob);

      const audio = new Audio(url);
      audio.play();

      // Opcional: limpiar el blob URL cuando termine
      audio.addEventListener("ended", () => URL.revokeObjectURL(url));

      setMessage("");
    } catch (e) {
      console.error("Error ElevenLabs TTS:", e);
      setMessage(`No se pudo generar voz: ${e.message}`);
    } finally {
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

      console.log("Raw response status (addCategory):", response.status);
      console.log(
        "Raw response statusText (addCategory):",
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error HTTP Response Text (addCategory):", errorText);
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta del servidor: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setNewCategoryName("");
        setMessage(`Categoría "${newCategoryName}" creada.`);
        await fetchCategories(); // Refrescar datos después de añadir
      } else {
        throw new Error(
          result.error || "Error desconocido al añadir categoría."
        );
      }
    } catch (error) {
      console.error(
        "Error al añadir categoría (catch principal addCategory):",
        error
      );
      setMessage(
        `Error al crear la categoría: ${error.message}. Revisa la consola y los logs de Vercel.`
      );
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
      console.log("Intentando fetch POST (addCardManually) a:", url);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          question: newCardQuestion.trim(),
          answer: newCardAnswer.trim(),
          langQuestion: "en-US", // Puedes ajustar esto según tu necesidad o añadir un input para el usuario
          langAnswer: "es-ES", // Puedes ajustar esto según tu necesidad o añadir un input para el usuario
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error HTTP Response Text (addCardManually):", errorText);
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta del servidor: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setNewCardQuestion("");
        setNewCardAnswer("");
        setMessage("Tarjeta añadida manualmente.");
        await fetchCategories(); // Refrescar datos después de añadir
      } else {
        throw new Error(result.error || "Error desconocido al añadir tarjeta.");
      }
    } catch (error) {
      console.error(
        "Error al añadir tarjeta manualmente (catch principal addCardManually):",
        error
      );
      setMessage(
        `Error al añadir la tarjeta: ${error.message}. Revisa la consola y los logs de Vercel.`
      );
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
      const url = "/api/categories/update"; // Ruta de la API de Vercel
      console.log("Intentando fetch PUT (saveEditedCategory) a:", url);
      const response = await fetch(url, {
        method: "PUT", // Usamos PUT para actualizar
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isEditingCategory,
          name: editedCategoryName.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Error HTTP Response Text (saveEditedCategory):",
          errorText
        );
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta del servidor: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setMessage(`Categoría "${editedCategoryName}" actualizada.`);
        setIsEditingCategory(null);
        setEditedCategoryName("");
        await fetchCategories(); // Refrescar datos después de actualizar
      } else {
        throw new Error(
          result.error || "Error desconocido al actualizar categoría."
        );
      }
    } catch (error) {
      console.error(
        "Error al guardar categoría editada (catch principal saveEditedCategory):",
        error
      );
      setMessage(
        `Error al actualizar la categoría: ${error.message}. Revisa la consola y los logs de Vercel.`
      );
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
      // Usamos parámetros de consulta para el ID en DELETE, como en la API de Vercel
      const url = `/api/categories/delete?id=${categoryToDeleteId}`;
      console.log("Intentando fetch DELETE (deleteCategory) a:", url);
      const response = await fetch(url, {
        method: "DELETE", // Usamos DELETE
        headers: { "Content-Type": "application/json" },
        // No se envía body con DELETE si el ID va en la URL
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error HTTP Response Text (deleteCategory):", errorText);
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta del servidor: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setMessage(`Categoría eliminada.`);
        setShowDeleteConfirm(false);
        setCategoryToDeleteId(null);
        await fetchCategories(); // Refrescar datos después de eliminar
      } else {
        throw new Error(
          result.error || "Error desconocido al eliminar categoría."
        );
      }
    } catch (error) {
      console.error(
        "Error al eliminar categoría (catch principal deleteCategory):",
        error
      );
      setMessage(
        `Error al eliminar la categoría: ${error.message}. Revisa la consola y los logs de Vercel.`
      );
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
          {" "}
          {/* Nuevo wrapper para la tarjeta y añadir tarjetas */}
          {selectedCategoryId && currentCategory ? (
            <div className='card-container'>
              <h2 className='card-title'>
                Tema Actual: {currentCategory.name}
              </h2>
              {currentCards.length > 0 ? (
                <>
                  <div className='card-content-area'>
                    <div id='question-text' className='card-text question'>
                      {currentCard.question}
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
                        playAudio(
                          currentCard.question,
                          currentCard.langQuestion || "en-US",
                          1
                        )
                      }
                      className='button audio-button normal'
                      disabled={isLoading}
                    >
                      Normal (1x)
                    </button>
                    <button
                      onClick={() =>
                        playAudio(
                          currentCard.question,
                          currentCard.langQuestion || "en-US",
                          0.8
                        )
                      }
                      className='button audio-button slow'
                      disabled={isLoading}
                    >
                      Lento (0.8x)
                    </button>
                    <button
                      onClick={() =>
                        playAudio(
                          currentCard.question,
                          currentCard.langQuestion || "en-US",
                          0.5
                        )
                      }
                      className='button audio-button very-slow'
                      disabled={isLoading}
                    >
                      Muy Lento (0.5x)
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
        </div>{" "}
        {/* Fin de card-and-add-wrapper */}
      </div>{" "}
      {/* Fin de main-content-wrapper */}
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
