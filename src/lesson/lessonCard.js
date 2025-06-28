// src/lesson/LessonCard.js
import React from "react";
import "./PrincipalPageLessons.css"; // Los estilos para las lecciones compartidos

const LessonCard = ({ lesson, onBack }) => {
  if (!lesson) {
    return (
      <div className='lesson-detail-view section-container'>
        <p className='info-text'>
          No se ha seleccionado ninguna lección para mostrar.
        </p>
        <button onClick={onBack} className='button back-button'>
          Volver a las Lecciones
        </button>
      </div>
    );
  }

  return (
    <div className='lesson-detail-view section-container'>
      <h2 className='section-title'>Lección: {lesson.Title}</h2>
      <p className='lesson-meta-info'>
        <strong>Tema:</strong> {lesson.Topic} |<strong>Dificultad:</strong>{" "}
        {lesson.Difficulty} |<strong>Fecha:</strong>{" "}
        {new Date(lesson.GeneratedDate).toLocaleDateString()}
      </p>
      <p className='lesson-description'>{lesson.Description}</p>

      <h3 className='subsection-title'>Ejercicios:</h3>
      <div className='exercises-list'>
        {lesson.exercises && lesson.exercises.length > 0 ? (
          lesson.exercises.map((exercise, index) => (
            <div key={exercise.ExerciseID || index} className='exercise-item'>
              <p className='exercise-question'>
                <strong>{index + 1}.</strong> {exercise.QuestionEN}
              </p>
              <p className='exercise-answer'>
                <strong>Respuesta:</strong> {exercise.AnswerES}
              </p>
              {exercise.OptionsES && exercise.OptionsES.length > 0 && (
                <p className='exercise-options'>
                  <strong>Opciones:</strong>{" "}
                  {
                    Array.isArray(exercise.OptionsES)
                      ? exercise.OptionsES.join(", ")
                      : exercise.OptionsES // Si no es array, ya es el string
                  }
                </p>
              )}
              {exercise.Notes && (
                <p className='exercise-notes'>
                  <strong>Notas:</strong> {exercise.Notes}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className='info-text'>Esta lección no tiene ejercicios.</p>
        )}
      </div>

      <button
        onClick={onBack}
        className='button back-button return-to-list-button'
      >
        Volver a la lista de lecciones
      </button>
    </div>
  );
};

export default LessonCard;
