// src/lesson/PrincipalPageLessons.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MessageDisplay from "../components/MessageDisplay";
import LessonCard from "./lessonCard"; // Importar el nuevo componente LessonCard

const PrincipalPageLessons = () => {
  // Estados para los parámetros de generación de la lección
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Principiante");
  const [exerciseCount, setExerciseCount] = useState(3);
  const [exerciseTypes, setExerciseTypes] = useState(["translation"]);
  const [customPrompt, setCustomPrompt] = useState("");

  // Estados para la carga, errores y las lecciones disponibles
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]); // Todas las lecciones cargadas/generadas
  const [selectedLesson, setSelectedLesson] = useState(null); // La lección actualmente seleccionada para ver en detalle
  const [generatedLesson, setGeneratedLesson] = useState(null); // <-- ¡Añadido! Estado para la lección recién generada

  // Efecto para cargar las lecciones existentes al montar el componente
  useEffect(() => {
    const fetchExistingLessons = async () => {
      setIsLoading(true);
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
      }
    };

    fetchExistingLessons();
  }, []); // Se ejecuta una vez al montar

  /**
   * Maneja la generación de la lección llamando al endpoint del backend.
   */
  const handleGenerateLesson = async () => {
    setMessage("");
    setError(null);
    setIsLoading(true);
    setGeneratedLesson(null); // Limpiar la lección anterior si ya existe

    try {
      if (!topic.trim()) {
        setMessage("Por favor, ingresa un tema para la lección.");
        setIsLoading(false);
        return;
      }
      if (exerciseCount < 1) {
        setMessage("El número de ejercicios debe ser al menos 1.");
        setIsLoading(false);
        return;
      }
      if (exerciseTypes.length === 0) {
        setMessage("Debes seleccionar al menos un tipo de ejercicio.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          exerciseCount,
          exerciseTypes,
          customPrompt: customPrompt.trim(),
        }),
      });

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
        // Añadir la nueva lección a la lista de lecciones disponibles
        setAvailableLessons((prevLessons) => [
          result.data.lesson,
          ...prevLessons,
        ]);
        setSelectedLesson(result.data.lesson); // Seleccionar la lección recién generada para mostrarla
        setMessage(result.message);
      } else {
        setError(result.error || "Error desconocido al generar la lección.");
        setMessage("");
      }
    } catch (error) {
      console.error("Error al generar lección:", error);
      setError(`Error al generar lección: ${error.message}.`);
      setMessage("");
      setSelectedLesson(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExerciseTypeChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setExerciseTypes((prev) => [...prev, value]);
    } else {
      setExerciseTypes((prev) => prev.filter((type) => type !== value));
    }
  };

  // Función para manejar la selección de una lección del listado
  const handleSelectLesson = (lessonId) => {
    const lessonToView = availableLessons.find((l) => l.LessonID === lessonId);
    setSelectedLesson(lessonToView);
    setMessage(""); // Limpiar mensajes al cambiar de vista
    setError(null);
  };

  // Función para volver a la lista de lecciones (desde LessonCard)
  const handleBackToLessonList = () => {
    setSelectedLesson(null);
    setMessage(""); // Limpiar mensajes al volver
    setError(null);
  };

  return (
    <div className='lessons-page-wrapper app-container'>
      <Link to='/' className='button back-button top-back-button'>
        Volver a la pantalla principal
      </Link>
      <h1 className='app-title'>Generador de Lecciones</h1>
      <p className='info-text'>
        Genera lecciones personalizadas con la ayuda de la IA.
      </p>

      {/* Mostrar mensajes de carga o error */}
      <MessageDisplay message={message} isLoading={isLoading} />
      {error && (
        <div className='message-box error-box' role='alert'>
          <span className='message-text'>{error}</span>
        </div>
      )}

      {/* Renderizado condicional: Mostrar LessonCard si hay una lección seleccionada */}
      {selectedLesson ? (
        <LessonCard lesson={selectedLesson} onBack={handleBackToLessonList} />
      ) : (
        // Si no hay lección seleccionada, mostrar el formulario de generación y la lista de lecciones
        <>
          <div className='section-container lesson-generator-form'>
            <h2 className='section-title'>Parámetros de la Lección</h2>

            <div className='input-group-vertical'>
              <label htmlFor='topic-input' className='input-label'>
                Tema:
              </label>
              <input
                id='topic-input'
                type='text'
                className='input-field'
                placeholder='Ej: Animales, Viajes, Comida'
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className='input-group-vertical'>
              <label htmlFor='difficulty-select' className='input-label'>
                Dificultad:
              </label>
              <select
                id='difficulty-select'
                className='input-field'
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isLoading}
              >
                <option value='Principiante'>Principiante</option>
                <option value='Intermedio'>Intermedio</option>
                <option value='Avanzado'>Avanzado</option>
              </select>
            </div>

            <div className='input-group-vertical'>
              <label htmlFor='exercise-count-input' className='input-label'>
                Cantidad de Ejercicios:
              </label>
              <input
                id='exercise-count-input'
                type='number'
                className='input-field'
                min='1'
                value={exerciseCount}
                onChange={(e) =>
                  setExerciseCount(parseInt(e.target.value) || 0)
                }
                disabled={isLoading}
              />
            </div>

            <div className='input-group-vertical'>
              <span className='input-label'>Tipos de Ejercicio:</span>
              <div className='checkbox-group'>
                <label>
                  <input
                    type='checkbox'
                    value='translation'
                    checked={exerciseTypes.includes("translation")}
                    onChange={handleExerciseTypeChange}
                    disabled={isLoading}
                  />{" "}
                  Traducción
                </label>
                <label>
                  <input
                    type='checkbox'
                    value='multiple_choice'
                    checked={exerciseTypes.includes("multiple_choice")}
                    onChange={handleExerciseTypeChange}
                    disabled={isLoading}
                  />{" "}
                  Opción Múltiple
                </label>
                <label>
                  <input
                    type='checkbox'
                    value='fill_in_the_blank'
                    checked={exerciseTypes.includes("fill_in_the_blank")}
                    onChange={handleExerciseTypeChange}
                    disabled={isLoading}
                  />{" "}
                  Completar Espacios
                </label>
              </div>
            </div>

            <div className='input-group-vertical'>
              <label htmlFor='custom-prompt-textarea' className='input-label'>
                Prompt Personalizado (Opcional):
              </label>
              <textarea
                id='custom-prompt-textarea'
                className='input-field textarea-field'
                rows='4'
                placeholder="Añade instrucciones específicas para la IA, ej. 'enfócate en verbos irregulares'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isLoading}
              ></textarea>
            </div>

            <button
              onClick={handleGenerateLesson}
              className='button primary-button generate-lesson-button'
              disabled={isLoading}
            >
              {isLoading ? "Generando..." : "Generar Lección"}
            </button>
          </div>

          <div className='section-container available-lessons-list'>
            <h2 className='section-title'>Lecciones Existentes</h2>
            {isLoading && availableLessons.length === 0 ? (
              <p className='info-text'>Cargando lecciones...</p>
            ) : availableLessons.length === 0 ? (
              <p className='info-text'>
                No hay lecciones guardadas. ¡Genera una para empezar!
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
                    {lesson.Title} ({lesson.Difficulty})
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
