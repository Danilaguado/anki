// src/lesson/components/ChatbotLessonRawDisplay.js
// Este componente muestra los ejercicios de una lección chatbot de forma cruda, uno debajo del otro.
// Es útil para depuración y para verificar que todos los datos se cargan correctamente.

import React from "react";

const ChatbotLessonRawDisplay = ({ lessonExercises }) => {
  if (!lessonExercises || lessonExercises.length === 0) {
    return <p>No hay ejercicios para esta lección de chatbot.</p>;
  }

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "15px",
        margin: "20px 0",
        backgroundColor: "#f9f9f9",
        maxHeight: "600px", // Limita la altura para que haya scroll
        overflowY: "auto", // Permite scroll vertical
      }}
    >
      <h3 style={{ textAlign: "center", color: "#333" }}>
        Contenido Crudo de Lección Chatbot
      </h3>
      <p style={{ textAlign: "center", fontSize: "0.9em", color: "#666" }}>
        (Esto es solo para depuración. Muestra todos los ejercicios de la
        lección uno debajo del otro.)
      </p>
      <hr style={{ borderTop: "1px dashed #ddd", margin: "15px 0" }} />

      {lessonExercises.map((exercise, index) => (
        <div
          key={exercise.ExerciseID || index}
          style={{
            marginBottom: "20px",
            paddingBottom: "10px",
            borderBottom: "1px solid #eee",
            fontSize: "0.9em",
            wordBreak: "break-word", // Para que el texto largo no desborde
          }}
        >
          <h4 style={{ color: "#007bff", marginBottom: "5px" }}>
            Ejercicio {index + 1} - Tipo: {exercise.Type} (Orden:{" "}
            {exercise.OrderInLesson})
          </h4>
          <pre
            style={{
              backgroundColor: "#e9e9e9",
              padding: "10px",
              borderRadius: "5px",
              whiteSpace: "pre-wrap", // Para que el texto se envuelva
            }}
          >
            {JSON.stringify(exercise, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};

export default ChatbotLessonRawDisplay;
