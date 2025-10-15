// src/components/BookPreviewModal.js
import React, { useState } from "react";
import "../styles/BookPreviewModal.css";

const BookPreviewModal = ({
  isOpen,
  onClose,
  bookTitle,
  pdfPath,
  productName,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const maxPages = 5;

  if (!isOpen) return null;

  const handleNextPage = () => {
    if (currentPage < maxPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleUnlock = () => {
    onClose();
    // Redirigir a la página de pago con el producto
    window.location.href = `/payment?product=${encodeURIComponent(
      productName
    )}`;
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

        {/* PDF Viewer */}
        <div className='preview-modal-body'>
          {currentPage < maxPages ? (
            <div className='preview-pdf-container'>
              <iframe
                src={`${pdfPath}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                className='preview-pdf-frame'
                title={`Página ${currentPage} de ${bookTitle}`}
              />
            </div>
          ) : (
            // Página 5 con overlay de desbloqueo
            <div className='preview-unlock-container'>
              <div className='preview-pdf-container preview-blurred'>
                <iframe
                  src={`${pdfPath}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                  className='preview-pdf-frame'
                  title={`Página ${currentPage} de ${bookTitle}`}
                />
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
                    exclusivo
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
            <button
              className='preview-nav-button preview-nav-prev'
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <polyline points='15 18 9 12 15 6'></polyline>
              </svg>
              Anterior
            </button>

            <div className='preview-page-indicators'>
              {[1, 2, 3, 4, 5].map((page) => (
                <div
                  key={page}
                  className={`preview-page-dot ${
                    page === currentPage ? "active" : ""
                  } ${page <= currentPage ? "visited" : ""}`}
                />
              ))}
            </div>

            <button
              className='preview-nav-button preview-nav-next'
              onClick={handleNextPage}
              disabled={currentPage === maxPages}
            >
              Siguiente
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <polyline points='9 18 15 12 9 6'></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookPreviewModal;
