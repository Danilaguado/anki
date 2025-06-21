// src/App.js
import React, { useState, useEffect } from "react";

// Ya no necesitamos la URL de Apps Script, ¡usaremos nuestras API Routes de Vercel!
// const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyD1WBnR6uw4V_unykmOlBGsXVOMS1G5P8Dm8uh44nwFZfTLnNN2FGYK5EHDsmsqhPH/exec";

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
  const playAudio = (text, lang, rate = 1) => {
    if (!text) {
      setMessage("No hay texto para reproducir audio.");
      return;
    }
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.pitch = 1;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } else {
      setMessage(
        "La API de Síntesis de Voz no es compatible con este navegador."
      );
      console.warn("SpeechSynthesis API not supported in this browser.");
    }
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
    <div className='min-h-screen bg-gray-100 p-4 flex flex-col items-center'>
      <h1 className='text-4xl font-extrabold text-gray-900 mb-8 mt-4 rounded-xl px-4 py-2 bg-white shadow-lg'>
        Mi Entrenador de Vocabulario
      </h1>

      {message && (
        <div
          className='bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl relative mb-6 w-full max-w-2xl text-center shadow-md'
          role='alert'
        >
          <span className='block sm:inline'>{message}</span>
        </div>
      )}

      {/* Nuevo: Indicador de carga */}
      {isLoading && (
        <div className='bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-xl relative mb-6 w-full max-w-2xl text-center shadow-md'>
          <span className='block sm:inline'>Cargando o procesando...</span>
        </div>
      )}

      {/* Section: Gestionar Categorías */}
      <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg mb-8'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          Gestionar Categorías
        </h2>
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          <input
            type='text'
            className='flex-grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
            placeholder='Nombre de la nueva categoría'
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={addCategory}
            className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
            disabled={isLoading}
          >
            Crear Categoría
          </button>
        </div>

        <h3 className='text-xl font-semibold text-gray-700 mb-3'>
          Tus Categorías:
        </h3>
        {categories.length === 0 ? (
          <p className='text-gray-500'>
            No hay categorías. Crea una para empezar.
          </p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition duration-200
                                ${
                                  selectedCategoryId === cat.id
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-800 font-bold"
                                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
                                }`}
              >
                {isEditingCategory === cat.id ? (
                  <div className='flex flex-col gap-2'>
                    <input
                      type='text'
                      className='p-2 border border-gray-400 rounded-lg text-gray-800'
                      value={editedCategoryName}
                      onChange={(e) => setEditedCategoryName(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className='flex gap-2'>
                      <button
                        onClick={saveEditedCategory}
                        className='flex-grow bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-2 rounded-lg'
                        disabled={isLoading}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEditCategory}
                        className='flex-grow bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-2 rounded-lg'
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
                      className='text-left font-semibold'
                      disabled={isLoading}
                    >
                      {cat.name} ({cat.cards ? cat.cards.length : 0} tarjetas)
                    </button>
                    <div className='flex gap-2 justify-end'>
                      <button
                        onClick={() => startEditCategory(cat)}
                        className='bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded-md shadow-sm'
                        disabled={isLoading}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => confirmDeleteCategory(cat.id)}
                        className='bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded-md shadow-sm'
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

      {/* Section: Anki Card Display */}
      {selectedCategoryId && currentCategory ? (
        <div className='card-container w-full max-w-md bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 mb-8'>
          <h2 className='text-2xl font-bold text-gray-800'>
            Tema Actual: {currentCategory.name}
          </h2>
          {currentCards.length > 0 ? (
            <>
              <div className='card-content min-h-[120px] flex flex-col justify-center items-center'>
                <div id='question-text' className='card-text'>
                  {currentCard.question}
                </div>
                <div
                  id='answer-text'
                  className={`card-answer ${isAnswerVisible ? "" : "hidden"}`}
                >
                  {currentCard.answer}
                </div>
              </div>

              {/* Audio Speed Buttons */}
              <div className='flex flex-wrap justify-center gap-2'>
                <button
                  onClick={() =>
                    playAudio(
                      currentCard.question,
                      currentCard.langQuestion || "en-US",
                      1
                    )
                  }
                  className='btn btn-audio bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
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
                  className='btn btn-audio bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
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
                  className='btn btn-audio bg-green-400 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
                  disabled={isLoading}
                >
                  Muy Lento (0.5x)
                </button>
              </div>

              <button
                onClick={toggleAnswerVisibility}
                className='btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
                disabled={isLoading}
              >
                {isAnswerVisible ? "Ocultar Traducción" : "Mostrar Traducción"}
              </button>

              <div className='navigation-buttons flex justify-between gap-4'>
                <button
                  onClick={prevCard}
                  className='btn btn-secondary bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 flex-grow'
                  disabled={isLoading}
                >
                  Anterior
                </button>
                <button
                  onClick={nextCard}
                  className='btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 flex-grow'
                  disabled={isLoading}
                >
                  Siguiente
                </button>
              </div>

              <div className='card-counter text-gray-600 text-sm mt-2'>
                Tarjeta {currentCards.length > 0 ? currentCardIndex + 1 : 0} de{" "}
                {currentCards.length}
              </div>
            </>
          ) : (
            <p className='text-gray-500'>
              No hay tarjetas en esta categoría. Añade algunas manualmente.
            </p>
          )}
        </div>
      ) : (
        <div className='w-full max-w-md bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 mb-8'>
          <p className='text-gray-600 text-center'>
            Selecciona una categoría o crea una nueva para empezar a estudiar.
          </p>
        </div>
      )}

      {/* Section: Add Cards */}
      {selectedCategoryId && (
        <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>
            Añadir Tarjetas a "{currentCategory?.name || "..."}"
          </h2>

          {/* Manual Card Addition */}
          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            Añadir Manualmente:
          </h3>
          <div className='flex flex-col gap-4 mb-6'>
            <input
              type='text'
              className='p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Pregunta (Inglés)'
              value={newCardQuestion}
              onChange={(e) => setNewCardQuestion(e.target.value)}
              disabled={isLoading}
            />
            <input
              type='text'
              className='p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Respuesta (Español)'
              value={newCardAnswer}
              onChange={(e) => setNewCardAnswer(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={addCardManually}
              className='bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
              disabled={isLoading}
            >
              Añadir Tarjeta Manualmente
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Custom UI) */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center'>
            <p className='text-lg font-semibold text-gray-800 mb-4'>
              ¿Estás seguro que quieres eliminar esta categoría?
            </p>
            <p className='text-sm text-gray-600 mb-6'>
              Esta acción no se puede deshacer y la categoría se perderá.
            </p>
            <div className='flex justify-center gap-4'>
              <button
                onClick={deleteCategory}
                className='bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200'
                disabled={isLoading}
              >
                Sí, Eliminar
              </button>
              <button
                onClick={cancelDelete}
                className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200'
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
