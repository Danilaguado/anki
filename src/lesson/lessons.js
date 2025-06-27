// src/Lessons/Lessons.js
import React from "react";
import { Link } from "react-router-dom"; // Para el botón de regreso

const Lessons = () => {
  return (
    <div className='lessons-page-wrapper'>
      <h1 className='app-title'>Welcome</h1>
      <p className='info-text'>This is your lessons section.</p>
      <Link to='/' className='button back-button'>
        Volver a la pantalla principal
      </Link>
    </div>
  );
};

export default Lessons;
