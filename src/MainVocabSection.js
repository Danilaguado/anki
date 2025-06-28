// src/MainVocabSection.js
// Este archivo contiene toda la lógica y UI del entrenador de vocabulario.

import React, { useState, useEffect, useRef } from "react";
import "./index.css"; // Estilos globales

// Importar componentes modularizados
import CategoryList from "./components/CategoryList";
import AddCardForm from "./components/AddCardForm";
import PracticeCard from "./components/PracticeCard";
import QuizCard from "./components/QuizCard";
import MessageDisplay from "./components/MessageDisplay";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import EditCategoryPage from "./components/EditCategoryPage";

// Importar utilidades (ya no necesitan acceder a audioCache directamente, lo reciben por onPlayAudio)
import { normalizeText } from "./utils/textUtils"; // renderizableText se pasa como prop

// Recibir las props globales de App.js
const MainVocabSection = ({
  onPlayAudio,
  setAppMessage,
  setAppIsLoading,
  appIsLoading,
}) => {
  // <-- Recibir props
  // State para gestionar categorías y tarjetas (específicos de esta sección)
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  // message e isLoading ahora son gestionados globalmente por App.js
  // const [message, setMessage] = useState("");
  // const [isLoading, setIsLoading] = useState(false);

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

  // Path al archivo de audio para aciertos (global, puede permanecer aquí o moverse a utils)
  const CORRECT_SOUND_PATH = "/correct-6033.mp3";

  // Set para guardar los IDs de las tarjetas acertadas en la sesión del quiz (específico de esta sección)
  const masteredCardIds = useRef(new Set());

  // audioCache y wrappedPlayAudio ahora están en App.js y se pasan como prop.
  // const audioCache = useRef(new Map());
  // const wrappedPlayAudio = (text, lang) => playAudio(text, lang, audioCache.current, b64toBlob, setAppMessage, setAppIsLoading);

  // --- Funciones de Navegación (internas a esta sección) ---
  const navigateToHome = () => {
    // La limpieza del caché de audio ahora es responsabilidad de App.js (o un useEffect en App.js)
    // audioCache.current.forEach((url) => URL.revokeObjectURL(url));
    // audioCache.current.clear();
    // console.log("Caché de audio limpiado al volver al inicio de sección.");

    masteredCardIds.current.clear();
    console.log("Tarjetas acertadas del quiz limpiadas.");

    setCurrentPage("home");
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay("");
  };
  const navigateToAddCard = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("addCardPage");
    setNewCardQuestion("");
    setNewCardAnswer("");
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay("");
  };
  const navigateToPracticePage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentCardIndex(0);
    setIsAnswerVisible(false);
    setCurrentPage("practicePage");
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay("");
  };
  const navigateToQuizPage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentCardIndex(0);
    setCurrentPage("quizPage");
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay("");
    masteredCardIds.current.clear();
  };
  const navigateToEditCategoryPage = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage("editCategoryPage");
    setAppMessage(""); // Usar setAppMessage
    setAppIsLoading(false); // Usar setAppIsLoading
  };

  // --- Función para cargar datos desde las API de Vercel ---
  const fetchCategories = async () => {
    setAppIsLoading(true); // Usar setAppIsLoading
    setAppMessage("Cargando datos..."); // Usar setAppMessage
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
        setAppMessage(
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

      setAppMessage("Datos cargados exitosamente.");
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      setAppMessage(`Error al cargar datos: ${error.message}.`);
      setCategories([]);
      setSelectedCategoryId(null);
    } finally {
      setAppIsLoading(false); // Usar setAppIsLoading
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
    setRecordedMicrophoneText("");
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setQuizCorrectAnswerDisplay("");
    masteredCardIds.current.clear();
  }, [selectedCategoryId, currentPage]);

  // Obtiene los datos de la categoría actual
  const currentCategory = Array.isArray(categories)
    ? categories.find((cat) => cat.id === selectedCategoryId)
    : undefined;
  const currentCards = currentCategory ? currentCategory.cards || [] : [];
  const currentCard =
    currentCards.length > 0 ? currentCards[currentCardIndex] : null;

  /**
   * Maneja el resultado del reconocimiento de voz (micrófono).
   * @param {string} transcript - El texto transcrito.
   */
  const handleSpeechResult = (transcript) => {
    setRecordedMicrophoneText(transcript);

    if (currentCard && currentCard.question) {
      const normalizedTranscript = normalizeText(transcript);
      const normalizedTargetText =
        currentPage === "quizPage"
          ? normalizeText(currentCard.question)
          : normalizeText(currentCard.question);

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
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      setQuizCorrectAnswerDisplay("");
      return;
    }

    if (currentCard && currentCard.question) {
      const normalizedTyped = normalizeText(userTypedAnswer);
      const normalizedQuestion = normalizeText(currentCard.question);

      if (normalizedTyped === normalizedQuestion) {
        setMatchFeedback("correct");
        masteredCardIds.current.add(currentCard.id);
        setQuizCorrectAnswerDisplay(currentCard.question);
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
      setUserTypedAnswer("");
      setMatchFeedback(null);
      setQuizCorrectAnswerDisplay("");
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
      setUserTypedAnswer("");
      setMatchFeedback(null);
      setQuizCorrectAnswerDisplay("");
    }
  };

  /**
   * Añade una nueva categoría llamando a la API de Vercel.
   */
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      setAppMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setAppIsLoading(true);
    setAppMessage("Creando categoría...");
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
        setAppMessage(`Categoría "${newCategoryName}" creada.`);
        await fetchCategories();
      } else {
        throw new Error(
          result.error || "Error desconocido al añadir categoría."
        );
      }
    } catch (error) {
      console.error("Error al añadir categoría:", error);
      setAppMessage(`Error al crear la categoría: ${error.message}.`);
    } finally {
      setAppIsLoading(false);
    }
  };

  /**
   * Añade una nueva tarjeta a la categoría seleccionada llamando a la API de Vercel.
   */
  const addCardManually = async () => {
    if (!selectedCategoryId) {
      setAppMessage("Por favor, selecciona una categoría primero.");
      return;
    }
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) {
      setAppMessage("La pregunta y la respuesta no pueden estar vacías.");
      return;
    }
    setAppIsLoading(true);
    setAppMessage("Añadiendo tarjeta...");
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
        setAppMessage("Tarjeta añadida manualmente.");
        await fetchCategories();
      } else {
        throw new Error(result.error || "Error desconocido al añadir tarjeta.");
      }
    } catch (error) {
      console.error("Error al añadir tarjeta manualmente:", error);
      setAppMessage(`Error al añadir la tarjeta: ${error.message}.`);
    } finally {
      setAppIsLoading(false);
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
    setAppIsLoading(true);
    setAppMessage("Eliminando categoría...");
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
        setAppMessage(`Categoría eliminada.`);
        setShowDeleteConfirm(false);
        setCategoryToDeleteId(null);
        await fetchCategories();
        navigateToHome();
      } else {
        throw new Error(
          result.error || "Error desconocido al eliminar categoría."
        );
      }
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      setAppMessage(`Error al eliminar la categoría: ${error.message}.`);
    } finally {
      setAppIsLoading(false);
    }
  };

  // Función para pasar a EditCategoryPage para que recargue las categorías en MainVocabSection
  const handleSaveCategoryChanges = async () => {
    setAppMessage("Recargando datos después de la edición...");
    await fetchCategories();
    setAppMessage("Datos actualizados.");
  };

  // --- Renderizado Principal de MainVocabSection ---
  return (
    <div className='app-container'>
      {" "}
      {/* Mantén el app-container aquí para estilos */}
      <h1 className='app-title'>Mi Entrenador de Vocabulario</h1>
      {/* MessageDisplay se encarga de mostrar mensajes y estado de carga */}
      <MessageDisplay message={message} isLoading={appIsLoading} />{" "}
      {/* Usar appIsLoading */}
      {/* Renderizado condicional de las páginas internas de MainVocabSection */}
      {currentPage === "home" && (
        <CategoryList
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          newCategoryName={newCategoryName}
          isLoading={appIsLoading}
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
          isLoading={appIsLoading}
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
          isLoading={appIsLoading}
          onToggleAnswerVisible={toggleAnswerVisible}
          onNextCard={nextCard}
          onPrevCard={prevCard}
          onHandleSpeechResult={handleSpeechResult}
          onPlayAudio={onPlayAudio}
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
          isLoading={appIsLoading}
          onHandleSpeechResult={handleSpeechResult}
          onPlayAudio={onPlayAudio}
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
          isLoading={appIsLoading}
          setMessage={setAppMessage}
        />
      )}
      {/* El componente PrincipalPageLessons no debe renderizarse aquí,
          ya que es una ruta separada manejada por App.js.
          Se pasa como prop a App.js y se renderiza condicionalmente allí.
          Esta línea se elimina si la habías añadido.
      */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          onDelete={deleteCategory}
          onCancel={cancelAction}
          isLoading={appIsLoading}
        />
      )}
    </div>
  );
};

export default MainVocabSection;
