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
  // Añadimos 'quizPage'
  const [currentPage, setCurrentPage] = useState("home"); // 'home', 'addCardPage', 'practicePage', 'quizPage'

  // Nuevo estado para el texto grabado del STT (siempre muestra lo del micro)
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");
  // Nuevo estado para la respuesta escrita por el usuario en el quiz
  const [userTypedAnswer, setUserTypedAnswer] = useState("");

  // Nuevo estado para el feedback de coincidencia de pronunciación/texto
  const [matchFeedback, setMatchFeedback] = useState(null); // null, 'correct', 'incorrect'

  // Nuevo estado para la respuesta correcta que se muestra en el quiz si acierta
  const [quizCorrectAnswerDisplay, setQuizCorrectAnswerDisplay] = useState("");

  // Nuevo: Path al archivo de audio para aciertos
  // Asegúrate de que este path sea accesible públicamente, usualmente se coloca en la carpeta `public/`
  const CORRECT_SOUND_PATH = "/correct-6033.mp3";

  // Nuevo: Set para guardar los IDs de las tarjetas acertadas en la sesión del quiz
  const masteredCardIds = useRef(new Set()); // Se inicializa con useRef para persistir a través de renders

  // Caché para los URLs de audio (persistirá mientras App esté montada)
  const audioCache = useRef(new Map());

  // --- Funciones de Navegación ---
  const navigateToHome = () => {
    // Limpiar todos los Blob URLs del caché al volver al inicio
    audioCache.current.forEach((url) => URL.revokeObjectURL(url));
    audioCache.current.clear(); // Vaciar el mapa
    console.log("Caché de audio limpiado al volver al inicio.");

    // Limpiar también las tarjetas acertadas del quiz al volver al inicio
    masteredCardIds.current.clear();
    console.log("Tarjetas acertadas del quiz limpiadas.");

    setCurrentPage("home");
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay(""); // Limpiar al volver a home
  };
  const navigateToAddCard = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("addCardPage");
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay(""); // Limpiar al ir a añadir tarjeta
  };
  const navigateToPracticePage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("practicePage");
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay(""); // Limpiar al ir a práctica
  };
  // Nuevo: Función para navegar a la página del quiz
  const navigateToQuizPage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("quizPage"); // Cambia a la nueva página de quiz
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay(""); // Limpiar al ir a quiz
    // No limpiamos masteredCardIds aquí, solo al volver al inicio
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
    setRecordedMicrophoneText(""); // Limpiar al cambiar de tarjeta/categoría
    setUserTypedAnswer(""); // Limpiar al cambiar de tarjeta/categoría
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay(""); // Limpiar al cambiar de tarjeta/categoría
    masteredCardIds.current.clear();
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
   * Normaliza un texto para la comparación (quita puntuación, convierte a minúsculas, elimina apóstrofes, normaliza espacios).
   * @param {string} text - El texto a normalizar.
   * @returns {string} El texto normalizado.
   */
  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .toLowerCase() // Convertir a minúsculas
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?¿!¡'"´`]/g, "") // Quitar puntuación y apóstrofes
      .replace(/\s{2,}/g, " ") // Reemplazar múltiples espacios con uno solo
      .trim(); // Eliminar espacios al inicio/final
  };

  /**
   * Maneja el resultado del reconocimiento de voz (micrófono).
   * @param {string} transcript - El texto transcrito.
   */
  const handleSpeechResult = (transcript) => {
    setRecordedMicrophoneText(transcript); // Siempre mostrar lo que el micrófono grabó

    if (currentCard && currentCard.question) {
      const normalizedTranscript = normalizeText(transcript);
      const normalizedQuestion = normalizeText(currentCard.question);

      if (normalizedTranscript === normalizedQuestion) {
        setMatchFeedback("correct");
        if (currentPage === "quizPage") {
          // Solo añadir a acertadas en modo quiz
          masteredCardIds.current.add(currentCard.id);
          setQuizCorrectAnswerDisplay(currentCard.question); // Mostrar la respuesta correcta en inglés
        }
        const audio = new Audio(CORRECT_SOUND_PATH);
        audio
          .play()
          .catch((e) =>
            console.error("Error al reproducir sonido de acierto:", e)
          );
      } else {
        setMatchFeedback("incorrect");
        setQuizCorrectAnswerDisplay(""); // Si es incorrecto, no mostrar la respuesta correcta
      }
    } else {
      setMatchFeedback(null);
      setQuizCorrectAnswerDisplay("");
    }
  };

  /**
   * Valida la respuesta escrita por el usuario en el modo quiz.
   */
  const checkTypedAnswer = () => {
    if (!userTypedAnswer.trim()) {
      setMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null); // Limpiar feedback si el campo está vacío
      setQuizCorrectAnswerDisplay(""); // Limpiar si el campo está vacío
      return;
    }

    if (currentCard && currentCard.question) {
      const normalizedTyped = normalizeText(userTypedAnswer);
      const normalizedQuestion = normalizeText(currentCard.question);

      if (normalizedTyped === normalizedQuestion) {
        setMatchFeedback("correct");
        masteredCardIds.current.add(currentCard.id);
        setQuizCorrectAnswerDisplay(currentCard.question); // Mostrar la respuesta correcta en inglés
        const audio = new Audio(CORRECT_SOUND_PATH);
        audio
          .play()
          .catch((e) =>
            console.error("Error al reproducir sonido de acierto:", e)
          );
      } else {
        setMatchFeedback("incorrect");
        setQuizCorrectAnswerDisplay(""); // Si es incorrecto, no mostrar la respuesta correcta
      }
    }
  };

  /**
   * Maneja el evento de tecla para el campo de respuesta del quiz (permite Enter para verificar).
   */
  const handleQuizInputKeyDown = (e) => {
    if (e.key === "Enter") {
      checkTypedAnswer();
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
          // Ya no revocamos aquí, solo al volver al inicio
          setMessage("");
          setIsLoading(false);
        };
        audio.onerror = (e) => {
          console.error("Error al reproducir audio:", e);
          setMessage("Error al reproducir el audio.");
          // Ya no revocamos aquí, solo al volver al inicio
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
  const toggleAnswerVisible = () => {
    setIsAnswerVisible(!isAnswerVisible);
  };

  /**
   * Avanza a la siguiente tarjeta en la categoría actual.
   */
  const nextCard = () => {
    if (currentCards.length > 0) {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % currentCards.length);
      setIsAnswerVisible(false);
      setRecordedMicrophoneText("");
      setUserTypedAnswer(""); // Limpiar respuesta escrita
      setMatchFeedback(null);
      setQuizCorrectAnswerDisplay(""); // Limpiar si es incorrecto
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
      setRecordedMicrophoneText("");
      setUserTypedAnswer(""); // Limpiar respuesta escrita
      setMatchFeedback(null);
      setQuizCorrectAnswerDisplay(""); // Limpiar si es incorrecto
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
                          aria-label='Agregar Tarjeta'
                        >
                          {/* SVG de Agregar */}
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='100%'
                            height='100%'
                            fill='currentColor'
                            viewBox='0 0 16 16'
                          >
                            {" "}
                            <path
                              fillRule='evenodd'
                              d='M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2'
                            />
                          </svg>
                        </button>
                        {/* Botón Quiz con texto */}
                        <button
                          onClick={() => navigateToQuizPage(cat.id)}
                          className='button quiz-button'
                          disabled={isLoading}
                        >
                          Quiz
                        </button>
                        <button
                          onClick={() => startEditCategory(cat)}
                          className='button edit-button'
                          disabled={isLoading}
                          aria-label='Editar Categoría'
                        >
                          {/* SVG de Editar */}
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='100%'
                            height='100%'
                            fill='currentColor'
                            viewBox='0 0 16 16'
                          >
                            {" "}
                            <path d='M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325' />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDeleteCategory(cat.id)}
                          className='button delete-button'
                          disabled={isLoading}
                          aria-label='Eliminar Categoría'
                        >
                          {/* SVG de Eliminar */}
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='100%'
                            height='100%'
                            fill='currentColor'
                            viewBox='0 0 16 16'
                          >
                            {" "}
                            <path d='M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z' />{" "}
                            <path d='M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z' />
                          </svg>
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
              {recordedMicrophoneText && (
                <div className='recorded-text-display'>
                  {recordedMicrophoneText}
                </div>
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
                  lang={
                    currentCard.question
                      ? currentCard.langQuestion || "en-US"
                      : "en-US"
                  } // Pasa el idioma de la pregunta
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
                onClick={toggleAnswerVisible}
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

  // --- renderQuizPage: Nueva función para la página del quiz ---
  const renderQuizPage = () => {
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
              {/* Texto grabado del micrófono (siempre se muestra si hay) */}
              {recordedMicrophoneText && (
                <div className='recorded-text-display'>
                  {recordedMicrophoneText}
                </div>
              )}

              {/* Área de contenido de la tarjeta - INVERTIDA: muestra español */}
              {/* Aplicar clase condicional para el feedback de coincidencia */}
              <div
                className={`card-content-area ${
                  matchFeedback === "correct" ? "match-correct" : ""
                } ${matchFeedback === "incorrect" ? "match-incorrect" : ""}`}
              >
                <div
                  id='question-text'
                  className='card-text question quiz-question'
                >
                  {" "}
                  {/* Clase para estilizar la pregunta del quiz */}
                  {/* Aquí se muestra la respuesta (frase en español) */}
                  {renderClickableText(
                    currentCard.answer,
                    currentCard.langAnswer || "es-ES",
                    false
                  )}
                </div>
                {/* Nueva sección para mostrar la respuesta correcta en inglés si se acierta */}
                {quizCorrectAnswerDisplay && (
                  <div className='card-text correct-answer-display'>
                    {quizCorrectAnswerDisplay}
                  </div>
                )}
              </div>

              {/* Contenedor para el botón de micrófono y reproducir (inglés) */}
              <div className='microphone-play-buttons-group'>
                <SpeechToTextButton
                  onResult={handleSpeechResult} // La misma lógica, pero comparará con el inglés
                  disabled={isLoading}
                  lang={
                    currentCard.question
                      ? currentCard.langQuestion || "en-US"
                      : "en-US"
                  } // El idioma a reconocer es el inglés de la pregunta
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
                  aria-label='Reproducir Frase en Inglés'
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

              {/* Input para escribir la respuesta en inglés y botón Verificar */}
              <div className='quiz-input-group'>
                <input
                  type='text'
                  className='input-field quiz-answer-input'
                  placeholder='Escribe la frase en inglés aquí'
                  value={userTypedAnswer}
                  onChange={(e) => setUserTypedAnswer(e.target.value)}
                  onKeyDown={handleQuizInputKeyDown}
                  disabled={isLoading}
                />
                <button
                  onClick={checkTypedAnswer}
                  className='button quiz-check-button'
                  disabled={isLoading}
                  aria-label='Verificar respuesta'
                >
                  {/* SVG del checkmark */}
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='100%'
                    height='100%'
                    fill='currentColor'
                    viewBox='0 0 16 16'
                  >
                    <path d='M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z' />
                  </svg>
                </button>
              </div>

              {/* El botón de Mostrar/Ocultar Traducción NO VA en el modo quiz */}

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
              No hay tarjetas en esta categoría para el quiz. Puedes añadir
              algunas desde la sección "Gestionar Categorías".
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
      {currentPage === "quizPage" && renderQuizPage()}{" "}
      {/* Nuevo: Renderizar la página del quiz */}
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
                onClick={cancelEditCategory}
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
