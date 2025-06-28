// src/App.js
// Este es el archivo App.js principal que maneja el enrutamiento y la estructura general,
// y ahora también los estados globales de carga, mensajes y audio.

import React, { useState, useEffect, useRef } from "react"; // Necesario para los estados globales
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./index.css"; // Importa los estilos globales para toda la aplicación

// Importa tus secciones principales
import MainVocabSection from "./MainVocabSection";
import PrincipalPageLessons from "./lesson/PrincipalPageLessons";

// Importar utilidades de audio y texto para uso global
import { playAudio, b64toBlob } from "./utils/audioUtils";
import { normalizeText, renderClickableText } from "./utils/textUtils"; // También se pasarán si es necesario

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
  // Estados globales movidos de MainVocabSection a App.js
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Estado de carga global
  const audioCache = useRef(new Map()); // Caché de audio global

  // Función para envolver playAudio con sus dependencias globales
  const wrappedPlayAudio = (text, lang) =>
    playAudio(
      text,
      lang,
      audioCache.current,
      b64toBlob,
      setMessage,
      setIsLoading
    );

  // Asegurarse de limpiar los URLs de Blob del caché cuando el componente App se desmonte
  // (Aunque App generalmente no se desmonta en una SPA, es buena práctica si tuvieras lógica para ello)
  useEffect(() => {
    return () => {
      audioCache.current.forEach((url) => URL.revokeObjectURL(url));
      audioCache.current.clear();
    };
  }, []);

  return (
    <Router>
      <div className='app-container'>
        {/* Aquí puedes mostrar un MessageDisplay global si lo deseas, para mensajes que persistan entre rutas */}
        {/* <MessageDisplay message={message} isLoading={isLoading} /> */}

        <Routes>
          <Route path='/' element={<HomeScreen />} />
          {/* Pasar las props globales a MainVocabSection */}
          <Route
            path='/vocab-trainer'
            element={
              <MainVocabSection
                onPlayAudio={wrappedPlayAudio}
                setAppMessage={setMessage}
                setAppIsLoading={setIsLoading}
                appIsLoading={isLoading} // Pasar el estado booleano de carga
              />
            }
          />
          {/* Pasar las props globales a PrincipalPageLessons */}
          <Route
            path='/lessons'
            element={
              <PrincipalPageLessons
                onPlayAudio={wrappedPlayAudio}
                setAppMessage={setMessage}
                setAppIsLoading={setIsLoading}
                appIsLoading={isLoading} // Pasar el estado booleano de carga
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
