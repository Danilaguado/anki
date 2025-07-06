// src/lesson/PrincipalPageLessons.js
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import MessageDisplay from "../components/MessageDisplay";
import AppContext from "../context/AppContext";

const PrincipalPageLessons = () => {
  const navigate = useNavigate();
  const { setAppMessage, setAppIsLoading } = useContext(AppContext);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]);

  useEffect(() => {
    const fetchExistingLessons = async () => {
      setIsLoading(true);
      setAppIsLoading(true);
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
    // ✅ CAMBIO CLAVE: Se eliminan las dependencias. Este efecto solo
    // debe ejecutarse una vez, cuando el componente se monta por primera vez.
  }, []);

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
          <p className='info-text'>No hay lecciones disponibles.</p>
        ) : (
          <div className='lessons-buttons-grid'>
            {availableLessons.map((lesson) => (
              <Link
                key={lesson.LessonID}
                to={`/lessons/${lesson.LessonID}`}
                className='button lesson-list-button'
                title={lesson.Description}
              >
                {lesson.Title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrincipalPageLessons;
