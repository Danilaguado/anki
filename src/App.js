// src/App.js
// Este es el archivo App.js principal que maneja el enrutamiento y la estructura general,
// y ahora también los estados globales de carga, mensajes y audio,
// proporcionados a través de React Context.

import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom"; // ¡NUEVO! Importa useLocation
import "./index.css"; // Importa los estilos globales para toda la aplicación

// Importa el contexto
import AppContext from "./context/AppContext";

// Importa tus secciones principales
import MainVocabSection from "./MainVocabSection";
import PrincipalPageLessons from "./lesson/PrincipalPageLessons";
// Importa la nueva página para mostrar lecciones
import LessonDisplayPage from "./lesson/LessonDisplayPage";

// Importar utilidades de audio
import { playAudio, b64toBlob } from "./utils/audioUtils";

// Importa la barra de navegación inferior
import BottomNavigationBar from "./components/BottomNavigationBar";

// Componente de ejemplo para la pantalla principal o "Home"
const HomeScreen = () => {
  return (
    <div className='home-screen-wrapper'>
      <h1 className='app-title'>Bienvenido a Mi Aplicación de Idiomas</h1>
      <p className='info-text'>
        Esta es la pantalla principal. ¿Qué te gustaría hacer?
      </p>
      {/* Botones de navegación principales (pueden ser reemplazados por la barra inferior en móvil) */}
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
  const location = useLocation(); // ¡NUEVO! Hook para obtener la ubicación actual
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

  // Determina si la barra de navegación debe mostrarse
  // No se mostrará si la ruta actual es /lessons/exercises
  const shouldShowBottomNav = location.pathname !== "/lessons/exercises";

  return (
    <Router>
      <AppContext.Provider value={contextValue}>
        <div className='app-container'>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/vocab-trainer' element={<MainVocabSection />} />
            <Route path='/lessons' element={<PrincipalPageLessons />} />
            {/* Ruta fija para la visualización de lecciones */}
            <Route path='/lessons/exercises' element={<LessonDisplayPage />} />
          </Routes>
          {/* ¡NUEVO! Renderiza la barra de navegación inferior condicionalmente */}
          {shouldShowBottomNav && <BottomNavigationBar />}
        </div>
      </AppContext.Provider>
    </Router>
  );
};

export default App;
