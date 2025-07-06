// src/lesson/LessonDisplayPage.js

import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MessageDisplay from "../components/MessageDisplay";
import LessonCard from "./lessonCard";
import AppContext from "../context/AppContext";

const LessonDisplayPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { setAppMessage, setAppIsLoading, appIsLoading, appGlobalMessage } =
    useContext(AppContext);

  const [lesson, setLesson] = useState(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [error, setError] = useState(null);

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
        setError("Error: ID de lección no proporcionado.");
        setAppMessage("Error: ID de lección no proporcionado.");
        setIsLoadingLesson(false);
        setAppIsLoading(false);
        return;
      }

      try {
        // CONSEJO DE DEPURACIÓN:
        // Imprime en la consola para asegurarte de que la API devuelve lo que esperas.
        const response = await fetch("/api/lessons/get-all");
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        const result = await response.json();

        // Imprime la respuesta para ver su estructura
        console.log("Respuesta de la API:", result);

        if (result.success && result.lessons) {
          const foundLesson = result.lessons.find(
            (l) => String(l.LessonID) === lessonId
          );
          if (foundLesson) {
            setLesson(foundLesson);
            setAppMessage(`Lección "${foundLesson.Title}" cargada.`);
            setError(null); // Limpiar errores anteriores
          } else {
            setError(`Lección con ID "${lessonId}" no encontrada.`);
            setAppMessage("Lección no encontrada.");
          }
        } else {
          setError(result.error || "Error al procesar las lecciones.");
          setAppMessage("Error al procesar lección.");
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

  // --- LÓGICA DE RENDERIZADO MEJORADA ---
  const renderContent = () => {
    if (isLoadingLesson) {
      return <p className='info-text'>Cargando lección...</p>;
    }

    // CAMBIO CLAVE: Si la carga terminó y hay un error, muéstralo prominentemente.
    if (error) {
      return (
        <div className='message-box error-box' role='alert'>
          <span className='message-text'>{error}</span>
          <button
            onClick={handleBackToList}
            className='button primary-button'
            style={{ marginTop: "1rem" }}
          >
            Volver a la lista
          </button>
        </div>
      );
    }

    if (lesson) {
      return <LessonCard lesson={lesson} onShowNotes={handleShowNotes} />;
    }

    // Caso de respaldo por si algo más falla
    return <p className='info-text'>No hay contenido para mostrar.</p>;
  };

  return (
    <div className='lesson-detail-page-wrapper section-container'>
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

      {/* El MessageDisplay sigue siendo útil para mensajes globales como "Cargando audio..." */}
      <MessageDisplay
        message={appGlobalMessage}
        isLoading={appIsLoading || isLoadingLesson}
      />

      {/* El contenido principal se renderiza aquí */}
      {renderContent()}
    </div>
  );
};

export default LessonDisplayPage;
