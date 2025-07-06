// src/lesson/PrincipalPageLessons.js
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom"; // Importar useNavigate
import MessageDisplay from "../components/MessageDisplay";
import LessonCard from "./lessonCard";
// LessonCard ya no se importa ni se renderiza directamente aquí
// import LessonCard from './components/lessonCard';

// Importar el contexto
import AppContext from "../context/AppContext";

const PrincipalPageLessons = () => {
  const navigate = useNavigate(); // Hook para la navegación
  // Consumir valores del contexto
  const { setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // Estados para la carga, errores y las lecciones disponibles (locales a este componente)
  const [isLoading, setIsLoading] = useState(false); // Estado de carga local del componente
  const [message, setMessage] = useState(""); // Mensajes locales de este componente
  const [error, setError] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]); // Todas las lecciones cargadas/generadas
  // selectedLesson ya no se necesita aquí, la navegación lo gestiona
  // const [selectedLesson, setSelectedLesson] = useState(null);

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
          console.log(
            "DEBUG: PrincipalPageLessons - Lecciones cargadas del backend:",
            result.lessons
          ); // DEBUG
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
    // Navega a la página de la lección específica, pasando el ID en la URL.
    // Ya no se usa localStorage para esto.
    navigate(`/lessons/${lessonId}`);
    setMessage(""); // Limpiar mensajes al cambiar de vista
    setError(null);
  };

  // handleBackToLessonList ya no es necesario aquí, la navegación lo gestiona
  // const handleBackToLessonList = () => {
  //   setSelectedLesson(null);
  //   setMessage("");
  //   setError(null);
  // };

  return (
    <div className='lessons-page-wrapper app-container'>
      <MessageDisplay message={message} isLoading={isLoading} />
      {error && (
        <div className='message-box error-box' role='alert'>
          <span className='message-text'>{error}</span>
        </div>
      )}

      <div className='section-container available-lessons-list'>
        <h2 className='section-title'>Lecciones Disponibles</h2>
        {isLoading && availableLessons.length === 0 ? (
          <p className='info-text'>Cargando lecciones...</p>
        ) : availableLessons.length === 0 ? (
          <p className='info-text'>
            No hay lecciones disponibles. Por favor, crea algunas en tu Google
            Sheet.
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
    </div>
  );
};

export default PrincipalPageLessons;
