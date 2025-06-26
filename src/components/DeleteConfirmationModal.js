// src/components/DeleteConfirmationModal.js
import React from "react";

const DeleteConfirmationModal = ({ onDelete, onCancel, isLoading }) => {
  return (
    <div className='modal-overlay'>
      <div className='modal-content'>
        <p className='modal-title'>
          ¿Estás seguro que quieres eliminar esta categoría?
        </p>
        <p className='modal-text'>
          Esta acción no se puede deshacer y la categoría se perderá.
        </p>
        <div className='modal-buttons'>
          <button
            onClick={onDelete}
            className='button modal-delete-button'
            disabled={isLoading}
          >
            Sí, Eliminar
          </button>
          <button
            onClick={onCancel}
            className='button modal-cancel-button'
            disabled={isLoading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
