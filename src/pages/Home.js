// src/pages/Home.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const revealElements = document.querySelectorAll(".scroll-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    revealElements.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleBookClick = (route) => {
    navigate(route);
  };

  return (
    <div className='home-container'>
      {/* Hero Section */}
      <header className='home-hero-section'>
        <div className='home-hero-content'>
          <div className='home-hero-inner'>
            <h1 className='home-hero-title'>
              Domina las 3 áreas clave de tu vida.
            </h1>
            <p className='home-hero-subtitle'>
              La colección definitiva para construir relaciones inquebrantables,
              forjar una disciplina de élite e influir con poder y empatía. Deja
              de reaccionar. Empieza a construir.
            </p>
            <a href='#trilogia' className='home-cta-button'>
              Descubre la Trilogía
            </a>
          </div>
        </div>
      </header>

      {/* Problem Section */}
      <section className='home-problem-section'>
        <div className='home-section-container'>
          <div className='home-section-header scroll-reveal'>
            <h2 className='home-section-title'>
              ¿Sientes que te falta el manual de instrucciones?
            </h2>
            <p className='home-section-subtitle'>
              Te esfuerzas por mejorar, pero caes en los mismos ciclos: la
              confusión en tus relaciones, los proyectos que nunca terminas y
              las conversaciones que acaban en conflicto. No es falta de ganas,
              es falta de estrategia.
            </p>
          </div>
        </div>
      </section>

      {/* Books Showcase Section */}
      <section id='trilogia' className='home-books-section'>
        <div className='home-section-container'>
          <div className='home-section-header scroll-reveal'>
            <h2 className='home-books-title'>La Trilogía del Crecimiento</h2>
            <p className='home-books-subtitle'>
              Tres manuales prácticos, basados en ciencia y psicología,
              diseñados para darte el control en las áreas que definen tu éxito
              y bienestar.
            </p>
          </div>

          <div className='home-books-grid'>
            {/* Book 1: El Código de la Conexión */}
            <div className='home-book-card scroll-reveal delay-100'>
              <img
                src='/assets/codigo-conexion-cover.jpg'
                alt='Portada del libro El Código de la Conexión'
                className='home-book-cover'
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/250x380/1a1a1a/e0e0e0?text=El+C%C3%B3digo+de+la%0AConexi%C3%B3n";
                }}
              />
              <h3 className='home-book-title'>El Código de la Conexión</h3>
              <p className='home-book-badge'>Domina tus Relaciones</p>
              <p className='home-book-description'>
                La guía definitiva para entender el lenguaje no hablado de las
                relaciones, transformar el conflicto en intimidad y convertirte
                en el hombre que ella admira y desea.
              </p>
              <button
                onClick={() => handleBookClick("/codigo-conexion")}
                className='home-book-link'
              >
                Saber Más →
              </button>
            </div>

            {/* Book 2: El Músculo de la Voluntad */}
            <div className='home-book-card scroll-reveal delay-200'>
              <img
                src='/assets/musculo-voluntad-cover.jpg'
                alt='Portada del libro El Músculo de la Voluntad'
                className='home-book-cover'
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/250x380/1a1a1a/e0e0e0?text=El+M%C3%BAsculo+de+la%0AVoluntad";
                }}
              />
              <h3 className='home-book-title'>El Músculo de la Voluntad</h3>
              <p className='home-book-badge'>Domina tu Disciplina</p>
              <p className='home-book-description'>
                El manual de entrenamiento para forjar una autodisciplina a
                prueba de excusas. Deja de depender de la motivación y construye
                sistemas que te hagan imparable.
              </p>
              <button
                onClick={() => handleBookClick("/musculo-voluntad")}
                className='home-book-link'
              >
                Saber Más →
              </button>
            </div>

            {/* Book 3: Habla, Corrige y Conquista */}
            <div className='home-book-card scroll-reveal delay-300'>
              <img
                src='/assets/habla-corrige-conquista-cover.jpg'
                alt='Portada del libro Habla, Corrige y Conquista'
                className='home-book-cover'
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/250x380/1a1a1a/e0e0e0?text=Habla%2C+Corrige%0AY+Conquista";
                }}
              />
              <h3 className='home-book-title'>Habla, Corrige y Conquista</h3>
              <p className='home-book-badge'>Domina tu Influencia</p>
              <p className='home-book-description'>
                El arte de comunicar con poder y empatía. Aprende a corregir sin
                destruir, a inspirar sin exigir y a construir lealtad en cada
                conversación.
              </p>
              <button
                onClick={() => handleBookClick("/habla-corrige-conquista")}
                className='home-book-link'
              >
                Saber Más →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id='comprar' className='home-final-cta-section'>
        <div className='home-section-container'>
          <div className='home-final-cta-content scroll-reveal'>
            <h2 className='home-final-cta-title'>
              Tu transformación empieza aquí.
            </h2>
            <p className='home-final-cta-text'>
              Adquiere la colección completa y obtén el sistema integral para
              construir la vida que deseas. Deja de ser un espectador y
              conviértete en el arquitecto de tu futuro.
            </p>
            <button
              onClick={() => navigate("/payment?product=Trilogía Completa")}
              className='home-cta-button final'
            >
              Adquirir la Trilogía Completa
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='home-footer'>
        <div className='home-footer-container'>
          <p>&copy; 2025 Proyecto Kaizen. Todos los derechos reservados.</p>
          <p className='home-footer-subtitle'>
            Herramientas para una vida de crecimiento continuo.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
