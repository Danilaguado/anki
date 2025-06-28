// src/lesson/components/ExerciseNavigation.js
import React from "react";

const ExerciseNavigation = ({
  currentExerciseIndex,
  totalExercises,
  onNextExercise,
  onPrevExercise,
  matchFeedback, // Para deshabilitar "Siguiente" condicionalmente
  currentExerciseType, // Para saber si el ejercicio actual requiere respuesta
}) => {
  // Define si el tipo de ejercicio actual requiere una respuesta antes de avanzar
  const requiresAnswer = [
    "fill_in_the_blank",
    "multiple_choice",
    "listening",
  ].includes(currentExerciseType);

  return (
    <div className='navigation-buttons-group'>
      <button
        onClick={onPrevExercise}
        className='button nav-button prev'
        disabled={currentExerciseIndex === 0}
      >
        Anterior
      </button>
      <div className='card-counter'>
        Ejercicio {currentExerciseIndex + 1} de {totalExercises}
      </div>
      <button
        onClick={onNextExercise}
        className='button nav-button next'
        // Deshabilitar el botón "Siguiente" si es el último y requiere respuesta pero no se ha dado feedback
        disabled={
          currentExerciseIndex === totalExercises - 1 &&
          requiresAnswer &&
          matchFeedback === null
        }
      >
        Siguiente
      </button>
    </div>
  );
};

export default ExerciseNavigation;
