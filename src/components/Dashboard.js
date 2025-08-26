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

const BookIcon = () => (
  <svg
    className='stats-icon'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    className='stats-icon'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const Dashboard = ({ userData, onCreateDeck }) => {
  const [selectedDeck, setSelectedDeck] = useState(null);

  // Procesamos datos de mazos y palabras
  const decks = userData.decks || [];
  const activeDecks = decks.filter((d) => d.Estado === "Activo");
  const completedDecks = decks.filter((d) => d.Estado === "Completado");

  // Calculamos estadísticas de palabras
  const totalWords = userData.words?.length || 0;
  const learnedWords =
    userData.words?.filter((word) => word.Estado === "Dominada")?.length || 0;
  const learningWords =
    userData.words?.filter((word) => word.Estado === "Aprendiendo")?.length ||
    0;

  const handleCreateDeck = async () => {
    // Filtrar palabras que están "Por Aprender" (no "Aprendiendo" ni "Dominada")
    const availableWords = userData.words.filter(
      (word) => word.Estado === "Por Aprender"
    );

    if (availableWords.length === 0) {
      alert(
        "¡Felicidades! Has añadido todas las palabras disponibles a mazos de estudio."
      );
      return;
    }

    // Seleccionar hasta 10 palabras al azar
    const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(
      0,
      Math.min(10, shuffledWords.length)
    );

    if (onCreateDeck) {
      await onCreateDeck(selectedWords.length);
      // El componente padre se encargará de actualizar userData automáticamente
    }
  };

  return (
    <div className='dashboard-container'>
      {selectedDeck && (
        <DeckModal
          deck={selectedDeck}
          onClose={() => setSelectedDeck(null)}
          onDeckCompleted={() => {
            setSelectedDeck(null);
            window.location.reload(); // Forzar recarga para actualizar mazos
          }}
        />
      )}

      <div className='dashboard-header'>
        <h1>Panel de Aprendizaje</h1>
        <p className='subtitle'>Continúa tu progreso con el vocabulario</p>
      </div>

      {/* Estadísticas */}
      <div className='stats-section'>
        <div className='stat-card'>
          <BookIcon />
          <div className='stat-info'>
            <span className='stat-number'>{totalWords}</span>
            <span className='stat-label'>Palabras Total</span>
          </div>
        </div>
        <div className='stat-card completed'>
          <CheckCircleIcon />
          <div className='stat-info'>
            <span className='stat-number'>{learnedWords}</span>
            <span className='stat-label'>Dominadas</span>
          </div>
        </div>
        <div className='stat-card learning'>
          <BookIcon />
          <div className='stat-info'>
            <span className='stat-number'>{learningWords}</span>
            <span className='stat-label'>Estudiando</span>
          </div>
        </div>
      </div>

      {/* Mazos Activos */}
      <div className='decks-section'>
        <h2>
          <span className='section-title'>Mazos Activos</span>
          <span className='section-count'>({activeDecks.length})</span>
        </h2>
        <div className='decks-grid'>
          {activeDecks.map((deck) => (
            <button
              key={deck.ID_Mazo}
              className='deck-button active'
              onClick={() => setSelectedDeck(deck)}
            >
              <div className='deck-content'>
                <span className='deck-title'>{deck.ID_Mazo}</span>
                <span className='deck-info'>
                  {deck.Cantidad_Palabras} palabras
                </span>
              </div>
            </button>
          ))}
          <button className='deck-button add-new' onClick={handleCreateDeck}>
            <AddIcon />
            <span className='add-text'>Añadir Nuevo Mazo</span>
          </button>
        </div>
      </div>

      {/* Mazos Completados */}
      {completedDecks.length > 0 && (
        <div className='decks-section'>
          <h2>
            <span className='section-title'>Mazos Completados</span>
            <span className='section-count'>({completedDecks.length})</span>
          </h2>
          <div className='decks-grid'>
            {completedDecks.map((deck) => (
              <button
                key={deck.ID_Mazo}
                className='deck-button completed'
                onClick={() => setSelectedDeck(deck)}
              >
                <div className='deck-content'>
                  <CheckCircleIcon />
                  <span className='deck-title'>{deck.ID_Mazo}</span>
                  <span className='deck-info'>Completado</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeDecks.length === 0 && completedDecks.length === 0 && (
        <div className='empty-state'>
          <BookIcon />
          <h3>¡Comienza tu aprendizaje!</h3>
          <p>Crea tu primer mazo para comenzar a estudiar vocabulario.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
