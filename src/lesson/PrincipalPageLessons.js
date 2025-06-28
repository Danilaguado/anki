// src/lesson/PrincipalPageLessons.js
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import MessageDisplay from "../components/MessageDisplay";
import LessonCard from "./lessonCard";

// Importar el contexto
import AppContext from "../context/AppContext";

const PrincipalPageLessons = () => {
  // Consumir valores del contexto
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  // Estados para los parámetros de generación de la lección
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Principiante");
  const [exerciseCount, setExerciseCount] = useState(10); // Valor por defecto: 10 ejercicios
  const [exerciseTypes, setExerciseTypes] = useState([
    "translation",
    "multiple_choice",
    "fill_in_the_blank",
    "listening",
  ]); // Por defecto todos los tipos
  const [customPrompt, setCustomPrompt] = useState("");

  // Estados para la carga, errores y las lecciones disponibles (locales a este componente)
  const [isLoading, setIsLoading] = useState(false); // Estado de carga local del componente
  const [message, setMessage] = useState(""); // Mensajes locales de este componente
  const [error, setError] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]); // Todas las lecciones cargadas/generadas
  const [selectedLesson, setSelectedLesson] = useState(null); // La lección actualmente seleccionada para ver en detalle

  // Define el orden de los ejercicios
  const EXERCISE_ORDER_SCHEMA = [
    "multiple_choice", // 1. Selección simple (junto con la explicación de Notes)
    "fill_in_the_blank", // 2. Autocompletar
    "translation", // 3. Traducción
    "translation", // 4. Traducción
    "listening", // 5. Escucha
    "fill_in_the_blank", // 6. Autocompletar
    "fill_in_the_blank", // 7. Autocompletar
    "listening", // 8. Escucha
    "translation", // 9. Traducción
    "multiple_choice", // 10. Selección simple
  ];

  // Define los tiempos verbales si el usuario introduce un verbo
  const VERB_TENSES = [
    { name: "Infinitivo", promptSuffix: "in infinitive form" },
    { name: "Presente Simple", promptSuffix: "in simple present tense" },
    { name: "Pasado Simple", promptSuffix: "in simple past tense" },
    { name: "Participio Pasado", promptSuffix: "in past participle form" },
    { name: "Gerundio", promptSuffix: "in gerund form (present participle)" },
    { name: "Futuro Simple", promptSuffix: "in simple future tense" },
  ];

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
  }, []);

  /**
   * Determina si la entrada es probablemente un verbo único.
   * Simplificación para el ejemplo. Podría ser más robusto con una lista de verbos.
   */
  const isVerb = (input) => {
    input = input.trim().toLowerCase();
    // Revisa si es una sola palabra y termina en algo que suene a verbo común
    return (
      input.split(" ").length === 1 &&
      (input.endsWith("e") ||
        input.endsWith("t") ||
        input.endsWith("k") ||
        input.endsWith("n") ||
        input.endsWith("y") ||
        input.endsWith("m") ||
        [
          "go",
          "have",
          "do",
          "say",
          "get",
          "make",
          "see",
          "know",
          "think",
          "take",
          "come",
          "give",
          "tell",
          "feel",
          "find",
          "call",
        ].includes(input))
    );
  };

  /**
   * Maneja la generación de la lección llamando al endpoint del backend.
   */
  const handleGenerateLesson = async () => {
    setMessage("");
    setError(null);
    setIsLoading(true);
    setAppIsLoading(true);

    let generatedLessons = [];
    let topicsToGenerate = [];
    const baseTopic = topic.trim();

    try {
      // Validación inicial
      if (!baseTopic) {
        setAppMessage(
          "El tema no puede estar vacío. Por favor, ingresa un tema o verbo para la lección."
        );
        setIsLoading(false);
        setAppIsLoading(false);
        return;
      }

      // Determinar si es un verbo y configurar la generación
      if (isVerb(baseTopic)) {
        // Si es un verbo, creamos una lección por cada tiempo verbal
        for (const tense of VERB_TENSES) {
          topicsToGenerate.push({
            topic: `${baseTopic} (${tense.name})`,
            customPromptSuffix: `Focus on the verb "${baseTopic}" ${tense.promptSuffix}. Ensure exercises introduce vocabulary before requiring it as an answer.`,
          });
        }
      } else {
        // Si es un tema general, generamos solo una lección
        topicsToGenerate.push({
          topic: baseTopic,
          customPromptSuffix:
            "Ensure exercises introduce vocabulary before requiring it as an answer.",
        });
      }

      // Loop para generar lecciones (una o varias)
      for (const genConfig of topicsToGenerate) {
        const currentTopic = genConfig.topic;
        const currentCustomPrompt = genConfig.customPromptSuffix;
        const exercisesGeneratedCount = EXERCISE_ORDER_SCHEMA.length; // Siempre 10 ejercicios según el esquema

        setMessage(`Generando lección para: ${currentTopic}...`);

        const response = await fetch("/api/generate-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: currentTopic,
            difficulty,
            exerciseCount: exercisesGeneratedCount,
            exerciseTypes: EXERCISE_ORDER_SCHEMA, // Pasamos el esquema de orden directamente
            customPrompt: currentCustomPrompt,
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
          generatedLessons.push(result.data.lesson); // Solo guardar la lección, no los ejercicios aquí
          // setAvailableLessons(prevLessons => [result.data.lesson, ...prevLessons]); // Actualizar la lista al instante
          // setSelectedLesson(result.data.lesson); // Opcional: mostrar la primera generada
        } else {
          setError(
            result.error ||
              `Error desconocido al generar la lección para ${currentTopic}.`
          );
          setMessage("");
          // No lanzar error aquí para permitir que otras lecciones se generen
        }
      }

      // Una vez que todas las lecciones se hayan intentado generar:
      if (generatedLessons.length > 0) {
        // Refrescar la lista completa de lecciones desde el backend para incluir todas las nuevas
        const refreshResponse = await fetch("/api/lessons/get-all");
        const refreshResult = await refreshResponse.json();
        if (refreshResult.success) {
          setAvailableLessons(refreshResult.lessons);
          setMessage(
            `Se han generado ${generatedLessons.length} lección(es) y se han añadido a la lista.`
          );
          // Opcional: seleccionar la primera lección generada para mostrar
          if (generatedLessons.length === 1) {
            setSelectedLesson(generatedLessons[0]);
          } else if (generatedLessons.length > 1) {
            // Si se generaron múltiples, no se selecciona ninguna automáticamente, se muestra la lista.
            setSelectedLesson(null);
          }
        } else {
          setMessage(
            "Lecciones generadas, pero hubo un error al recargar la lista."
          );
          console.error(
            "Error al recargar lecciones después de generar:",
            refreshResult.error
          );
        }
      } else {
        setError(
          "No se pudo generar ninguna lección. Revisa el prompt o la configuración de Gemini."
        );
        setMessage("");
      }
    } catch (error) {
      console.error("Error general al generar lección(es):", error);
      setError(`Error general al generar lección(es): ${error.message}.`);
      setMessage("");
      setSelectedLesson(null);
    } finally {
      setIsLoading(false);
      setAppIsLoading(false);
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
                Tema o Verbo (Ej: Animales, Viajes, Get):
              </label>
              <input
                id='topic-input'
                type='text'
                className='input-field'
                placeholder='Ej: Animales, Viajes, Comida, Get'
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

            {/* La cantidad de ejercicios y los tipos ya no se eligen, se fijan por el esquema */}
            {/* <div className='input-group-vertical'>
              <label htmlFor='exercise-count-input' className='input-label'>Cantidad de Ejercicios:</label>
              <input
                id='exercise-count-input'
                type='number'
                className='input-field'
                min='1'
                value={exerciseCount}
                onChange={(e) => setExerciseCount(parseInt(e.target.value) || 0)}
                disabled={isLoading}
              />
            </div> */}

            <div className='input-group-vertical'>
              <span className='input-label'>
                Tipos de Ejercicio (Orden Fijo):
              </span>
              <div className='checkbox-group'>
                {EXERCISE_ORDER_SCHEMA.map((type, index) => (
                  <span key={index} className='exercise-type-tag'>
                    {index + 1}.{" "}
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                    {/* Formatear para mostrar */}
                  </span>
                ))}
              </div>
            </div>
            {/* Mensaje adicional para el usuario sobre el número de ejercicios */}
            <p className='info-text small-text'>
              Se generarán {EXERCISE_ORDER_SCHEMA.length} ejercicios siguiendo
              el orden predefinido. Si ingresas un verbo, se generará una
              lección separada para cada tiempo verbal.
            </p>

            <div className='input-group-vertical'>
              <label htmlFor='custom-prompt-textarea' className='input-label'>
                Prompt Personalizado (Opcional - solo para el tema inicial):
              </label>
              <textarea
                id='custom-prompt-textarea'
                className='input-field textarea-field'
                rows='4'
                placeholder="Añade instrucciones específicas para la IA, ej. 'enfócate en verbos irregulares' (no aplica para conjugaciones)"
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
              {isLoading ? "Generando Lección(es)..." : "Generar con IA"}
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
