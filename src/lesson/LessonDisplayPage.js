// src/lesson/LessonDisplayPage.js
// Esta es la nueva página que muestra una lección específica (estándar o chatbot).
// Ahora es minimalista, solo contiene LessonCard y MessageDisplay.

import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ¡CORREGIDO! Importar useParams y useNavigate
import MessageDisplay from "../components/MessageDisplay";
import LessonCard from "./components/lessonCard"; // Importa el componente LessonCard

// Importar el contexto
import AppContext from "../context/AppContext";

const LessonDisplayPage = () => {
  const { lessonId } = useParams(); // Hook para obtener el LessonID de la URL
  const navigate = useNavigate(); // Hook para la navegación programática
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

  // --- ESTADOS PARA EL POP-UP DE NOTAS (gestionados aquí para el botón de cerrar) ---
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
        // Si no hay lessonId en el estado, es un error
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

    fetchLesson(); // Llama a fetchLesson directamente
  }, [lessonId, setAppMessage, setAppIsLoading]); // Dependencias: lessonId para recargar si cambia

  // Función para volver a la lista de lecciones
  const handleBackToList = () => {
    navigate("/lessons"); // Navega de vuelta a la página de lista de lecciones
  };

  // Lógica para el Pop-up de Notas (pasada a LessonCard y ChatbotLessonRawDisplay)
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
      {" "}
      {/* Usa el wrapper de lecciones */}
      {/* Botón de cerrar para volver a la lista de lecciones */}
      <button onClick={handleBackToList} className='close-lesson-button'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          fill='currentColor'
          viewBox='0 0 16 16'
        >
          <path d='M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z' />
        </svg>
      </button>
      {/* Pop-up de Notas (Modal) - Ahora gestionado aquí */}
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
        // Renderiza LessonCard, que a su vez decide qué tipo de display usar
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
