import React, { useState } from "react";
import DeckModal from "./DeckModal"; // Importamos el nuevo modal

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

const Dashboard = ({ userData, onStartQuiz }) => {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const decks = userData.decks || [];
  const activeDecks = decks.filter((d) => d.Estado !== "Completado");
  const completedDecks = decks.filter((d) => d.Estado === "Completado");

  const handleCreateDeck = () => {
    // La lógica para llamar a /api/create-deck iría aquí
    alert("Lógica para crear un nuevo mazo (en construcción).");
  };

  return (
    <div className='screen-container'>
      {selectedDeck && (
        <DeckModal
          deck={selectedDeck}
          onClose={() => setSelectedDeck(null)}
          onSelectActivity={(activity) =>
            onStartQuiz(selectedDeck.ID_Mazo, activity)
          }
        />
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
