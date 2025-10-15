// src/components/Footer.js
import React from "react";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className='footer'>
      <div className='footer-container'>
        <p>
          Este sitio web provee de herramientas para el crecimiento personal y
          relacional. <br />
          Su contenido es educativo y no garantiza resultados específicos. El
          lector asume toda la responsabilidad por la aplicación de la
          información.
          <br />
          <a href='/terms'>Ver Términos y Condiciones </a>
          <br />
          &copy; 2025 Proyecto Kaizen. Todos los derechos reservados.
        </p>
        <p className='footer-subtitle'>
          Herramientas para una vida de crecimiento continuo.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
