import React, { useState } from "react";
import DeckModal from "./DeckModal";

const AddIcon = () => (
  <svg
    className='icon'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const Dashboard = ({ userData, onCreateDeck }) => {
  const [selectedDeck, setSelectedDeck] = useState(null);

  // Simulamos mazos existentes basados en userData
  const decks = userData.decks || [];
  const activeDecks = decks.filter((d) => d.Estado !== "Completado");
  const completedDecks = decks.filter((d) => d.Estado === "Completado");

  const handleCreateDeck = async () => {
    // Lógica para crear un nuevo mazo
    const wordsToLearn = userData.words.filter(
      (word) => word.Estado === "Por Aprender"
    );

    if (wordsToLearn.length === 0) {
      alert(
        "¡Felicidades! Has añadido todas las palabras a tu mazo de estudio."
      );
      return;
    }

    // Por defecto crear mazo con 10 palabras o las que queden disponibles
    const amount = Math.min(10, wordsToLearn.length);

    if (onCreateDeck) {
      await onCreateDeck(amount);
      // El componente padre se encargará de actualizar userData y refrescar los mazos
    }
  };

  return (
    <div className='screen-container'>
      {selectedDeck && (
        <DeckModal deck={selectedDeck} onClose={() => setSelectedDeck(null)} />
      )}

      <h1>Panel de Aprendizaje</h1>
      <p className='subtitle'>Selecciona un mazo para empezar a estudiar.</p>

      <div className='decks-section'>
        <h2>Mazos Activos</h2>
        <div className='decks-grid'>
          {activeDecks.map((deck) => (
            <button
              key={deck.ID_Mazo}
              className='deck-button'
              onClick={() => setSelectedDeck(deck)}
            >
              {deck.ID_Mazo}
            </button>
          ))}
          <button className='deck-button add-new' onClick={handleCreateDeck}>
            <AddIcon />
            Añadir Nuevo Mazo
          </button>
        </div>
      </div>

      {completedDecks.length > 0 && (
        <div className='decks-section'>
          <h2>Mazos Completados</h2>
          <div className='decks-grid'>
            {completedDecks.map((deck) => (
              <button
                key={deck.ID_Mazo}
                className='deck-button completed'
                onClick={() => setSelectedDeck(deck)}
              >
                {deck.ID_Mazo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
