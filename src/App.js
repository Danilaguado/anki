// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./index.css"; // Importa los estilos globales para toda la aplicación

// Importa tu nueva sección principal del entrenador de vocabulario
import MainVocabSection from "./MainVocabSection";

// Un componente de ejemplo para la pantalla principal o "Home"
const HomeScreen = () => {
  return (
    <div className='home-screen-wrapper'>
      {" "}
      {/* Un nuevo contenedor para esta pantalla */}
      <h1 className='app-title'>Bienvenido a Mi Aplicación de Idiomas</h1>
      <p className='info-text'>
        Esta es la pantalla principal. ¿Qué te gustaría hacer?
      </p>
      <nav className='home-nav-buttons'>
        <Link to='/vocab-trainer' className='button primary-button'>
          Ir al Entrenador de Vocabulario
        </Link>
        {/* Aquí podrías añadir más enlaces a otras secciones de tu aplicación */}
        {/* <Link to="/other-section" className="button secondary-button">Otra Sección</Link> */}
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      {/* El div 'app-container' ahora envuelve todo el contenido renderizado por las rutas */}
      <div className='app-container'>
        <Routes>
          <Route path='/' element={<HomeScreen />} />
          <Route path='/vocab-trainer' element={<MainVocabSection />} />
          {/* Define más rutas aquí si añades otras secciones */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
