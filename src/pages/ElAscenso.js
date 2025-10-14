// src/pages/ElAscenso.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

const ElAscenso = () => {
  const navigate = useNavigate();

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
    navigate("/payment?product=El Ascenso");
  };

  return (
    <div className='landing-container el-ascenso'>
      {/* Hero Section */}
      <header className='hero-section'>
        <div className='hero-content'>
          <div className='hero-inner'>
            <h1 className='hero-title scroll-reveal'>
              Le ascendieron por ser un experto en{" "}
              <span style={{ color: "#8b5cf6" }}>hacer</span>. El éxito ahora
              exige que domine el arte de{" "}
              <span style={{ color: "#8b5cf6" }}>liderar</span>.
            </h1>
            <p className='hero-subtitle scroll-reveal delay-100'>
              Bienvenido a la paradoja del ascenso. Este es el manual de
              supervivencia y el mapa para prosperar en su nuevo rol.
            </p>
          </div>

          <div className='hero-cta-container scroll-reveal delay-200'>
            <img
              src='/assets/el-ascenso-cover.jpg'
              alt='Portada del libro El Ascenso'
              className='book-cover'
            />
            <div className='cta-content'>
              <p className='cta-quote'>
                "El manual definitivo para el nuevo líder que busca transformar
                la duda en confianza y la gestión en verdadero impacto."
              </p>
              <button onClick={handleCTA} className='cta-button'>
                Iniciar mi Ascenso
              </button>
              <p className='cta-badge'>
                Basado en psicología, neurociencia y lecciones reales.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Problem Section */}
      <section className='problem-section'>
        <div className='section-container'>
          <div className='section-header scroll-reveal'>
            <h2 className='section-title'>
              ¿La calma del ascenso se siente como el ojo del huracán?
            </h2>
            <p className='section-subtitle'>
              Si se identifica con estas situaciones, no es una señal de
              debilidad. Es la prueba de que está en medio de la transición más
              desafiante de su carrera.
            </p>
          </div>

          <div className='problems-grid'>
            <div className='problem-card scroll-reveal delay-100'>
              <svg
                className='problem-icon'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                ></path>
              </svg>
              <h3 className='problem-title'>El Síndrome del Impostor</h3>
              <p className='problem-description'>
                Ayer eran sus colegas, hoy debe dirigirlos. Una voz en su cabeza
                le pregunta si de verdad está a la altura y teme que en
                cualquier momento "descubran el fraude".
              </p>
            </div>

            <div className='problem-card scroll-reveal delay-200'>
              <svg
                className='problem-icon'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                ></path>
              </svg>
              <h3 className='problem-title'>La Adrenalina Perdida</h3>
              <p className='problem-description'>
                Su cerebro extraña la gratificación de completar tareas. Ahora
                sus metas son abstractas —"motivar", "desarrollar"— y al final
                del día siente que no ha "hecho" nada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Revelation Section */}
      <section className='revelation-section'>
        <div className='section-container'>
          <div className='section-header scroll-reveal'>
            <h2 className='section-title revelation-title'>
              Deje de ser el mejor ejecutor.
              <br />
              Conviértase en el mejor líder.
            </h2>
            <p className='section-subtitle'>
              Este libro no se trata de añadir más tareas a su día. Se trata de
              un cambio fundamental de identidad: de experto a catalizador.
            </p>
          </div>

          <div className='quotes-container'>
            <div className='quote-block scroll-reveal delay-100'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                El verdadero líder no es el que tiene más seguidores, sino el
                que crea más líderes.
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Mastery Section */}
      <section className='mastery-section'>
        <div className='section-container'>
          <div className='section-header scroll-reveal'>
            <h2 className='section-title'>
              Domine las Habilidades Esenciales del Liderazgo
            </h2>
            <p className='section-subtitle'>
              Aprenda a navegar los desafíos clave de su nuevo rol con
              estrategias prácticas y accionables.
            </p>
          </div>

          <div className='features-grid'>
            <div className='feature-card scroll-reveal delay-100'>
              <h3 className='feature-title'>Arquitectura de la Confianza</h3>
              <p className='feature-description'>
                Utilice el Plan de Vuelo 30-60-90 para escuchar, aprender y
                ganar el respeto de su equipo antes de implementar cambios.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-200'>
              <h3 className='feature-title'>
                La Vulnerabilidad como Superpoder
              </h3>
              <p className='feature-description'>
                Descubra por qué admitir que no tiene todas las respuestas le
                hace un líder más fuerte y confiable, no más débil.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-300'>
              <h3 className='feature-title'>Delegar para Multiplicar</h3>
              <p className='feature-description'>
                Deje de ser el "héroe" que lo hace todo. Aprenda a delegar para
                potenciar a su equipo y liberar su propio tiempo para la
                estrategia.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-400'>
              <h3 className='feature-title'>Feedback que Construye</h3>
              <p className='feature-description'>
                Transforme las conversaciones difíciles en oportunidades de
                crecimiento, dando feedback que motiva en lugar de destruir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className='final-cta-section'>
        <div className='section-container'>
          <div className='final-cta-content scroll-reveal'>
            <img
              src='/assets/el-ascenso-cover.jpg'
              alt='Portada del libro El Ascenso'
              className='final-book-cover'
            />
            <h2 className='final-cta-title'>
              Su equipo espera un líder, no un jefe.
            </h2>
            <p className='final-cta-text'>
              No tiene que descifrarlo solo. "El Ascenso" le da el marco, las
              herramientas y la confianza para convertirse en el líder que su
              equipo necesita y que usted aspira a ser.
            </p>
            <button onClick={handleCTA} className='cta-button final'>
              Quiero mi Guía Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='footer'>
        <div className='footer-container'>
          <p>&copy; 2025 Proyecto Kaizen. Todos los derechos reservados.</p>
          <p className='footer-subtitle'>
            Estrategias para dominar la confianza, la comunicación y el
            conflicto.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ElAscenso;
