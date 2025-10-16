import React, { useState } from "react";
// 👇 1. Importa useNavigate para una mejor navegación
import { useNavigate } from "react-router-dom";
import "../styles/BookPreviewModal.css";

const BookPreviewModal = ({
  isOpen,
  onClose,
  bookTitle,
  previewFolder,
  productName,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [imageError, setImageError] = useState(false);
  const maxPages = 8;
  const navigate = useNavigate(); // <-- 2. Inicializa el hook

  if (!isOpen) return null;

  const handleNextPage = () => {
    if (currentPage < maxPages) {
      setCurrentPage(currentPage + 1);
      setImageError(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setImageError(false);
    }
  };

  // 👇 3. Función de desbloqueo CORREGIDA
  const handleUnlock = () => {
    onClose(); // Cierra el modal
    // Navega a la página de pre-pago en lugar de la de pago
    navigate(`/start-purchase?product=${encodeURIComponent(productName)}`);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const imagePath = `/assets/previews/${previewFolder}-page-${currentPage}.jpg`;

  return (
    <div className='preview-modal-overlay' onClick={handleOverlayClick}>
      <div className='preview-modal-container'>
        {/* Header */}
        <div className='preview-modal-header'>
          <div className='preview-modal-header-content'>
            <h3 className='preview-modal-title'>{bookTitle}</h3>
            <p className='preview-modal-subtitle'>
              Vista Previa - Página {currentPage} de {maxPages}
            </p>
          </div>
          <button
            className='preview-modal-close'
            onClick={onClose}
            aria-label='Cerrar vista previa'
          >
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <line x1='18' y1='6' x2='6' y2='18'></line>
              <line x1='6' y1='6' x2='18' y2='18'></line>
            </svg>
          </button>
        </div>

        {/* Image Viewer */}
        <div className='preview-modal-body'>
          {currentPage < maxPages ? (
            <div className='preview-image-container'>
              {imageError ? (
                <div className='preview-image-error'>
                  {/* ... (código sin cambios) ... */}
                </div>
              ) : (
                <img
                  key={currentPage}
                  src={imagePath}
                  alt={`Página ${currentPage} de ${bookTitle}`}
                  className='preview-page-image'
                  onError={handleImageError}
                />
              )}
            </div>
          ) : (
            // Página 8 con overlay de desbloqueo
            <div className='preview-unlock-container'>
              <div className='preview-image-container preview-blurred'>
                {imageError ? (
                  <div className='preview-image-error'>
                    {/* ... (código sin cambios) ... */}
                  </div>
                ) : (
                  <img
                    key={currentPage}
                    src={imagePath}
                    alt={`Página ${currentPage} de ${bookTitle}`}
                    className='preview-page-image'
                    onError={handleImageError}
                  />
                )}
              </div>

              {/* Overlay de desbloqueo */}
              <div className='preview-unlock-overlay'>
                <div className='preview-unlock-content'>
                  <div className='preview-unlock-icon'>
                    <svg
                      width='64'
                      height='64'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                    >
                      <rect
                        x='3'
                        y='11'
                        width='18'
                        height='11'
                        rx='2'
                        ry='2'
                      ></rect>
                      <path d='M7 11V7a5 5 0 0 1 10 0v4'></path>
                    </svg>
                  </div>
                  <h4 className='preview-unlock-title'>
                    ¿Te gustó la vista previa?
                  </h4>
                  <p className='preview-unlock-text'>
                    Desbloquea el libro completo y accede a todo el contenido
                    exclusivo.
                  </p>
                  <button
                    className='preview-unlock-button'
                    onClick={handleUnlock}
                  >
                    Desbloquear Libro Completo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {currentPage < maxPages && (
          <div className='preview-modal-footer'>
            {/* ... (código de navegación sin cambios) ... */}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookPreviewModal;
