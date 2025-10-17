import React from "react";
import "../styles/BookDetails.css";

// Objeto que mapea los detalles a sus íconos SVG
const detailIcons = {
  format: (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
      <polyline points='14 2 14 8 20 8'></polyline>
    </svg>
  ),
  language: (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <circle cx='12' cy='12' r='10'></circle>
      <line x1='2' y1='12' x2='22' y2='12'></line>
      <path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'></path>
    </svg>
  ),
  pages: (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'></path>
      <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'></path>
    </svg>
  ),
  delivery: (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'></polygon>
    </svg>
  ),
  fileSize: (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z'></path>
      <polyline points='13 2 13 9 20 9'></polyline>
    </svg>
  ),
};

const BookDetails = ({ book }) => {
  if (!book || !book.details) {
    return null;
  }

  const details = [
    { label: "Formato", value: book.details.format, icon: detailIcons.format },
    {
      label: "Idioma",
      value: book.details.language,
      icon: detailIcons.language,
    },
    { label: "Páginas", value: book.details.pages, icon: detailIcons.pages },
    {
      label: "Entrega",
      value: book.details.delivery,
      icon: detailIcons.delivery,
    },
    {
      label: "Tamaño",
      value: book.details.fileSize,
      icon: detailIcons.fileSize,
    },
  ];

  return (
    <div className='book-details-section'>
      <div className='book-details-scroll-container'>
        {details.map((detail, index) =>
          detail.value ? (
            <div className='book-detail-item' key={index}>
              <div className='book-detail-icon'>{detail.icon}</div>
              <div className='book-detail-text'>
                <span className='book-detail-label'>{detail.label}</span>
                <span className='book-detail-value'>{detail.value}</span>
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default BookDetails;
