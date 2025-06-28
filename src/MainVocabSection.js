// src/MainVocabSection.js
// Este archivo contiene toda la lógica y UI que antes estaba en App.js

import React, { useState, useEffect, useRef } from "react";
import "./index.css"; // Estilos globales (ya que MainVocabSection.js ahora está en src/)

// Importar componentes modularizados (las rutas relativas NO CAMBIAN desde src/MainVocabSection.js a src/components/)
import CategoryList from "./components/CategoryList";
import AddCardForm from "./components/AddCardForm";
import PracticeCard from "./components/PracticeCard";
import QuizCard from "./components/QuizCard";
import MessageDisplay from "./components/MessageDisplay";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import EditCategoryPage from "./components/EditCategoryPage";

// Importar utilidades (las rutas relativas NO CAMBIAN desde src/MainVocabSection.js a src/utils/)
import { playAudio, b64toBlob } from "./utils/audioUtils";
import { normalizeText } from "./utils/textUtils"; // renderClickableText se pasa como prop

// Componente principal del entrenador de vocabulario
const MainVocabSection = () => {
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

  // State para el modal de confirmación de eliminación de CATEGORÍA
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

  // Nuevo estado para la navegación de páginas dentro de esta sección
  const [currentPage, setCurrentPage] = useState("home"); // 'home', 'addCardPage', 'practicePage', 'quizPage', 'editCategoryPage'

  // Nuevo estado para el texto grabado del STT (siempre muestra lo del micro)
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");
  // Nuevo estado para la respuesta escrita por el usuario en el quiz
  const [userTypedAnswer, setUserTypedAnswer] = useState("");

  // Nuevo estado para el feedback de coincidencia de pronunciación/texto
  const [matchFeedback, setMatchFeedback] = useState(null); // null, 'correct', 'incorrect'

  // Nuevo estado para la respuesta correcta que se muestra en el quiz si acierta
  const [quizCorrectAnswerDisplay, setQuizCorrectAnswerDisplay] = useState("");

  // Nuevo: Path al archivo de audio para aciertos
  const CORRECT_SOUND_PATH = "/correct-6033.mp3"; // Asume que está en la carpeta public/

  // Nuevo: Set para guardar los IDs de las tarjetas acertadas en la sesión del quiz
  const masteredCardIds = useRef(new Set()); // Se inicializa con useRef para persistir a través de renders

  // Caché para los URLs de audio (persistirá mientras MainVocabSection esté montada)
  const audioCache = useRef(new Map());

  // Función para envolver playAudio con sus dependencias
  const wrappedPlayAudio = (text, lang) =>
    playAudio(
      text,
      lang,
      audioCache.current,
      b64toBlob,
      setMessage,
      setIsLoading
    );

  // --- Funciones de Navegación (internas a esta sección) ---
  const navigateToHome = () => {
    // Limpiar todos los Blob URLs del caché al volver al inicio de esta sección
    audioCache.current.forEach((url) => URL.revokeObjectURL(url));
    audioCache.current.clear(); // Vaciar el mapa
    console.log("Caché de audio limpiado al volver al inicio de sección.");

    // Limpiar también las tarjetas acertadas del quiz al volver al inicio de esta sección
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
    setNewCardQuestion(""); // Limpiar campos al navegar
    setNewCardAnswer(""); // Limpiar campos al navegar
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay("");
  };
  const navigateToPracticePage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentCardIndex(0); // Reinicia el índice al entrar a la práctica
    setIsAnswerVisible(false); // Oculta la respuesta al inicio
    setCurrentPage("practicePage");
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay("");
  };
  const navigateToQuizPage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentCardIndex(0); // Reinicia el índice al entrar al quiz
    setCurrentPage("quizPage"); // Cambia a la nueva página de quiz
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay("");
    masteredCardIds.current.clear(); // Reiniciar tarjetas acertadas para el nuevo quiz
  };
  // Función de navegación para la página de edición de categoría
  const navigateToEditCategoryPage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("editCategoryPage");
    setMessage(""); // Limpiar mensajes al navegar a la página de edición
    setIsLoading(false); // Limpiar estado de carga
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

      // Si la categoría seleccionada ya no existe o estamos en home, seleccionar la primera o ninguna
      if (
        currentPage === "home" || // Si estamos en home, seleccionamos la primera
        !data.some((cat) => cat.id === selectedCategoryId) // Si la categoría actual no está en los datos, reseteamos
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

  // Reinicia el índice de la tarjeta y la visibilidad de la respuesta cuando cambia la categoría seleccionada o la página
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsAnswerVisible(false);
    setRecordedMicrophoneText(""); // Limpiar al cambiar de tarjeta/categoría
    setUserTypedAnswer(""); // Limpiar al cambiar de tarjeta/categoría
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay(""); // Limpiar al cambiar de tarjeta/categoría
    masteredCardIds.current.clear();
  }, [selectedCategoryId, currentPage]); // Añadir currentPage como dependencia para resetear al cambiar de página

  // Obtiene los datos de la categoría actual
  const currentCategory = Array.isArray(categories)
    ? categories.find((cat) => cat.id === selectedCategoryId)
    : undefined;
  const currentCards = currentCategory ? currentCategory.cards || [] : [];
  // Asegurarse de que currentCard no sea undefined si currentCards está vacío
  const currentCard =
    currentCards.length > 0 ? currentCards[currentCardIndex] : null;

  /**
   * Maneja el resultado del reconocimiento de voz (micrófono).
   * @param {string} transcript - El texto transcrito.
   */
  const handleSpeechResult = (transcript) => {
    setRecordedMicrophoneText(transcript); // Siempre mostrar lo que el micrófono grabó

    // La lógica de comparación debe ser la misma tanto para práctica como para quiz
    if (currentCard && currentCard.question) {
      const normalizedTranscript = normalizeText(transcript);
      const normalizedTargetText =
        currentPage === "quizPage"
          ? normalizeText(currentCard.question) // En quiz, se compara con la pregunta (inglés)
          : normalizeText(currentCard.question); // En práctica, también se compara con la pregunta (inglés)

      if (normalizedTranscript === normalizedTargetText) {
        setMatchFeedback("correct");
        if (currentPage === "quizPage") {
          masteredCardIds.current.add(currentCard.id);
          setQuizCorrectAnswerDisplay(currentCard.question);
        }
        const audio = new Audio(CORRECT_SOUND_PATH);
        audio
          .play()
          .catch((e) =>
            console.error("Error al reproducir sonido de acierto:", e)
          );
      } else {
        setMatchFeedback("incorrect");
        setQuizCorrectAnswerDisplay("");
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
   * Función para confirmar la eliminación de una categoría.
   */
  const confirmDeleteCategory = (categoryId) => {
    setCategoryToDeleteId(categoryId);
    setShowDeleteConfirm(true);
  };

  /**
   * Cancela la acción de edición o eliminación de categoría.
   */
  const cancelAction = () => {
    setShowDeleteConfirm(false);
    setCategoryToDeleteId(null);
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
        await fetchCategories(); // Recargar categorías para reflejar el cambio
        navigateToHome(); // Asegurarse de volver a la vista principal
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

  // Función para pasar a EditCategoryPage para que recargue las categorías en MainVocabSection
  const handleSaveCategoryChanges = async () => {
    setMessage("Recargando datos después de la edición...");
    await fetchCategories(); // Recargar los datos después de guardar cambios en EditCategoryPage
    setMessage("Datos actualizados.");
  };

  // --- Renderizado Principal de MainVocabSection ---
  return (
    <div className='app-container'>
      {" "}
      {/* Mantén el app-container aquí para estilos */}
      <h1 className='app-title'>Mi Entrenador de Vocabulario</h1>
      {/* MessageDisplay se encarga de mostrar mensajes y estado de carga */}
      <MessageDisplay message={message} isLoading={isLoading} />
      {currentPage === "home" && (
        <CategoryList
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          newCategoryName={newCategoryName}
          isLoading={isLoading}
          onSelectCategory={setSelectedCategoryId}
          onNavigateToAddCard={navigateToAddCard}
          onNavigateToPracticePage={navigateToPracticePage}
          onNavigateToQuizPage={navigateToQuizPage}
          onNavigateToEditCategoryPage={navigateToEditCategoryPage}
          onConfirmDeleteCategory={confirmDeleteCategory}
          onNewCategoryNameChange={setNewCategoryName}
          onAddCategory={addCategory}
        />
      )}
      {currentPage === "addCardPage" && (
        <AddCardForm
          currentCategory={currentCategory}
          newCardQuestion={newCardQuestion}
          newCardAnswer={newCardAnswer}
          isLoading={isLoading}
          onNewCardQuestionChange={setNewCardQuestion}
          onNewCardAnswerChange={setNewCardAnswer}
          onAddCardManually={addCardManually}
          onNavigateToHome={navigateToHome}
        />
      )}
      {currentPage === "practicePage" && (
        <PracticeCard
          currentCard={currentCard}
          currentCardIndex={currentCardIndex}
          totalCards={currentCards.length}
          isAnswerVisible={isAnswerVisible}
          recordedMicrophoneText={recordedMicrophoneText}
          matchFeedback={matchFeedback}
          isLoading={isLoading}
          onToggleAnswerVisible={toggleAnswerVisible}
          onNextCard={nextCard}
          onPrevCard={prevCard}
          onHandleSpeechResult={handleSpeechResult}
          onPlayAudio={wrappedPlayAudio}
          onNavigateToHome={navigateToHome}
        />
      )}
      {currentPage === "quizPage" && (
        <QuizCard
          currentCard={currentCard}
          currentCardIndex={currentCardIndex}
          totalCards={currentCards.length}
          recordedMicrophoneText={recordedMicrophoneText}
          userTypedAnswer={userTypedAnswer}
          matchFeedback={matchFeedback}
          quizCorrectAnswerDisplay={quizCorrectAnswerDisplay}
          isLoading={isLoading}
          onHandleSpeechResult={handleSpeechResult}
          onPlayAudio={wrappedPlayAudio}
          onUserTypedAnswerChange={setUserTypedAnswer}
          onCheckTypedAnswer={checkTypedAnswer}
          onHandleQuizInputKeyDown={handleQuizInputKeyDown}
          onNextCard={nextCard}
          onPrevCard={prevCard}
          onNavigateToHome={navigateToHome}
        />
      )}
      {currentPage === "editCategoryPage" && (
        <EditCategoryPage
          category={currentCategory}
          onSaveCategoryChanges={handleSaveCategoryChanges}
          onNavigateToHome={navigateToHome}
          isLoading={isLoading}
          setMessage={setMessage}
        />
      )}
      {/* PrincipalPageLessons necesita estas props para audio y mensajes */}
      <PrincipalPageLessons
        onPlayAudio={wrappedPlayAudio}
        setAppMessage={setMessage}
        setAppIsLoading={setIsLoading}
      />
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          onDelete={deleteCategory}
          onCancel={cancelAction}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default MainVocabSection;
