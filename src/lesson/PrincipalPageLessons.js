// src/lesson/PrincipalPageLessons.js
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom"; // No se necesita useNavigate aquí
import MessageDisplay from "../components/MessageDisplay";
import LessonCard from "./components/lessonCard"; // Importación de LessonCard

// Importar el contexto
import AppContext from "../context/AppContext";

const PrincipalPageLessons = () => {
  // Consumir valores del contexto
  const { setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // Estados para la carga, errores y las lecciones disponibles (locales a este componente)
  const [isLoading, setIsLoading] = useState(false); // Estado de carga local del componente
  const [message, setMessage] = useState(""); // Mensajes locales de este componente
  const [error, setError] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]); // Todas las lecciones cargadas/generadas
  const [selectedLesson, setSelectedLesson] = useState(null); // La lección actualmente seleccionada para ver en detalle

  // --- ESTADOS PARA EL POP-UP DE NOTAS (gestionados aquí para el botón de cerrar) ---
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesContent, setNotesContent] = useState("");

  // Efecto para cargar las lecciones existentes al montar el componente
  useEffect(() => {
    const fetchExistingLessons = async () => {
      setIsLoading(true);
      setAppIsLoading(true); // Indicar a la App principal que hay carga global
      setMessage("Cargando lecciones existentes...");
      setError(null);
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
        if (result.success) {
          setAvailableLessons(result.lessons);
          setMessage("Lecciones cargadas.");
        } else {
          setError(result.error || "Error desconocido al cargar lecciones.");
        }
      } catch (err) {
        console.error("Error al cargar lecciones existentes:", err);
        setError(`Error al cargar lecciones: ${err.message}.`);
      } finally {
        setIsLoading(false);
        setAppIsLoading(false);
      }
    };

    fetchExistingLessons();
  }, [setAppMessage, setAppIsLoading]); // Dependencias para evitar alertas

  // Función para manejar la selección de una lección del listado
  const handleSelectLesson = (lessonId) => {
    const lessonToView = availableLessons.find((l) => l.LessonID === lessonId);
    setSelectedLesson(lessonToView); // Establece la lección seleccionada
    setMessage(""); // Limpiar mensajes al cambiar de vista
    setError(null);
  };

  // Función para volver a la lista de lecciones (se pasa a LessonCard)
  const handleBackToLessonList = () => {
    setSelectedLesson(null); // Limpia la lección seleccionada para volver a la lista
    setMessage("");
    setError(null);
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
      {/* El botón de volver a la pantalla principal se maneja con BottomNavigationBar */}
      <h1 className='app-title'>Lecciones</h1>
      {/* El texto introductorio ya no es necesario */}

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

      <MessageDisplay message={message} isLoading={isLoading} />
      {error && (
        <div className='message-box error-box' role='alert'>
          <span className='message-text'>{error}</span>
        </div>
      )}

      {/* Renderizado condicional: Mostrar LessonCard si hay una lección seleccionada */}
      {selectedLesson ? (
        // Si hay una lección seleccionada, la mostramos con LessonCard
        <LessonCard
          lesson={selectedLesson}
          onBack={handleBackToLessonList} // Pasa la función de volver a la lista
          onShowNotes={handleShowNotes} // Pasa la función para mostrar notas
        />
      ) : (
        // Si no hay lección seleccionada, mostrar la lista de lecciones disponibles
        <>
          <div className='section-container available-lessons-list'>
            <h2 className='section-title'>Lecciones Disponibles</h2>
            {isLoading && availableLessons.length === 0 ? (
              <p className='info-text'>Cargando lecciones...</p>
            ) : availableLessons.length === 0 ? (
              <p className='info-text'>
                No hay lecciones disponibles. Por favor, crea algunas en tu
                Google Sheet.
              </p>
            ) : (
              <div className='lessons-buttons-grid'>
                {availableLessons.map((lesson) => (
                  <button
                    key={lesson.LessonID}
                    onClick={() => handleSelectLesson(lesson.LessonID)}
                    className='button lesson-list-button'
                    title={lesson.Description}
                  >
                    {lesson.Title} ({lesson.Difficulty}) -{" "}
                    {lesson.TypeModule === "chatbot_lesson"
                      ? "Chatbot"
                      : "Estándar"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PrincipalPageLessons;
