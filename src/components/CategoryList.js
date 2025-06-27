// src/components/CategoryList.js
import React from "react";
import "./CategoryList.css";

const CategoryList = ({
  categories,
  selectedCategoryId,
  // isEditingCategory, // Removido: la edición es ahora en una página separada
  // editedCategoryName, // Removido: la edición es ahora en una página separada
  newCategoryName,
  isLoading,
  onSelectCategory,
  onNavigateToAddCard,
  onNavigateToPracticePage,
  onNavigateToQuizPage,
  onNavigateToEditCategoryPage, // ¡Nueva prop!
  // onStartEditCategory, // Removido: la edición es ahora en una página separada
  // onSaveEditedCategory, // Removido: la edición es ahora en una página separada
  // onCancelEditCategory, // Removido: la edición es ahora en una página separada
  onNewCategoryNameChange,
  // onEditedCategoryNameChange, // Removido: la edición es ahora en una página separada
  onAddCategory,
  onConfirmDeleteCategory,
}) => {
  return (
    <div className='main-content-wrapper'>
      <div className='section-container'>
        <h2 className='section-title'>Gestionar Categorías</h2>
        <div className='input-group'>
          <input
            type='text'
            className='input-field'
            placeholder='Nombre de la nueva categoría'
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={onAddCategory}
            className='button primary-button'
            disabled={isLoading}
          >
            Crear Categoría
          </button>
        </div>

        <h3 className='subsection-title'>Tus Categorías:</h3>
        {categories.length === 0 ? (
          <p className='info-text'>No hay categorías. Crea una para empezar.</p>
        ) : (
          <div className='categories-grid'>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`category-item ${
                  selectedCategoryId === cat.id ? "selected" : ""
                }`}
              >
                {/* La edición inline se ha movido a EditCategoryPage */}
                <>
                  <button
                    onClick={() => onNavigateToPracticePage(cat.id)}
                    className='category-button'
                    disabled={isLoading}
                  >
                    {cat.name} ({cat.cards ? cat.cards.length : 0} tarjetas)
                  </button>
                  <div className='category-actions'>
                    <button
                      onClick={() => onNavigateToAddCard(cat.id)}
                      className='button add-item-button'
                      disabled={isLoading}
                      aria-label='Agregar Tarjeta'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='100%'
                        height='100%'
                        fill='currentColor'
                        viewBox='0 0 16 16'
                      >
                        <path
                          fillRule='evenodd'
                          d='M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2'
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onNavigateToQuizPage(cat.id)}
                      className='button quiz-button'
                      disabled={isLoading}
                    >
                      Quiz
                    </button>
                    {/* Botón de Editar Categoría que navega a la nueva página */}
                    <button
                      onClick={() => onNavigateToEditCategoryPage(cat.id)}
                      className='button edit-button'
                      disabled={isLoading}
                      aria-label='Editar Categoría'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='100%'
                        height='100%'
                        fill='currentColor'
                        viewBox='0 0 16 16'
                      >
                        <path d='M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325' />
                      </svg>
                    </button>
                    <button
                      onClick={() => onConfirmDeleteCategory(cat.id)}
                      className='button delete-button'
                      disabled={isLoading}
                      aria-label='Eliminar Categoría'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='100%'
                        height='100%'
                        fill='currentColor'
                        viewBox='0 0 16 16'
                      >
                        <path d='M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z' />
                        <path d='M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z' />
                      </svg>
                    </button>
                  </div>
                </>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
