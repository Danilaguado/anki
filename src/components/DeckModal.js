import React from "react";
import { Link, useNavigate } from "react-router-dom";

// Iconos para el modal
const CardsIcon = () => (
  <svg
    className='modal-icon'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
    />
  </svg>
);

const StoryIcon = () => (
  <svg
    className='modal-icon'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'
    />
  </svg>
);

const LearnIcon = () => (
  <svg
    className='modal-icon'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
    />
  </svg>
);

const QuizIcon = () => (
  <svg
    className='modal-icon'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const CompleteIcon = () => (
  <svg
    className='modal-icon'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const DeckModal = ({ deck, onClose, onDeckCompleted }) => {
  const navigate = useNavigate();

  const handleComplete = async () => {
    const confirmMessage = `¿Estás seguro de que quieres marcar "${deck.ID_Mazo}" como completado?\n\nEsto moverá el mazo a la sección de mazos aprendidos.`;

    if (window.confirm(confirmMessage)) {
      try {
        const response = await fetch("/api/decks/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: deck.UserID,
            deckId: deck.ID_Mazo,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          // Mostrar mensaje de éxito
          alert(
            `¡${deck.ID_Mazo} ha sido completado exitosamente! 🎉\n\nEl mazo se ha movido a la sección de mazos aprendidos.`
          );

          // Llamar al callback para notificar al componente padre
          if (onDeckCompleted) {
            onDeckCompleted();
          }

          // Cerrar el modal
          onClose();

          // Navegar de vuelta al dashboard
          navigate("/");

          // Forzar recarga para actualizar los datos
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          const errorData = await response.json();
          alert(
            `Error al completar el mazo: ${
              errorData.message || "Error desconocido"
            }`
          );
        }
      } catch (error) {
        console.error("Error:", error);
        alert(`Error de conexión al completar el mazo: ${error.message}`);
      }
    }
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <button className='modal-close-button' onClick={onClose}>
          &times;
        </button>

        <h2>{deck.ID_Mazo}</h2>
        <p>Selecciona una actividad para este mazo</p>
        <div className='deck-info-summary'>
          <span>
            <strong>{deck.Cantidad_Palabras}</strong> palabras
          </span>
          <span>
            Estado: <strong>{deck.Estado}</strong>
          </span>
        </div>

        <div className='modal-options'>
          <Link to={`/deck/${deck.ID_Mazo}/cards`} className='modal-option'>
            <CardsIcon />
            <span>Cartas</span>
          </Link>

          <Link to={`/deck/${deck.ID_Mazo}/history`} className='modal-option'>
            <StoryIcon />
            <span>Historia</span>
          </Link>

          <Link to={`/deck/${deck.ID_Mazo}/learn`} className='modal-option'>
            <LearnIcon />
            <span>Aprender</span>
          </Link>

          <Link to={`/deck/${deck.ID_Mazo}/quiz`} className='modal-option'>
            <QuizIcon />
            <span>Quiz</span>
          </Link>

          {/* Solo mostrar botón de completar si el mazo está activo */}
          {deck.Estado === "Activo" && (
            <button onClick={handleComplete} className='modal-option complete'>
              <CompleteIcon />
              <span>Completar Mazo</span>
            </button>
          )}

          {/* Mostrar estado si ya está completado */}
          {deck.Estado === "Completado" && (
            <div className='modal-option completed-status'>
              <CompleteIcon />
              <span>Mazo Completado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckModal;
