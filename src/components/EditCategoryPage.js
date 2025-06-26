// src/components/EditCategoryPage.js
import React, { useState, useEffect } from "react";

const EditCategoryPage = ({
  currentCategory, // La categoría a editar
  onSaveCategoryName, // Función para guardar el nombre de la categoría
  onUpdateCard, // Función para actualizar una tarjeta existente
  onAddCard, // Función para añadir una nueva tarjeta
  onDeleteCard, // Función para eliminar una tarjeta
  onNavigateHome, // Función para volver al inicio
  isLoading, // Estado de carga global de App.js
  setMessage, // Función para mostrar mensajes en App.js
  confirmDeleteCard, // Función para confirmar eliminación de tarjeta (del padre App.js)
}) => {
  // Estado local para el nombre de la categoría que se está editando
  const [editedCategoryName, setEditedCategoryName] = useState("");
  // Estado local para la lista de tarjetas que se están editando
  // Usamos una copia profunda para no modificar el estado original directamente
  const [editedCardsData, setEditedCardsData] = useState([]);

  // Estado para un nuevo campo de tarjeta (pregunta, respuesta, idiomas)
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [newCardLangQuestion, setNewCardLangQuestion] = useState("en-US"); // Default
  const [newCardLangAnswer, setNewCardLangAnswer] = useState("es-ES"); // Default

  // Cargar datos de la categoría y sus tarjetas cuando la categoría cambie
  useEffect(() => {
    if (currentCategory) {
      setEditedCategoryName(currentCategory.name);
      // Realizar una copia profunda de las tarjetas para editarlas localmente
      setEditedCardsData(
        currentCategory.cards
          ? JSON.parse(JSON.stringify(currentCategory.cards))
          : []
      );
    }
  }, [currentCategory]);

  // Manejar cambios en el nombre de la categoría
  const handleCategoryNameChange = (e) => {
    setEditedCategoryName(e.target.value);
  };

  // Manejar cambios en los campos de una tarjeta específica
  const handleCardFieldChange = (index, field, value) => {
    const updatedCards = [...editedCardsData];
    updatedCards[index][field] = value;
    setEditedCardsData(updatedCards);
  };

  // Guardar el nombre de la categoría y las tarjetas editadas
  const handleSave = async () => {
    setMessage("Guardando cambios...");
    // 1. Guardar el nombre de la categoría (si ha cambiado)
    if (editedCategoryName.trim() !== currentCategory.name.trim()) {
      await onSaveCategoryName(currentCategory.id, editedCategoryName.trim());
    }

    // 2. Procesar cambios en las tarjetas
    // Esto es un poco más complejo y podría hacerse con llamadas a la API de App.js
    // o procesar un array de cambios (añadidos, actualizados, eliminados)
    // Por simplicidad, llamaremos a las funciones de actualización/añadir/eliminar del padre.

    for (const card of editedCardsData) {
      if (card.id && !currentCategory.cards.some((oc) => oc.id === card.id)) {
        // Tarjeta nueva (podría ser si la añadimos y luego editamos su ID temporal) - poco probable con current logic
        // O más bien, la lógica de "añadir nueva tarjeta" se hace con un botón aparte.
        // Aquí solo actualizamos las que ya existían o fueron agregadas y aún no guardadas.
      } else if (card.id) {
        // Tarjeta existente, verificar si fue modificada
        const originalCard = currentCategory.cards.find(
          (oc) => oc.id === card.id
        );
        if (
          originalCard &&
          (originalCard.question !== card.question ||
            originalCard.answer !== card.answer ||
            originalCard.langQuestion !== card.langQuestion ||
            originalCard.langAnswer !== card.langAnswer)
        ) {
          await onUpdateCard(currentCategory.id, card.id, {
            question: card.question,
            answer: card.answer,
            langQuestion: card.langQuestion,
            langAnswer: card.langAnswer,
          });
        }
      }
    }

    // El manejo de tarjetas eliminadas se hace directamente desde el botón de eliminar.
    // La adición de nuevas tarjetas también se gestionará con un botón aparte.
    setMessage("Cambios guardados.");
    onNavigateHome(); // Volver al inicio después de guardar
  };

  // Añadir una nueva tarjeta vacía a la lista de edición
  const handleAddNewCard = () => {
    setEditedCardsData((prevCards) => [
      ...prevCards,
      {
        id: `new-card-${Date.now()}`,
        categoryId: currentCategory.id,
        question: "",
        answer: "",
        langQuestion: "en-US",
        langAnswer: "es-ES",
      },
    ]);
  };

  // Eliminar una tarjeta (manejo directo, luego actualiza la UI)
  const handleDeleteCardInternal = async (cardId) => {
    // onConfirmDeleteCard ya maneja el modal, solo necesitamos pasar los IDs
    confirmDeleteCard(currentCategory.id, cardId); // Llama a la función del padre para confirmar y eliminar
  };

  if (!currentCategory) {
    return (
      <div className='section-container'>
        <p className='info-text'>Selecciona una categoría para editar.</p>
        <button
          onClick={onNavigateHome}
          className='button back-button'
          disabled={isLoading}
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className='section-container edit-category-page-container'>
      <h2 className='section-title'>
        Editar Categoría: "{currentCategory.name}"
      </h2>

      <div className='input-group-vertical'>
        <label className='input-label'>Nombre de la Categoría:</label>
        <input
          type='text'
          className='input-field'
          value={editedCategoryName}
          onChange={handleCategoryNameChange}
          disabled={isLoading}
        />
      </div>

      <h3 className='subsection-title'>Tarjetas:</h3>
      {editedCardsData.length === 0 ? (
        <p className='info-text'>
          No hay tarjetas para editar en esta categoría.
        </p>
      ) : (
        <div className='cards-edit-list'>
          {editedCardsData.map((card, index) => (
            <div key={card.id || index} className='card-edit-item'>
              <div className='card-edit-fields'>
                <input
                  type='text'
                  className='input-field card-field'
                  placeholder='Pregunta (Inglés)'
                  value={card.question}
                  onChange={(e) =>
                    handleCardFieldChange(index, "question", e.target.value)
                  }
                  disabled={isLoading}
                />
                <input
                  type='text'
                  className='input-field card-field'
                  placeholder='Respuesta (Español)'
                  value={card.answer}
                  onChange={(e) =>
                    handleCardFieldChange(index, "answer", e.target.value)
                  }
                  disabled={isLoading}
                />
                {/* Selects para idiomas */}
                <select
                  className='input-field card-field lang-select'
                  value={card.langQuestion}
                  onChange={(e) =>
                    handleCardFieldChange(index, "langQuestion", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value='en-US'>Inglés (US)</option>
                  <option value='es-ES'>Español (ES)</option>
                  <option value='fr-FR'>Francés (FR)</option>
                  {/* Agrega más opciones de idioma si es necesario */}
                </select>
                <select
                  className='input-field card-field lang-select'
                  value={card.langAnswer}
                  onChange={(e) =>
                    handleCardFieldChange(index, "langAnswer", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value='es-ES'>Español (ES)</option>
                  <option value='en-US'>Inglés (US)</option>
                  <option value='fr-FR'>Francés (FR)</option>
                </select>
              </div>
              <button
                onClick={() => handleDeleteCardInternal(card.id)}
                className='button delete-card-button'
                disabled={isLoading}
                aria-label='Eliminar Tarjeta'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='100%'
                  height='100%'
                  fill='currentColor'
                  viewBox='0 0 16 16'
                >
                  {" "}
                  <path d='M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z' />{" "}
                  <path d='M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z' />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón para añadir una nueva tarjeta al editor */}
      <button
        onClick={handleAddNewCard}
        className='button add-new-card-editor-button'
        disabled={isLoading}
      >
        Añadir Nueva Tarjeta
      </button>

      <div className='edit-page-actions'>
        <button
          onClick={onNavigateHome}
          className='button back-button'
          disabled={isLoading}
        >
          Regresar
        </button>
        <button
          onClick={handleSave}
          className='button save-changes-button primary-button'
          disabled={isLoading}
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default EditCategoryPage;
