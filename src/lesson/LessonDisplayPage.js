// src/lesson/LessonDisplayPage.js
// Esta es la nueva página que muestra una lección específica (estándar o chatbot).
// Ahora lee el lessonId del localStorage.

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom"; // useLocation ya no es necesario
import MessageDisplay from "../components/MessageDisplay";
import LessonCard from "./lessonCard"; // Importa el componente LessonCard

// Importar el contexto
import AppContext from "../context/AppContext";

const LessonDisplayPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const {
    setAppMessage,
    setAppIsLoading,
    appIsLoading,
    appGlobalMessage,
    onPlayAudio,
  } = useContext(AppContext);

  const [lesson, setLesson] = useState(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [error, setError] = useState(null);

  // --- ESTADOS PARA EL POP-UP DE NOTAS ---
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesContent, setNotesContent] = useState("");

  useEffect(() => {
    const fetchLesson = async () => {
      setIsLoadingLesson(true);
      setAppIsLoading(true);
      setAppMessage("Cargando lección...");
      setError(null);
      setLesson(null);

      if (!lessonId) {
        setError(
          "Error: ID de lección no proporcionado. Por favor, selecciona una lección de la lista."
        );
        setAppMessage("Error: ID de lección no proporcionado.");
        setIsLoadingLesson(false);
        setAppIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/lessons/get-all");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Error HTTP: ${response.status} - ${
                response.statusText || "Error desconocido"
              }`
          );
        }
        const result = await response.json();
        if (result.success && result.lessons) {
          const foundLesson = result.lessons.find(
            (l) => l.LessonID === lessonId
          );
          if (foundLesson) {
            setLesson(foundLesson);
            setAppMessage(`Lección "${foundLesson.Title}" cargada.`);
          } else {
            setError("Lección no encontrada.");
            setAppMessage("Lección no encontrada.");
          }
        } else {
          setError(result.error || "Error al cargar lecciones.");
          setAppMessage("Error al cargar lección.");
        }
      } catch (err) {
        console.error("Error al cargar la lección:", err);
        setError(`Error al cargar la lección: ${err.message}.`);
        setAppMessage(`Error: ${err.message}.`);
      } finally {
        setIsLoadingLesson(false);
        setAppIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, setAppMessage, setAppIsLoading]);

  const handleBackToList = () => {
    localStorage.removeItem("currentLessonId");
    navigate("/lessons");
  };

  const handleShowNotes = (content) => {
    setNotesContent(content);
    setShowNotesModal(true);
  };
  const handleCloseNotesModal = () => {
    setShowNotesModal(false);
    setNotesContent("");
  };

  return (
    <div className='lessons-page-wrapper app-container'>
      {/* Pop-up de Notas (Modal) */}
      {showNotesModal && (
        <div className='notes-modal-overlay' onClick={handleCloseNotesModal}>
          <div
            className='notes-modal-content'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='notes-modal-close-button'
              onClick={handleCloseNotesModal}
            >
              &times;
            </button>
            <h3>Notas del Ejercicio</h3>
            <p>{notesContent}</p>
          </div>
        </div>
      )}

      <MessageDisplay
        message={appGlobalMessage}
        isLoading={appIsLoading || isLoadingLesson}
      />
      {error && (
        <div className='message-box error-box' role='alert'>
          <span className='message-text'>{error}</span>
        </div>
      )}

      {isLoadingLesson && !lesson && (
        <p className='info-text'>Cargando lección...</p>
      )}

      {lesson && (
        // El LessonCard ahora es el que contiene el botón de cerrar y el contenido del ejercicio
        <LessonCard
          lesson={lesson}
          onBack={handleBackToList} // Pasa la función de volver a la lista
          onShowNotes={handleShowNotes} // Pasa la función para mostrar notas
        />
      )}
    </div>
  );
};

export default LessonDisplayPage;
