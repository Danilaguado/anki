// src/App.js

// CAMBIO 1: Importa useMemo
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import "./index.css";

import AppContext from "./context/AppContext";
import MainVocabSection from "./MainVocabSection";
import PrincipalPageLessons from "./lesson/PrincipalPageLessons";
import LessonDisplayPage from "./lesson/LessonDisplayPage";
import { playAudio, b64toBlob } from "./utils/audioUtils";
import BottomNavigationBar from "./components/BottomNavigationBar";

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
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const audioCache = useRef(new Map());

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

  useEffect(() => {
    return () => {
      audioCache.current.forEach((url) => URL.revokeObjectURL(url));
      audioCache.current.clear();
    };
  }, []);

  // CAMBIO 2: Envuelve la creación del objeto de contexto en useMemo
  // Esto asegura que el objeto contextValue solo se cree de nuevo si
  // message, isLoading, o wrappedPlayAudio cambian.
  const contextValue = useMemo(
    () => ({
      appGlobalMessage: message,
      appIsLoading: isLoading,
      onPlayAudio: wrappedPlayAudio,
      setAppMessage: setMessage,
      setAppIsLoading: setIsLoading,
    }),
    [message, isLoading, wrappedPlayAudio] // Dependencias de useMemo
  );

  return (
    <Router>
      {/* El proveedor ahora usa el valor memorizado, rompiendo el bucle */}
      <AppContext.Provider value={contextValue}>
        <div className='app-container'>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/vocab-trainer' element={<MainVocabSection />} />
            <Route path='/lessons' element={<PrincipalPageLessons />} />
            <Route path='/lessons/:lessonId' element={<LessonDisplayPage />} />
          </Routes>
          <ConditionalBottomNavigationBar />
        </div>
      </AppContext.Provider>
    </Router>
  );
};

const ConditionalBottomNavigationBar = () => {
  const location = useLocation();
  const shouldShowBottomNav = !(
    location.pathname.startsWith("/lessons/") &&
    location.pathname !== "/lessons"
  );
  return shouldShowBottomNav ? <BottomNavigationBar /> : null;
};

export default App;
