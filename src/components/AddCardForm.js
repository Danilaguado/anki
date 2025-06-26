// src/components/AddCardForm.js
import React from "react";
import "./AddCardForm.css";

const AddCardForm = ({
  currentCategory,
  newCardQuestion,
  newCardAnswer,
  isLoading,
  onNewCardQuestionChange,
  onNewCardAnswerChange,
  onAddCardManually,
  onNavigateToHome,
}) => {
  return (
    <div className='main-content-wrapper'>
      <div className='section-container'>
        <h2 className='section-title'>
          Añadir Tarjetas a "{currentCategory?.name || "..."}"
        </h2>

        <h3 className='subsection-title'>Añadir Manualmente:</h3>
        <div className='input-group-vertical'>
          <input
            type='text'
            className='input-field'
            placeholder='Pregunta (Inglés)'
            value={newCardQuestion}
            onChange={(e) => onNewCardQuestionChange(e.target.value)}
            disabled={isLoading}
          />
          <input
            type='text'
            className='input-field'
            placeholder='Respuesta (Español)'
            value={newCardAnswer}
            onChange={(e) => onNewCardAnswerChange(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={onAddCardManually}
            className='button add-card-button'
            disabled={isLoading}
          >
            Añadir Tarjeta Manualmente
          </button>
        </div>
        <button
          onClick={onNavigateToHome}
          className='button back-button'
          disabled={isLoading}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default AddCardForm;
