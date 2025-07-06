// src/App.js

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./index.css";

import AppContext from "./context/AppContext";
import MainVocabSection from "./MainVocabSection";
import PrincipalPageLessons from "./lesson/PrincipalPageLessons";
import LessonDisplayPage from "./lesson/LessonDisplayPage";
import { playAudio, b64toBlob } from "./utils/audioUtils";
import BottomNavigationBar from "./components/BottomNavigationBar";

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

  // NUEVO: Función para generar feedback háptico (vibración)
  const triggerHapticFeedback = (pattern = [5]) => {
    // Un patrón de 5ms es muy sutil
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    return () => {
      audioCache.current.forEach((url) => URL.revokeObjectURL(url));
      audioCache.current.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      appGlobalMessage: message,
      appIsLoading: isLoading,
      onPlayAudio: wrappedPlayAudio,
      setAppMessage: setMessage,
      setAppIsLoading: setIsLoading,
      onVibrate: triggerHapticFeedback, // Se añade la función de vibración al contexto
    }),
    [message, isLoading, wrappedPlayAudio]
  );

  return (
    <Router>
      <AppContext.Provider value={contextValue}>
        <div className='app-container'>
          <Routes>
            {/* CAMBIO: La ruta principal ahora es la página de lecciones */}
            <Route path='/' element={<PrincipalPageLessons />} />
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
