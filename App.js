<<<<<<< HEAD
import React, { useState, useEffect } from "react";

const App = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [message, setMessage] = useState("");

  const [isEditingCategory, setIsEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

  // No longer needed if using backend for persistence
  const [exportedJson, setExportedJson] = useState("");

  // ** New: Fetch data from backend on component mount **
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/quiz-data"); // Replace with your backend URL
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCategories(data);
        // Set initial selected category
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        setMessage("Error al cargar los datos. Intenta recargar la página.");
      }
    };
    fetchQuizData();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    setCurrentCardIndex(0);
    setIsAnswerVisible(false);
  }, [selectedCategoryId]);

  const currentCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );
  const currentCards = currentCategory ? currentCategory.cards || [] : [];
  const currentCard = currentCards[currentCardIndex];

  const playAudio = (text, lang, rate = 1) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.pitch = 1;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } else {
      setMessage(
        "La API de Síntesis de Voz no es compatible con este navegador."
      );
      console.warn("SpeechSynthesis API not supported in this browser.");
    }
  };

  const toggleAnswerVisibility = () => {
    setIsAnswerVisible(!isAnswerVisible);
  };

  const nextCard = () => {
    if (currentCards.length > 0) {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % currentCards.length);
      setIsAnswerVisible(false);
    }
  };

  const prevCard = () => {
    if (currentCards.length > 0) {
      setCurrentCardIndex(
        (prevIndex) =>
          (prevIndex - 1 + currentCards.length) % currentCards.length
      );
      setIsAnswerVisible(false);
    }
  };

  // ** Modified: Add Category (sends to backend) **
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setMessage("");
    try {
      const response = await fetch("http://localhost:3001/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newCat = await response.json();
      setCategories((prevCategories) => [...prevCategories, newCat]);
      setNewCategoryName("");
      setMessage(`Categoría "${newCat.name}" creada.`);
      setSelectedCategoryId(newCat.id);
    } catch (error) {
      console.error("Error adding category:", error);
      setMessage("Error al crear la categoría.");
    }
  };

  // ** Modified: Add Card (sends to backend) **
  const addCardManually = async () => {
    if (!selectedCategoryId) {
      setMessage("Por favor, selecciona una categoría primero.");
      return;
    }
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) {
      setMessage("La pregunta y la respuesta no pueden estar vacías.");
      return;
    }
    setMessage("");

    try {
      const newCard = {
        categoryId: selectedCategoryId,
        question: newCardQuestion.trim(),
        answer: newCardAnswer.trim(),
        langQuestion: "en-US",
        langAnswer: "es-ES",
      };
      const response = await fetch("http://localhost:3001/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCard),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const addedCard = await response.json(); // Backend might return the full card with an ID

      setCategories((prevCategories) => {
        return prevCategories.map((cat) => {
          if (cat.id === selectedCategoryId) {
            return {
              ...cat,
              cards: [...(cat.cards || []), addedCard],
              updatedAt: new Date().toISOString(), // Update timestamp
            };
          }
          return cat;
        });
      });
      setNewCardQuestion("");
      setNewCardAnswer("");
      setMessage("Tarjeta añadida.");
    } catch (error) {
      console.error("Error adding card:", error);
      setMessage("Error al añadir la tarjeta.");
    }
  };

  const startEditCategory = (category) => {
    setIsEditingCategory(category.id);
    setEditedCategoryName(category.name);
  };

  // ** Modified: Save Edited Category (sends to backend) **
  const saveEditedCategory = async () => {
    if (!editedCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    try {
      // You'd need a PATCH or PUT endpoint on your backend for this
      const response = await fetch(
        `http://localhost:3001/api/categories/${isEditingCategory}`,
        {
          method: "PUT", // Or PATCH
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editedCategoryName.trim() }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Assuming backend confirms success, update local state
      setCategories((prevCategories) => {
        return prevCategories.map((cat) =>
          cat.id === isEditingCategory
            ? {
                ...cat,
                name: editedCategoryName.trim(),
                updatedAt: new Date().toISOString(),
              }
            : cat
        );
      });
      setMessage(`Categoría "${editedCategoryName}" actualizada.`);
      setIsEditingCategory(null);
      setEditedCategoryName("");
    } catch (error) {
      console.error("Error saving edited category:", error);
      setMessage("Error al actualizar la categoría.");
    }
  };

  const cancelEditCategory = () => {
    setIsEditingCategory(null);
    setEditedCategoryName("");
  };

  const confirmDeleteCategory = (categoryId) => {
    setCategoryToDeleteId(categoryId);
    setShowDeleteConfirm(true);
  };

  // ** Modified: Delete Category (sends to backend) **
  const deleteCategory = async () => {
    if (!categoryToDeleteId) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/categories/${categoryToDeleteId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setCategories((prevCategories) => {
        const filteredCategories = prevCategories.filter(
          (cat) => cat.id !== categoryToDeleteId
        );
        if (selectedCategoryId === categoryToDeleteId) {
          setSelectedCategoryId(filteredCategories[0]?.id || null);
        }
        return filteredCategories;
      });
      setMessage(`Categoría eliminada.`);
      setShowDeleteConfirm(false);
      setCategoryToDeleteId(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      setMessage("Error al eliminar la categoría.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setCategoryToDeleteId(null);
  };

  // ** No longer needed if using backend persistence **
  const generateJsonForCode = () => {
    setMessage(
      "Los datos ahora se guardan en Google Sheets a través de un servidor backend."
    );
    setExportedJson(""); // Clear any old JSON
  };

  return (
    <div className='min-h-screen bg-gray-100 p-4 flex flex-col items-center'>
      <h1 className='text-4xl font-extrabold text-gray-900 mb-8 mt-4 rounded-xl px-4 py-2 bg-white shadow-lg'>
        Mi Entrenador de Vocabulario
      </h1>

      {message && (
        <div
          className='bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl relative mb-6 w-full max-w-2xl text-center shadow-md'
          role='alert'
        >
          <span className='block sm:inline'>{message}</span>
        </div>
      )}

      {/* Section: Gestionar Categorías */}
      <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg mb-8'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          Gestionar Categorías
        </h2>
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          <input
            type='text'
            className='flex-grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
            placeholder='Nombre de la nueva categoría'
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            onClick={addCategory}
            className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
          >
            Crear Categoría
          </button>
        </div>

        <h3 className='text-xl font-semibold text-gray-700 mb-3'>
          Tus Categorías:
        </h3>
        {categories.length === 0 ? (
          <p className='text-gray-500'>
            No hay categorías. Crea una para empezar.
          </p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition duration-200
                                ${
                                  selectedCategoryId === cat.id
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-800 font-bold"
                                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
                                }`}
              >
                {isEditingCategory === cat.id ? (
                  <div className='flex flex-col gap-2'>
                    <input
                      type='text'
                      className='p-2 border border-gray-400 rounded-lg text-gray-800'
                      value={editedCategoryName}
                      onChange={(e) => setEditedCategoryName(e.target.value)}
                    />
                    <div className='flex gap-2'>
                      <button
                        onClick={saveEditedCategory}
                        className='flex-grow bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-2 rounded-lg'
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEditCategory}
                        className='flex-grow bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-2 rounded-lg'
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className='text-left font-semibold'
                    >
                      {cat.name} ({cat.cards ? cat.cards.length : 0} tarjetas)
                    </button>
                    <div className='flex gap-2 justify-end'>
                      <button
                        onClick={() => startEditCategory(cat)}
                        className='bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded-md shadow-sm'
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => confirmDeleteCategory(cat.id)}
                        className='bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded-md shadow-sm'
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Anki Card Display */}
      {selectedCategoryId && currentCategory ? (
        <div className='card-container w-full max-w-md bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 mb-8'>
          <h2 className='text-2xl font-bold text-gray-800'>
            Tema Actual: {currentCategory.name}
          </h2>
          {currentCards.length > 0 ? (
            <>
              <div className='card-content min-h-[120px] flex flex-col justify-center items-center'>
                <div id='question-text' className='card-text'>
                  {currentCard.question}
                </div>
                <div
                  id='answer-text'
                  className={`card-answer ${isAnswerVisible ? "" : "hidden"}`}
                >
                  {currentCard.answer}
                </div>
              </div>

              {/* Audio Speed Buttons */}
              <div className='flex flex-wrap justify-center gap-2'>
                <button
                  onClick={() =>
                    playAudio(
                      currentCard.question,
                      currentCard.langQuestion || "en-US",
                      1
                    )
                  }
                  className='btn btn-audio bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
                >
                  Normal (1x)
                </button>
                <button
                  onClick={() =>
                    playAudio(
                      currentCard.question,
                      currentCard.langQuestion || "en-US",
                      0.8
                    )
                  }
                  className='btn btn-audio bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
                >
                  Lento (0.8x)
                </button>
                <button
                  onClick={() =>
                    playAudio(
                      currentCard.question,
                      currentCard.langQuestion || "en-US",
                      0.5
                    )
                  }
                  className='btn btn-audio bg-green-400 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
                >
                  Muy Lento (0.5x)
                </button>
              </div>

              <button
                onClick={toggleAnswerVisibility}
                className='btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
              >
                {isAnswerVisible ? "Ocultar Traducción" : "Mostrar Traducción"}
              </button>

              <div className='navigation-buttons flex justify-between gap-4'>
                <button
                  onClick={prevCard}
                  className='btn btn-secondary bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 flex-grow'
                >
                  Anterior
                </button>
                <button
                  onClick={nextCard}
                  className='btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 flex-grow'
                >
                  Siguiente
                </button>
              </div>

              <div className='card-counter text-gray-600 text-sm mt-2'>
                Tarjeta {currentCards.length > 0 ? currentCardIndex + 1 : 0} de{" "}
                {currentCards.length}
              </div>
            </>
          ) : (
            <p className='text-gray-500'>
              No hay tarjetas en esta categoría. Añade algunas manualmente.
            </p>
          )}
        </div>
      ) : (
        <div className='w-full max-w-md bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 mb-8'>
          <p className='text-gray-600 text-center'>
            Selecciona una categoría o crea una nueva para empezar a estudiar.
          </p>
        </div>
      )}

      {/* Section: Add Cards */}
      {selectedCategoryId && (
        <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>
            Añadir Tarjetas a "{currentCategory?.name || "..."}"
          </h2>

          {/* Manual Card Addition */}
          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            Añadir Manualmente:
          </h3>
          <div className='flex flex-col gap-4 mb-6'>
            <input
              type='text'
              className='p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Pregunta (Inglés)'
              value={newCardQuestion}
              onChange={(e) => setNewCardQuestion(e.target.value)}
            />
            <input
              type='text'
              className='p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Respuesta (Español)'
              value={newCardAnswer}
              onChange={(e) => setNewCardAnswer(e.target.value)}
            />
            <button
              onClick={addCardManually}
              className='bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
            >
              Añadir Tarjeta Manualmente
            </button>
          </div>
        </div>
      )}

      {/* Section: Export Data for Code (No longer strictly for code, but for info) */}
      <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg mb-8'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          Exportar Datos para el Código
        </h2>
        <p className='text-gray-700 mb-4'>
          Ahora, las categorías y tarjetas se gestionan directamente en tu hoja
          de Google Sheets. No necesitas copiar y pegar JSON en el código. Si
          necesitas el JSON de tus datos actuales para depuración o para otro
          propósito, puedes generarlo aquí.
        </p>
        <button
          onClick={generateJsonForCode}
          className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 mb-4'
        >
          Generar JSON de Datos Actuales (solo para visualización)
        </button>
        {exportedJson && (
          <div className='mt-4'>
            <h3 className='text-xl font-semibold text-gray-700 mb-2'>
              JSON Generado:
            </h3>
            <textarea
              readOnly
              className='w-full p-4 border border-gray-300 rounded-xl font-mono text-sm bg-gray-50 resize-y min-h-[200px]'
              value={exportedJson}
              onClick={(e) => e.target.select()} // Select all text on click for easy copy
            ></textarea>
            <p className='text-gray-600 text-sm mt-2'>
              Haz clic en el cuadro de texto para seleccionar todo el JSON y
              copiarlo.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Custom UI) */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center'>
            <p className='text-lg font-semibold text-gray-800 mb-4'>
              ¿Estás seguro que quieres eliminar esta categoría?
            </p>
            <p className='text-sm text-gray-600 mb-6'>
              Esta acción no se puede deshacer y la categoría se perderá.
            </p>
            <div className='flex justify-center gap-4'>
              <button
                onClick={deleteCategory}
                className='bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200'
              >
                Sí, Eliminar
              </button>
              <button
                onClick={cancelDelete}
                className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200'
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
=======
import React, { useState, useEffect } from "react";

const App = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [message, setMessage] = useState("");

  const [isEditingCategory, setIsEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState(null);

  // No longer needed if using backend for persistence
  const [exportedJson, setExportedJson] = useState("");

  // ** New: Fetch data from backend on component mount **
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/quiz-data"); // Replace with your backend URL
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCategories(data);
        // Set initial selected category
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        setMessage("Error al cargar los datos. Intenta recargar la página.");
      }
    };
    fetchQuizData();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    setCurrentCardIndex(0);
    setIsAnswerVisible(false);
  }, [selectedCategoryId]);

  const currentCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );
  const currentCards = currentCategory ? currentCategory.cards || [] : [];
  const currentCard = currentCards[currentCardIndex];

  const playAudio = (text, lang, rate = 1) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.pitch = 1;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } else {
      setMessage(
        "La API de Síntesis de Voz no es compatible con este navegador."
      );
      console.warn("SpeechSynthesis API not supported in this browser.");
    }
  };

  const toggleAnswerVisibility = () => {
    setIsAnswerVisible(!isAnswerVisible);
  };

  const nextCard = () => {
    if (currentCards.length > 0) {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % currentCards.length);
      setIsAnswerVisible(false);
    }
  };

  const prevCard = () => {
    if (currentCards.length > 0) {
      setCurrentCardIndex(
        (prevIndex) =>
          (prevIndex - 1 + currentCards.length) % currentCards.length
      );
      setIsAnswerVisible(false);
    }
  };

  // ** Modified: Add Category (sends to backend) **
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    setMessage("");
    try {
      const response = await fetch("http://localhost:3001/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newCat = await response.json();
      setCategories((prevCategories) => [...prevCategories, newCat]);
      setNewCategoryName("");
      setMessage(`Categoría "${newCat.name}" creada.`);
      setSelectedCategoryId(newCat.id);
    } catch (error) {
      console.error("Error adding category:", error);
      setMessage("Error al crear la categoría.");
    }
  };

  // ** Modified: Add Card (sends to backend) **
  const addCardManually = async () => {
    if (!selectedCategoryId) {
      setMessage("Por favor, selecciona una categoría primero.");
      return;
    }
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) {
      setMessage("La pregunta y la respuesta no pueden estar vacías.");
      return;
    }
    setMessage("");

    try {
      const newCard = {
        categoryId: selectedCategoryId,
        question: newCardQuestion.trim(),
        answer: newCardAnswer.trim(),
        langQuestion: "en-US",
        langAnswer: "es-ES",
      };
      const response = await fetch("http://localhost:3001/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCard),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const addedCard = await response.json(); // Backend might return the full card with an ID

      setCategories((prevCategories) => {
        return prevCategories.map((cat) => {
          if (cat.id === selectedCategoryId) {
            return {
              ...cat,
              cards: [...(cat.cards || []), addedCard],
              updatedAt: new Date().toISOString(), // Update timestamp
            };
          }
          return cat;
        });
      });
      setNewCardQuestion("");
      setNewCardAnswer("");
      setMessage("Tarjeta añadida.");
    } catch (error) {
      console.error("Error adding card:", error);
      setMessage("Error al añadir la tarjeta.");
    }
  };

  const startEditCategory = (category) => {
    setIsEditingCategory(category.id);
    setEditedCategoryName(category.name);
  };

  // ** Modified: Save Edited Category (sends to backend) **
  const saveEditedCategory = async () => {
    if (!editedCategoryName.trim()) {
      setMessage("El nombre de la categoría no puede estar vacío.");
      return;
    }
    try {
      // You'd need a PATCH or PUT endpoint on your backend for this
      const response = await fetch(
        `http://localhost:3001/api/categories/${isEditingCategory}`,
        {
          method: "PUT", // Or PATCH
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editedCategoryName.trim() }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Assuming backend confirms success, update local state
      setCategories((prevCategories) => {
        return prevCategories.map((cat) =>
          cat.id === isEditingCategory
            ? {
                ...cat,
                name: editedCategoryName.trim(),
                updatedAt: new Date().toISOString(),
              }
            : cat
        );
      });
      setMessage(`Categoría "${editedCategoryName}" actualizada.`);
      setIsEditingCategory(null);
      setEditedCategoryName("");
    } catch (error) {
      console.error("Error saving edited category:", error);
      setMessage("Error al actualizar la categoría.");
    }
  };

  const cancelEditCategory = () => {
    setIsEditingCategory(null);
    setEditedCategoryName("");
  };

  const confirmDeleteCategory = (categoryId) => {
    setCategoryToDeleteId(categoryId);
    setShowDeleteConfirm(true);
  };

  // ** Modified: Delete Category (sends to backend) **
  const deleteCategory = async () => {
    if (!categoryToDeleteId) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/categories/${categoryToDeleteId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setCategories((prevCategories) => {
        const filteredCategories = prevCategories.filter(
          (cat) => cat.id !== categoryToDeleteId
        );
        if (selectedCategoryId === categoryToDeleteId) {
          setSelectedCategoryId(filteredCategories[0]?.id || null);
        }
        return filteredCategories;
      });
      setMessage(`Categoría eliminada.`);
      setShowDeleteConfirm(false);
      setCategoryToDeleteId(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      setMessage("Error al eliminar la categoría.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setCategoryToDeleteId(null);
  };

  // ** No longer needed if using backend persistence **
  const generateJsonForCode = () => {
    setMessage(
      "Los datos ahora se guardan en Google Sheets a través de un servidor backend."
    );
    setExportedJson(""); // Clear any old JSON
  };

  return (
    <div className='min-h-screen bg-gray-100 p-4 flex flex-col items-center'>
      <h1 className='text-4xl font-extrabold text-gray-900 mb-8 mt-4 rounded-xl px-4 py-2 bg-white shadow-lg'>
        Mi Entrenador de Vocabulario
      </h1>

      {message && (
        <div
          className='bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl relative mb-6 w-full max-w-2xl text-center shadow-md'
          role='alert'
        >
          <span className='block sm:inline'>{message}</span>
        </div>
      )}

      {/* Section: Gestionar Categorías */}
      <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg mb-8'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          Gestionar Categorías
        </h2>
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          <input
            type='text'
            className='flex-grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
            placeholder='Nombre de la nueva categoría'
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            onClick={addCategory}
            className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
          >
            Crear Categoría
          </button>
        </div>

        <h3 className='text-xl font-semibold text-gray-700 mb-3'>
          Tus Categorías:
        </h3>
        {categories.length === 0 ? (
          <p className='text-gray-500'>
            No hay categorías. Crea una para empezar.
          </p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition duration-200
                                ${
                                  selectedCategoryId === cat.id
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-800 font-bold"
                                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
                                }`}
              >
                {isEditingCategory === cat.id ? (
                  <div className='flex flex-col gap-2'>
                    <input
                      type='text'
                      className='p-2 border border-gray-400 rounded-lg text-gray-800'
                      value={editedCategoryName}
                      onChange={(e) => setEditedCategoryName(e.target.value)}
                    />
                    <div className='flex gap-2'>
                      <button
                        onClick={saveEditedCategory}
                        className='flex-grow bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-2 rounded-lg'
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEditCategory}
                        className='flex-grow bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-2 rounded-lg'
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className='text-left font-semibold'
                    >
                      {cat.name} ({cat.cards ? cat.cards.length : 0} tarjetas)
                    </button>
                    <div className='flex gap-2 justify-end'>
                      <button
                        onClick={() => startEditCategory(cat)}
                        className='bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded-md shadow-sm'
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => confirmDeleteCategory(cat.id)}
                        className='bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded-md shadow-sm'
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Anki Card Display */}
      {selectedCategoryId && currentCategory ? (
        <div className='card-container w-full max-w-md bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 mb-8'>
          <h2 className='text-2xl font-bold text-gray-800'>
            Tema Actual: {currentCategory.name}
          </h2>
          {currentCards.length > 0 ? (
            <>
              <div className='card-content min-h-[120px] flex flex-col justify-center items-center'>
                <div id='question-text' className='card-text'>
                  {currentCard.question}
                </div>
                <div
                  id='answer-text'
                  className={`card-answer ${isAnswerVisible ? "" : "hidden"}`}
                >
                  {currentCard.answer}
                </div>
              </div>

              {/* Audio Speed Buttons */}
              <div className='flex flex-wrap justify-center gap-2'>
                <button
                  onClick={() =>
                    playAudio(
                      currentCard.question,
                      currentCard.langQuestion || "en-US",
                      1
                    )
                  }
                  className='btn btn-audio bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
                >
                  Normal (1x)
                </button>
                <button
                  onClick={() =>
                    playAudio(
                      currentCard.question,
                      currentCard.langQuestion || "en-US",
                      0.8
                    )
                  }
                  className='btn btn-audio bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
                >
                  Lento (0.8x)
                </button>
                <button
                  onClick={() =>
                    playAudio(
                      currentCard.question,
                      currentCard.langQuestion || "en-US",
                      0.5
                    )
                  }
                  className='btn btn-audio bg-green-400 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 text-sm'
                >
                  Muy Lento (0.5x)
                </button>
              </div>

              <button
                onClick={toggleAnswerVisibility}
                className='btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
              >
                {isAnswerVisible ? "Ocultar Traducción" : "Mostrar Traducción"}
              </button>

              <div className='navigation-buttons flex justify-between gap-4'>
                <button
                  onClick={prevCard}
                  className='btn btn-secondary bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 flex-grow'
                >
                  Anterior
                </button>
                <button
                  onClick={nextCard}
                  className='btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 flex-grow'
                >
                  Siguiente
                </button>
              </div>

              <div className='card-counter text-gray-600 text-sm mt-2'>
                Tarjeta {currentCards.length > 0 ? currentCardIndex + 1 : 0} de{" "}
                {currentCards.length}
              </div>
            </>
          ) : (
            <p className='text-gray-500'>
              No hay tarjetas en esta categoría. Añade algunas manualmente.
            </p>
          )}
        </div>
      ) : (
        <div className='w-full max-w-md bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 mb-8'>
          <p className='text-gray-600 text-center'>
            Selecciona una categoría o crea una nueva para empezar a estudiar.
          </p>
        </div>
      )}

      {/* Section: Add Cards */}
      {selectedCategoryId && (
        <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg mb-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>
            Añadir Tarjetas a "{currentCategory?.name || "..."}"
          </h2>

          {/* Manual Card Addition */}
          <h3 className='text-xl font-semibold text-gray-700 mb-3'>
            Añadir Manualmente:
          </h3>
          <div className='flex flex-col gap-4 mb-6'>
            <input
              type='text'
              className='p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Pregunta (Inglés)'
              value={newCardQuestion}
              onChange={(e) => setNewCardQuestion(e.target.value)}
            />
            <input
              type='text'
              className='p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Respuesta (Español)'
              value={newCardAnswer}
              onChange={(e) => setNewCardAnswer(e.target.value)}
            />
            <button
              onClick={addCardManually}
              className='bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200'
            >
              Añadir Tarjeta Manualmente
            </button>
          </div>
        </div>
      )}

      {/* Section: Export Data for Code (No longer strictly for code, but for info) */}
      <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg mb-8'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          Exportar Datos para el Código
        </h2>
        <p className='text-gray-700 mb-4'>
          Ahora, las categorías y tarjetas se gestionan directamente en tu hoja
          de Google Sheets. No necesitas copiar y pegar JSON en el código. Si
          necesitas el JSON de tus datos actuales para depuración o para otro
          propósito, puedes generarlo aquí.
        </p>
        <button
          onClick={generateJsonForCode}
          className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 mb-4'
        >
          Generar JSON de Datos Actuales (solo para visualización)
        </button>
        {exportedJson && (
          <div className='mt-4'>
            <h3 className='text-xl font-semibold text-gray-700 mb-2'>
              JSON Generado:
            </h3>
            <textarea
              readOnly
              className='w-full p-4 border border-gray-300 rounded-xl font-mono text-sm bg-gray-50 resize-y min-h-[200px]'
              value={exportedJson}
              onClick={(e) => e.target.select()} // Select all text on click for easy copy
            ></textarea>
            <p className='text-gray-600 text-sm mt-2'>
              Haz clic en el cuadro de texto para seleccionar todo el JSON y
              copiarlo.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Custom UI) */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center'>
            <p className='text-lg font-semibold text-gray-800 mb-4'>
              ¿Estás seguro que quieres eliminar esta categoría?
            </p>
            <p className='text-sm text-gray-600 mb-6'>
              Esta acción no se puede deshacer y la categoría se perderá.
            </p>
            <div className='flex justify-center gap-4'>
              <button
                onClick={deleteCategory}
                className='bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200'
              >
                Sí, Eliminar
              </button>
              <button
                onClick={cancelDelete}
                className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200'
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
>>>>>>> 47b0af49347ccd92e91c23f53402b994ad81f05d
