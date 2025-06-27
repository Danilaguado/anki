// src/components/EditCategoryPage.js
import React, { useState, useEffect } from "react";
import "./EditCategoryPage.css"; // Importa los estilos de esta página
import MessageDisplay from "./MessageDisplay"; // Para mostrar mensajes de carga/error

const EditCategoryPage = ({
  category, // La categoría a editar (incluye sus tarjetas)
  onSaveCategoryChanges, // Función para guardar los cambios (recibida de App.js)
  onNavigateToHome, // Función para volver al inicio
  isLoading: appIsLoading, // Estado de carga global de la app
  setMessage: setAppMessage, // Función para establecer mensajes globales
}) => {
  const [editedCategoryName, setEditedCategoryName] = useState(
    category?.name || ""
  );
  const [editedCards, setEditedCards] = useState([]);
  const [showCardDeleteConfirm, setShowCardDeleteConfirm] = useState(false);
  const [cardToDeleteId, setCardToDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Estado de carga local
  const [message, setMessage] = useState(""); // Mensajes locales de esta página

  useEffect(() => {
    if (category) {
      setEditedCategoryName(category.name);
      // Asegúrate de hacer una copia profunda de las tarjetas
      setEditedCards(
        category.cards ? JSON.parse(JSON.stringify(category.cards)) : []
      );
    }
  }, [category]);

  // Manejadores de cambios
  const handleCategoryNameChange = (e) => {
    setEditedCategoryName(e.target.value);
  };

  const handleCardChange = (cardId, field, value) => {
    setEditedCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, [field]: value } : card
      )
    );
  };

  // Lógica de eliminación de tarjeta
  const confirmDeleteCard = (cardId) => {
    setCardToDeleteId(cardId);
    setShowCardDeleteConfirm(true);
  };

  const cancelCardDeletion = () => {
    setShowCardDeleteConfirm(false);
    setCardToDeleteId(null);
  };

  const deleteCard = async () => {
    if (!cardToDeleteId) return;
    setIsLoading(true);
    setMessage("Eliminando tarjeta...");
    try {
      const url = `/api/cards/delete?id=${cardToDeleteId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error HTTP: ${response.status} - ${
            response.statusText
          }. Respuesta: ${errorText.substring(0, 200)}...`
        );
      }

      const result = await response.json();
      if (result.success) {
        setEditedCards((prevCards) =>
          prevCards.filter((card) => card.id !== cardToDeleteId)
        );
        setMessage("Tarjeta eliminada.");
        cancelCardDeletion(); // Cerrar el modal
        // No llamamos a onSaveCategoryChanges aquí directamente, porque esta es solo una eliminación de tarjeta individual.
        // Los cambios globales se guardarán con el botón "Guardar cambios".
        // Sin embargo, podrías llamar a una función de `onCardDeleted` si App.js necesita actualizar su estado de categorías.
      } else {
        throw new Error(
          result.error || "Error desconocido al eliminar tarjeta."
        );
      }
    } catch (error) {
      console.error("Error al eliminar tarjeta:", error);
      setMessage(`Error al eliminar la tarjeta: ${error.message}.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica para añadir una nueva tarjeta temporalmente para edición
  const addNewEmptyCard = () => {
    setEditedCards((prevCards) => [
      ...prevCards,
      {
        id: `new-${Date.now()}`,
        question: "",
        answer: "",
        langQuestion: "en-US",
        langAnswer: "es-ES",
        isNew: true,
      },
    ]);
  };

  // Función para guardar todos los cambios (nombre de categoría y tarjetas)
  const saveAllChanges = async () => {
    if (!editedCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    setMessage("Guardando todos los cambios...");

    // Preparar datos para enviar a la API
    const cardsToUpdate = editedCards.filter((card) => !card.isNew); // Solo las existentes para actualizar
    const cardsToAdd = editedCards.filter((card) => card.isNew); // Las nuevas para añadir

    try {
      // 1. Actualizar nombre de categoría
      const categoryUpdateUrl = "/api/categories/update";
      const categoryUpdateResponse = await fetch(categoryUpdateUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          name: editedCategoryName.trim(),
        }),
      });
      if (!categoryUpdateResponse.ok) {
        throw new Error(
          `Error al actualizar categoría: ${categoryUpdateResponse.statusText}`
        );
      }

      // 2. Actualizar tarjetas existentes
      for (const card of cardsToUpdate) {
        const cardUpdateUrl = "/api/cards/update"; // Asume que tienes un endpoint para actualizar tarjetas
        const cardUpdateResponse = await fetch(cardUpdateUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: card.id,
            categoryId: category.id,
            question: card.question.trim(),
            answer: card.answer.trim(),
            langQuestion: card.langQuestion,
            langAnswer: card.langAnswer,
          }),
        });
        if (!cardUpdateResponse.ok) {
          throw new Error(
            `Error al actualizar tarjeta ${card.id}: ${cardUpdateResponse.statusText}`
          );
        }
      }

      // 3. Añadir nuevas tarjetas
      for (const card of cardsToAdd) {
        if (!card.question.trim() || !card.answer.trim()) {
          setMessage(
            "Las preguntas y respuestas de las nuevas tarjetas no pueden estar vacías."
          );
          setIsLoading(false);
          return;
        }
        const cardAddUrl = "/api/cards/add"; // Endpoint para añadir tarjetas
        const cardAddResponse = await fetch(cardAddUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: category.id,
            question: card.question.trim(),
            answer: card.answer.trim(),
            langQuestion: card.langQuestion,
            langAnswer: card.langAnswer,
          }),
        });
        if (!cardAddResponse.ok) {
          throw new Error(
            `Error al añadir tarjeta nueva: ${cardAddResponse.statusText}`
          );
        }
      }

      setMessage("Cambios guardados exitosamente.");
      if (onSaveCategoryChanges) {
        onSaveCategoryChanges(); // Notificar a App.js para recargar categorías
      }
      onNavigateToHome(); // Volver a la página principal después de guardar
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      setMessage(`Error al guardar cambios: ${error.message}.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Si la categoría no está cargada, mostrar un mensaje
  if (!category) {
    return (
      <div className='main-content-wrapper'>
        <MessageDisplay
          message='Cargando categoría para editar...'
          isLoading={true}
        />
        <button
          onClick={onNavigateToHome}
          className='button back-button'
          disabled={appIsLoading || isLoading}
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className='edit-category-page'>
      <h1 className='app-title'>Editar Categoría</h1>

      <MessageDisplay message={message} isLoading={isLoading} />
      <MessageDisplay
        message={appIsLoading ? "Procesando..." : ""}
        isLoading={appIsLoading && !isLoading}
      />

      <div className='section-container'>
        <h2 className='section-title'>Nombre de la Categoría</h2>
        <div className='input-group'>
          <label htmlFor='category-name-input' className='input-label'>
            Nombre:
          </label>
          <input
            id='category-name-input'
            type='text'
            className='input-field'
            value={editedCategoryName}
            onChange={handleCategoryNameChange}
            disabled={isLoading || appIsLoading}
          />
        </div>

        <h2 className='section-title'>Tarjetas de la Categoría</h2>
        <div className='cards-edit-list'>
          {editedCards.length === 0 ? (
            <p className='info-text'>
              No hay tarjetas en esta categoría. Puedes añadir una nueva.
            </p>
          ) : (
            editedCards.map((card) => (
              <div key={card.id} className='card-edit-item'>
                <div className='card-edit-inputs'>
                  <div className='card-input-group'>
                    <label
                      htmlFor={`question-${card.id}`}
                      className='input-label'
                    >
                      Inglés:
                    </label>
                    <input
                      id={`question-${card.id}`}
                      type='text'
                      className='input-field'
                      value={card.question}
                      onChange={(e) =>
                        handleCardChange(card.id, "question", e.target.value)
                      }
                      disabled={isLoading || appIsLoading}
                    />
                  </div>
                  <div className='card-input-group'>
                    <label
                      htmlFor={`answer-${card.id}`}
                      className='input-label'
                    >
                      Español:
                    </label>
                    <input
                      id={`answer-${card.id}`}
                      type='text'
                      className='input-field'
                      value={card.answer}
                      onChange={(e) =>
                        handleCardChange(card.id, "answer", e.target.value)
                      }
                      disabled={isLoading || appIsLoading}
                    />
                  </div>
                </div>
                <button
                  onClick={() => confirmDeleteCard(card.id)}
                  className='button delete-button delete-card-button'
                  disabled={isLoading || appIsLoading}
                  aria-label='Eliminar Tarjeta'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='100%'
                    height='100%'
                    fill='currentColor'
                    viewBox='0 0 16 16'
                  >
                    <path d='M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z' />
                    <path d='M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z' />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
        <button
          onClick={addNewEmptyCard}
          className='button primary-button add-new-card-button'
          disabled={isLoading || appIsLoading}
        >
          Añadir Nueva Tarjeta Vacía
        </button>
      </div>

      <div className='edit-actions-group'>
        <button
          onClick={saveAllChanges}
          className='button save-button'
          disabled={isLoading || appIsLoading}
        >
          Guardar Cambios
        </button>
        <button
          onClick={onNavigateToHome}
          className='button back-button'
          disabled={isLoading || appIsLoading}
        >
          Regresar
        </button>
      </div>

      {showCardDeleteConfirm && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <p className='modal-title'>
              ¿Estás seguro que quieres eliminar esta tarjeta?
            </p>
            <p className='modal-text'>Esta acción no se puede deshacer.</p>
            <div className='modal-buttons'>
              <button
                onClick={deleteCard}
                className='button modal-delete-button'
                disabled={isLoading || appIsLoading}
              >
                Sí, Eliminar
              </button>
              <button
                onClick={cancelCardDeletion}
                className='button modal-cancel-button'
                disabled={isLoading || appIsLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCategoryPage;
