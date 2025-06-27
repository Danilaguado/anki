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

  // Al cargar la categoría, asegurar que cada tarjeta tenga langQuestion/langAnswer
  useEffect(() => {
    if (category) {
      setEditedCategoryName(category.name);
      setEditedCards(
        (category.cards || []).map((card) => ({
          ...card,
          langQuestion: card.langQuestion || "en-US",
          langAnswer: card.langAnswer || "es-ES",
        }))
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

  // Lógica de eliminación de tarjeta...
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setEditedCards((prev) => prev.filter((c) => c.id !== cardToDeleteId));
        setMessage("Tarjeta eliminada.");
        cancelCardDeletion();
      } else {
        throw new Error(result.error || "Error al eliminar tarjeta.");
      }
    } catch (error) {
      console.error(error);
      setMessage(`Error al eliminar la tarjeta: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Añadir tarjeta vacía
  const addNewEmptyCard = () => {
    setEditedCards((prev) => [
      ...prev,
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

  // Guardar todos los cambios
  const saveAllChanges = async () => {
    if (!editedCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    setMessage("Guardando todos los cambios...");

    const cardsToUpdate = editedCards.filter((c) => !c.isNew);
    const cardsToAdd = editedCards.filter((c) => c.isNew);

    try {
      // 1. Actualizar categoría
      const catRes = await fetch("/api/categories/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id.trim(),
          name: editedCategoryName.trim(),
        }),
      });
      if (!catRes.ok) {
        const err = await catRes.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar categoría.");
      }

      // 2. Actualizar tarjetas existentes
      for (const card of cardsToUpdate) {
        if (!card.question.trim() || !card.answer.trim()) {
          setMessage(
            `La pregunta o respuesta de la tarjeta ID ${card.id} no puede estar vacía.`
          );
          setIsLoading(false);
          return;
        }
        const payload = {
          id: card.id.trim(),
          categoryId: category.id.trim(),
          question: card.question.trim(),
          answer: card.answer.trim(),
          langQuestion: (card.langQuestion || "en-US").trim(),
          langAnswer: (card.langAnswer || "es-ES").trim(),
        };
        const res = await fetch("/api/cards/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err.error || `Error al actualizar tarjeta ${card.id}`
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
        const addRes = await fetch("/api/cards/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: category.id.trim(),
            question: card.question.trim(),
            answer: card.answer.trim(),
            langQuestion: (card.langQuestion || "en-US").trim(),
            langAnswer: (card.langAnswer || "es-ES").trim(),
          }),
        });
        if (!addRes.ok) {
          const err = await addRes.json().catch(() => ({}));
          throw new Error(err.error || "Error al añadir nueva tarjeta.");
        }
      }

      setMessage("Cambios guardados exitosamente.");
      if (onSaveCategoryChanges) onSaveCategoryChanges();
      onNavigateToHome();
    } catch (error) {
      console.error(error);
      setMessage(`Error al guardar cambios: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
        message={appIsLoading && !isLoading ? "Procesando..." : ""}
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
                  {/* ícono basura */}
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
