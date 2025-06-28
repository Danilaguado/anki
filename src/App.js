// src/App.js
// Este es el archivo App.js principal que maneja el enrutamiento y la estructura general,
// y ahora también los estados globales de carga, mensajes y audio,
// proporcionados a través de React Context.

import React, { useState, useEffect, useRef } from "react"; // Necesario para los estados globales
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./index.css"; // Importa los estilos globales para toda la aplicación

// Importa el contexto
import AppContext from "./context/AppContext";

// Importa tus secciones principales
import MainVocabSection from "./MainVocabSection";
import PrincipalPageLessons from "./lesson/PrincipalPageLessons";

// Importar utilidades de audio (solo playAudio y b64toBlob son usados aquí)
import { playAudio, b64toBlob } from "./utils/audioUtils";
// normalizeText, renderClickableText no son necesarios aquí a menos que se usen directamente.
// Se seguirán importando donde se necesiten realmente.

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
  // Se memoiza para evitar que cambie en cada render si sus dependencias no cambian.
  const wrappedPlayAudio = React.useCallback((text, lang) => {
    playAudio(
      text,
      lang,
      audioCache.current,
      b64toBlob,
      setMessage,
      setIsLoading
    );
  }, []); // Dependencias vacías porque las funciones de set estado son estables.

  // Asegurarse de limpiar los URLs de Blob del caché cuando el componente App se desmonte
  // (Aunque App generalmente no se desmonta en una SPA, es buena práctica si tuvieras lógica para ello)
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
      {/* Envuelve toda la aplicación con el AppContext.Provider */}
      <AppContext.Provider value={contextValue}>
        <div className='app-container'>
          {/* Opcional: Puedes mostrar un MessageDisplay global aquí si quieres que los mensajes aparezcan en todas las rutas */}
          {/* <MessageDisplay message={message} isLoading={isLoading} /> */}

          <Routes>
            <Route path='/' element={<HomeScreen />} />
            {/* Los componentes ahora consumirán el contexto directamente */}
            <Route path='/vocab-trainer' element={<MainVocabSection />} />
            <Route path='/lessons' element={<PrincipalPageLessons />} />
          </Routes>
        </div>
      </AppContext.Provider>
    </Router>
  );
};

export default App;
