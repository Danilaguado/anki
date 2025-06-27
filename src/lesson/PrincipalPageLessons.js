// src/lesson/PrincipalPageLessons.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import MessageDisplay from "../components/MessageDisplay"; // Importar MessageDisplay

const PrincipalPageLessons = () => {
  // Estados para los parámetros de generación de la lección
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Principiante"); // Default a principiante
  const [exerciseCount, setExerciseCount] = useState(3); // Default a 3 ejercicios
  const [exerciseTypes, setExerciseTypes] = useState(["translation"]); // Default a traducción
  const [customPrompt, setCustomPrompt] = useState("");

  // Estados para la carga, errores y la lección generada
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null); // <-- ¡Añadido! Estado para manejar errores
  const [generatedLesson, setGeneratedLesson] = useState(null); // Almacenará el objeto completo de la lección generada

  /**
   * Maneja la generación de la lección llamando al endpoint del backend.
   */
  const handleGenerateLesson = async () => {
    setMessage("");
    setError(null); // Limpiar errores previos
    setIsLoading(true);
    setGeneratedLesson(null); // Limpiar la lección anterior

    try {
      // Validaciones básicas del frontend
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
        setGeneratedLesson(result.data); // Almacena el objeto completo de la lección
        setMessage(result.message);
      } else {
        setError(result.error || "Error desconocido al generar la lección."); // Usar setError
        setMessage(""); // Limpiar mensaje si hay error específico
      }
    } catch (error) {
      console.error("Error al generar lección:", error);
      setError(`Error al generar lección: ${error.message}.`); // Usar setError
      setMessage(""); // Limpiar mensaje si hay error específico
      setGeneratedLesson(null); // Asegurarse de que no se muestre una lección parcial
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

  return (
    <div className='lessons-page-wrapper app-container'>
      <h1 className='app-title'>Generador de Lecciones</h1>
      <p className='info-text'>
        Genera lecciones personalizadas con la ayuda de la IA.
      </p>
      {/* Mostrar mensajes de carga o error */}
      <MessageDisplay message={message} isLoading={isLoading} />
      {error && (
        <div className='message-box' role='alert'>
          <span className='message-text'>{error}</span>
        </div>
      )}{" "}
      {/* Mostrar el error */}
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
            onChange={(e) => setExerciseCount(parseInt(e.target.value) || 0)}
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
            {/* Puedes añadir más tipos según lo que Gemini pueda generar */}
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
      {/* Sección para mostrar la lección generada */}
      {generatedLesson && generatedLesson.lesson && (
        <div className='section-container generated-lesson-display'>
          <h2 className='section-title'>
            Lección Generada: {generatedLesson.lesson.Title}
          </h2>
          <p className='info-text'>
            **Tema:** {generatedLesson.lesson.Topic} | **Dificultad:**{" "}
            {generatedLesson.lesson.Difficulty}
          </p>
          <p className='info-text'>
            **Descripción:** {generatedLesson.lesson.Description}
          </p>

          <h3 className='subsection-title'>Ejercicios:</h3>
          <div className='exercises-list'>
            {generatedLesson.exercises &&
            generatedLesson.exercises.length > 0 ? (
              generatedLesson.exercises.map((exercise, index) => (
                <div
                  key={exercise.ExerciseID || index}
                  className='exercise-item'
                >
                  <p className='exercise-question'>
                    **{index + 1}.** {exercise.questionEN}
                  </p>
                  <p className='exercise-answer'>
                    **Respuesta:** {exercise.answerES}
                  </p>
                  {exercise.optionsES && exercise.optionsES.length > 0 && (
                    <p className='exercise-options'>
                      **Opciones:** {exercise.optionsES.join(", ")}
                    </p>
                  )}
                  {exercise.notes && (
                    <p className='exercise-notes'>
                      **Notas:** {exercise.notes}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className='info-text'>
                No se generaron ejercicios para esta lección.
              </p>
            )}
          </div>
        </div>
      )}
      <Link to='/' className='button back-button'>
        Volver a la pantalla principal
      </Link>
    </div>
  );
};

export default PrincipalPageLessons;
