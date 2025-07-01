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
  const [exerciseCount, setExerciseCount] = useState(12); // Valor por defecto: 12 ejercicios
  const [customPrompt, setCustomPrompt] = useState("");
  // NUEVO: Estado para el tipo de módulo seleccionado
  const [selectedModuleType, setSelectedModuleType] =
    useState("standard_lesson"); // 'standard_lesson' o 'chatbot_lesson'

  // Estados para la carga, errores y las lecciones disponibles (locales a este componente)
  const [isLoading, setIsLoading] = useState(false); // Estado de carga local del componente
  const [message, setMessage] = useState(""); // Mensajes locales de este componente
  const [error, setError] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]); // Todas las lecciones cargadas/generadas
  const [selectedLesson, setSelectedLesson] = useState(null); // La lección actualmente seleccionada para ver en detalle

  // --- Bandera temporal para generar solo un módulo (se mantiene para tu uso) ---
  const GENERATE_SINGLE_MODULE_TEMPORARILY = true;

  // Define el orden y tipos exactos de los 12 ejercicios para LECCIONES ESTÁNDAR
  const EXERCISE_ORDER_SCHEMA_STANDARD = [
    "multiple_choice", // 1. Selección simple (con Notes explicativas para la palabra clave)
    "multiple_choice", // 2. Selección simple
    "multiple_choice", // 3. Selección simple
    "fill_in_the_blank", // 4. Autocompletar
    "fill_in_the_blank", // 5. Autocompletar
    "fill_in_the_blank", // 6. Autocompletar
    "translation", // 7. Traducción
    "translation", // 8. Traducción
    "translation", // 9. Traducción
    "listening", // 10. Escucha
    "listening", // 11. Escucha
    "listening", // 12. Escucha
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

      // --- Lógica de generación según el tipo de módulo seleccionado ---
      if (selectedModuleType === "standard_lesson") {
        if (GENERATE_SINGLE_MODULE_TEMPORARILY || !isVerb(baseTopic)) {
          topicsToGenerate.push({
            topic: baseTopic,
            customPromptSuffix:
              "Ensure vocabulary is introduced before use, provide learning-oriented questions, and follow the specified exercise order strictly.",
          });
        } else {
          // Es un verbo y GENERATE_SINGLE_MODULE_TEMPORARILY es false
          for (const tense of VERB_TENSES) {
            topicsToGenerate.push({
              topic: `${baseTopic} (${tense.name})`,
              customPromptSuffix: `Focus on the verb "${baseTopic}" ${tense.promptSuffix}. Ensure vocabulary is introduced before use, provide learning-oriented questions, and follow the specified exercise order strictly.`,
            });
          }
        }
      } else if (selectedModuleType === "chatbot_lesson") {
        topicsToGenerate.push({
          topic: baseTopic,
          customPromptSuffix:
            "Generate a conversational scenario. Ensure vocabulary is introduced before use, provide learning-oriented questions, and follow the specified exercise order strictly.",
        });
      }

      // Loop para generar lecciones (una o varias)
      for (const genConfig of topicsToGenerate) {
        const currentTopic = genConfig.topic;
        const currentCustomPrompt = genConfig.customPromptSuffix;
        const exercisesGeneratedCount = 12; // Siempre 12 ejercicios

        setMessage(`Generando lección para: ${currentTopic}...`);

        const response = await fetch("/api/generate-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: currentTopic,
            difficulty,
            exerciseCount: exercisesGeneratedCount,
            exerciseTypes:
              selectedModuleType === "standard_lesson"
                ? EXERCISE_ORDER_SCHEMA_STANDARD
                : [], // Pasa el esquema solo para estándar, el chatbot lo define el backend
            customPrompt: currentCustomPrompt,
            moduleType: selectedModuleType, // ¡NUEVO! Pasa el tipo de módulo
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
          generatedLessons.push(result.data.lesson);
        } else {
          setError(
            result.error ||
              `Error desconocido al generar la lección para ${currentTopic}.`
          );
          setMessage("");
        }
      }

      // Una vez que todas las lecciones se hayan intentado generar:
      if (generatedLessons.length > 0) {
        const refreshResponse = await fetch("/api/lessons/get-all");
        const refreshResult = await refreshResponse.json();
        if (refreshResult.success) {
          setAvailableLessons(refreshResult.lessons);
          setMessage(
            `Se han generado ${generatedLessons.length} lección(es) y se han añadido a la lista.`
          );
          // NO SELECCIONAR AUTOMÁTICAMENTE: solo recargar la lista
          setSelectedLesson(null); // Asegura que la vista vuelva a la lista
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

  // Manejador para el cambio de tipo de módulo
  const handleModuleTypeChange = (e) => {
    setSelectedModuleType(e.target.value);
    // Reiniciar topic y customPrompt al cambiar el tipo de módulo si es necesario
    setTopic("");
    setCustomPrompt("");
  };

  const handleSelectLesson = (lessonId) => {
    const lessonToView = availableLessons.find((l) => l.LessonID === lessonId);
    setSelectedLesson(lessonToView);
    setMessage("");
    setError(null);
  };

  const handleBackToLessonList = () => {
    setSelectedLesson(null);
    setMessage("");
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

            {/* NUEVO: Selección del tipo de módulo */}
            <div className='input-group-vertical'>
              <label htmlFor='module-type-select' className='input-label'>
                Tipo de Módulo:
              </label>
              <select
                id='module-type-select'
                className='input-field'
                value={selectedModuleType}
                onChange={handleModuleTypeChange}
                disabled={isLoading}
              >
                <option value='standard_lesson'>Lección Estándar</option>
                <option value='chatbot_lesson'>Lección Chatbot</option>
              </select>
            </div>

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

            {/* Mostrar el esquema de ejercicios solo para lección estándar */}
            {selectedModuleType === "standard_lesson" && (
              <div className='input-group-vertical'>
                <span className='input-label'>
                  Tipos de Ejercicio (Orden Fijo):
                </span>
                <div className='checkbox-group'>
                  {EXERCISE_ORDER_SCHEMA_STANDARD.map((type, index) => (
                    <span key={index} className='exercise-type-tag'>
                      {index + 1}.{" "}
                      {type
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje adicional para el usuario sobre el número de ejercicios */}
            <p className='info-text small-text'>
              {selectedModuleType === "standard_lesson"
                ? `Se generarán ${EXERCISE_ORDER_SCHEMA_STANDARD.length} ejercicios siguiendo el orden predefinido.`
                : `Se generarán ${exerciseCount} ejercicios para el chatbot, con el primer ejercicio siendo el diálogo.`}
              <br />
              {selectedModuleType === "standard_lesson" &&
                `Si ingresas un verbo, se generará una lección separada para cada tiempo verbal.`}
              <br />
              **Nota**: La generación de una única lección por tema/verbo está
              actualmente activa para facilitar ajustes. Desactiva
              `GENERATE_SINGLE_MODULE_TEMPORARILY` en el código para la
              generación de múltiples lecciones de verbos.
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
                No hay lecciones guardadas. Por favor, genera algunas desde el
                backend.
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
