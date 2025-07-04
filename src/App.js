// src/App.js
// Este es el archivo App.js principal que maneja el enrutamiento y la estructura general,
// y ahora también los estados globales de carga, mensajes y audio,
// proporcionados a través de React Context.

import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./index.css"; // Importa los estilos globales para toda la aplicación

// Importa el contexto
import AppContext from "./context/AppContext";

// Importa tus secciones principales
import MainVocabSection from "./MainVocabSection";
import PrincipalPageLessons from "./lesson/PrincipalPageLessons";
// import PracticePage from './Practice/PracticePage'; // ¡ELIMINADO! Ya no existe la página de práctica

// Importar utilidades de audio
import { playAudio, b64toBlob } from "./utils/audioUtils";

// Componente de ejemplo para la pantalla principal o "Home"
const HomeScreen = () => {
  return (
    <div className='home-screen-wrapper'>
      <h1 className='app-title'>Bienvenido a Mi Aplicación de Idiomas</h1>
      <p className='info-text'>
        Esta es la pantalla principal. ¿Qué te gustaría hacer?
      </p>
      <nav className='home-nav-buttons'>
        <Link to='/vocab-trainer' className='button primary-button'>
          Ir al Entrenador de Vocabulario
        </Link>
        <Link to='/lessons' className='button primary-button'>
          Lecciones
        </Link>
        {/* <Link to="/practice" className="button primary-button"> // ¡ELIMINADO! Botón para la sección de Práctica
          Práctica
        </Link> */}
      </nav>
    </div>
  );
};

const App = () => {
  // Estados globales gestionados por App.js
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Estado de carga global
  const audioCache = useRef(new Map()); // Caché de audio global

  // Función para envolver playAudio con sus dependencias globales
  const wrappedPlayAudio = React.useCallback((text, lang) => {
    playAudio(
      text,
      lang,
      audioCache.current,
      b64toBlob,
      setMessage,
      setIsLoading
    );
  }, []);

  // Asegurarse de limpiar los URLs de Blob del caché cuando el componente App se desmonte
  useEffect(() => {
    return () => {
      audioCache.current.forEach((url) => URL.revokeObjectURL(url));
      audioCache.current.clear();
    };
  }, []);

  // Objeto de valores que se proporcionarán a través del Contexto
  const contextValue = {
    appGlobalMessage: message,
    appIsLoading: isLoading,
    onPlayAudio: wrappedPlayAudio,
    setAppMessage: setMessage,
    setAppIsLoading: setIsLoading,
  };

  return (
    <Router>
      <AppContext.Provider value={contextValue}>
        <div className='app-container'>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/vocab-trainer' element={<MainVocabSection />} />
            <Route path='/lessons' element={<PrincipalPageLessons />} />
            {/* <Route path="/practice" element={<PracticePage />} /> // ¡ELIMINADO! Ruta para la página de Práctica */}
          </Routes>
        </div>
      </AppContext.Provider>
    </Router>
  );
};

export default App;
