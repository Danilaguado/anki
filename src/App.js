// src/App.js
// Este es el archivo App.js principal que maneja el enrutamiento y la estructura general.

import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./index.css"; // Importa los estilos globales para toda la aplicación

// Importa tu sección principal del entrenador de vocabulario
import MainVocabSection from "./MainVocabSection";
// Importa el nuevo componente de Lecciones con la ruta en minúsculas
import Lessons from "./lessons/lessons"; // Importación del componente Lessons con ruta en minúsculas

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
        {/* Nuevo botón para Lecciones */}
        <Link to='/lessons' className='button primary-button'>
          {" "}
          {/* Usamos la misma clase de botón para consistencia */}
          Lecciones
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
          {/* Nueva ruta para las Lecciones */}
          <Route path='/lessons' element={<Lessons />} />
          {/* Define más rutas aquí si añades otras secciones */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
