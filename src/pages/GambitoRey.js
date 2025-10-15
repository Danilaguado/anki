// src/pages/GambitoRey.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GambitoRey.css";
import BookPreviewModal from "../components/BookPreviewModal";
import Footer from "../components/Footer";

const GambitoRey = () => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);

  const handlePreviewClick = () => {
    setShowPreview(true);
  };

  useEffect(() => {
    if (showPreview) {
      document.body.classList.add("preview-modal-open");
    } else {
      document.body.classList.remove("preview-modal-open");
    }
    return () => {
      document.body.classList.remove("preview-modal-open");
    };
  }, [showPreview]);

  useEffect(() => {
    const revealElements = document.querySelectorAll(".scroll-reveal");

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      revealElements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    } else {
      revealElements.forEach((el) => el.classList.add("visible"));
    }
  }, []);

  const handleCTA = () => {
    navigate("/payment?product=El Gambito del Rey");
  };

  return (
    <div className='gambito-landing-container'>
      {/* Hero Section */}
      <header className='gambito-hero-section'>
        <h1 className='gambito-hero-title scroll-reveal'>
          La Crítica es el Arma del Amateur.{" "}
          <span className='gambito-highlight'>
            La Estrategia es el Arma del Maestro.
          </span>
        </h1>
        <p className='gambito-hero-subtitle scroll-reveal delay-100'>
          Este es el manual de guerra para corregir un error, cambiar un
          comportamiento y ganar influencia sin crear un enemigo.
        </p>
        <div className='gambito-hero-cta-container scroll-reveal delay-200'>
          <img
            src='/assets/gambito-rey-cover.jpg'
            alt='Portada del libro El Gambito del Rey'
            className='gambito-book-cover'
            onError={(e) => {
              e.target.src =
                "https://placehold.co/250x380/1e1e1e/d4af37?text=El+Gambito+del+Rey";
            }}
          />
          <div className='gambito-cta-content'>
            <p className='gambito-cta-quote'>
              "Para el líder que entiende que el poder no se toma, se concede.
              Esta es la guía para que se lo entreguen voluntariamente, incluso
              después de una corrección."
            </p>

            <button onClick={handleCTA} className='gambito-cta-button'>
              Dominar el Juego
            </button>

            <button
              onClick={handlePreviewClick}
              className='gambito-cta-button-preview'
            >
              Ver Vista Previa Gratuita
            </button>

            <p className='gambito-cta-badge'>
              Tácticas probadas por emperadores, diplomáticos y líderes.
            </p>
          </div>
        </div>
      </header>

      {/* Problem Section */}
      <section id='problema' className='gambito-problem-section'>
        <div className='gambito-section-container'>
          <div className='gambito-section-header scroll-reveal'>
            <h2 className='gambito-section-title'>
              ¿Gana la discusión, pero pierde al aliado? Es una victoria que
              cuesta demasiado.
            </h2>
            <p className='gambito-section-subtitle'>
              Cada vez que corrige a alguien, entra en un campo minado. Un paso
              en falso y la relación se deteriora, la confianza se evapora y
              siembra un resentimiento que crecerá en silencio.
            </p>
          </div>
          <div className='gambito-problems-grid'>
            <div className='gambito-problem-card scroll-reveal delay-100'>
              <svg
                className='gambito-problem-icon'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016l-4.236 4.236-1.414-1.414 4.236-4.236zM12 15a3 3 0 100-6 3 3 0 000 6z'
                ></path>
              </svg>
              <h3 className='gambito-problem-title'>La Cicatriz del Ego</h3>
              <p className='gambito-problem-description'>
                Su crítica, por más justificada que sea, ataca la identidad de
                la persona. La herida no se ve, pero el resentimiento se
                convierte en un enemigo silencioso que esperará su momento.
              </p>
            </div>

            <div className='gambito-problem-card scroll-reveal delay-200'>
              <svg
                className='gambito-problem-icon'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                ></path>
              </svg>
              <h3 className='gambito-problem-title'>El Silencio Hostil</h3>
              <p className='gambito-problem-description'>
                Logra que la persona obedezca, pero el precio es la lealtad. El
                silencio que queda después de su 'victoria' no es de acuerdo, es
                de sumisión... y la sumisión siempre busca la revancha.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Revelation Section */}
      <section id='revelacion' className='gambito-revelation-section'>
        <div className='gambito-section-container'>
          <div className='gambito-section-header scroll-reveal'>
            <h2 className='gambito-section-title gambito-revelation-title'>
              El Gambito del Rey:
              <br />
              Ceda el Peón del Ego. Capture la Lealtad de su Oponente.
            </h2>
            <p className='gambito-section-subtitle'>
              Este libro le enseña a ejecutar el movimiento más poderoso del
              tablero humano: sacrificar la satisfacción inmediata de "tener la
              razón" para ganar la influencia a largo plazo y la voluntad del
              otro.
            </p>
          </div>
          <div className='gambito-quotes-container'>
            <div className='gambito-quote-block scroll-reveal delay-100'>
              <div className='gambito-quote-mark'>"</div>
              <blockquote className='gambito-quote-text'>
                "Cualquier tonto puede criticar. Se necesita carácter para
                comprender, desarmar y conquistar."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Mastery Section */}
      <section id='maestria' className='gambito-mastery-section'>
        <div className='gambito-section-container'>
          <div className='gambito-section-header scroll-reveal'>
            <h2 className='gambito-section-title'>
              Su Arsenal de Tácticas de Corrección Estratégica
            </h2>
            <p className='gambito-section-subtitle'>
              Aprenda las técnicas específicas para transformar una
              confrontación en una oportunidad de fortalecer su liderazgo y la
              lealtad de su equipo.
            </p>
          </div>
          <div className='gambito-features-grid'>
            <div className='gambito-feature-card scroll-reveal delay-100'>
              <h3 className='gambito-feature-title'>
                Corregir el Comportamiento, No a la Persona
              </h3>
              <p className='gambito-feature-description'>
                Aprenda a separar el error de la identidad para que la persona
                se una a usted en la búsqueda de una solución, en lugar de
                defenderse de un ataque.
              </p>
            </div>
            <div className='gambito-feature-card scroll-reveal delay-200'>
              <h3 className='gambito-feature-title'>
                Usar Preguntas, No Acusaciones
              </h3>
              <p className='gambito-feature-description'>
                Domine el método socrático para guiar a la persona a descubrir
                su propio error y proponer la solución, logrando un compromiso
                real con el cambio.
              </p>
            </div>
            <div className='gambito-feature-card scroll-reveal delay-300'>
              <h3 className='gambito-feature-title'>
                Preparar el Terreno Antes de Corregir
              </h3>
              <p className='gambito-feature-description'>
                Aplique el "Efecto Franklin" para desarmar la hostilidad y crear
                una conexión antes de iniciar una conversación difícil.
              </p>
            </div>
            <div className='gambito-feature-card scroll-reveal delay-400'>
              <h3 className='gambito-feature-title'>
                Ceder en lo Trivial para Ganar lo Esencial
              </h3>
              <p className='gambito-feature-description'>
                Aprenda a identificar y satisfacer la necesidad de ego de su
                interlocutor para proteger su objetivo principal, una táctica
                magistral demostrada por Miguel Ángel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id='comprar' className='gambito-final-cta-section'>
        <div className='gambito-section-container'>
          <div className='gambito-final-cta-content scroll-reveal'>
            <img
              src='/assets/gambito-rey-cover.jpg'
              alt='Portada del libro El Gambito del Rey'
              className='gambito-final-book-cover'
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/300x450/121212/e0e0e0?text=El%0AGambito%0Adel%0ARey";
              }}
            />
            <h2 className='gambito-final-cta-title'>
              El Poder Verdadero No Se Anuncia. Se Siente.
            </h2>
            <p className='gambito-final-cta-text'>
              Deje de librar batallas innecesarias. Conviértase en el estratega
              que moldea el resultado antes de que la partida comience. Adquiera
              las tácticas para que la gente no solo haga lo que usted dice,
              sino que desee hacerlo.
            </p>
            <button onClick={handleCTA} className='gambito-cta-button final'>
              Obtener mi Ventaja Estratégica
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <BookPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        bookTitle='El Gambito del Rey'
        previewFolder='gambito-rey'
        productName='El Gambito del Rey'
      />
    </div>
  );
};

export default GambitoRey;
