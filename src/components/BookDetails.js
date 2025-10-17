import React from "react";
import "../styles/BookDetails.css";

const BookDetails = ({ book }) => {
  // Asegurarse de que el libro y los detalles existan antes de renderizar
  if (!book || !book.details) {
    return null;
  }

  const details = [
    { label: "Formato", value: book.details.format || "Digital" },
    { label: "Idioma", value: book.details.language || "Español" },
    { label: "Páginas", value: book.details.pages },
    { label: "Entrega", value: book.details.delivery || "Inmediata" },
    { label: "Tamaño", value: book.details.fileSize },
  ];

  return (
    <div className='book-details-section'>
      <div className='book-details-container'>
        {details.map(
          (detail, index) =>
            // Solo mostrar el detalle si tiene un valor
            detail.value && (
              <div className='book-detail-item' key={index}>
                <span className='book-detail-label'>{detail.label}</span>
                <span className='book-detail-value'>{detail.value}</span>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default BookDetails;
