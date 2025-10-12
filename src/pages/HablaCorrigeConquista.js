// src/pages/HablaCorrigeConquista.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

const HablaCorrigeConquista = () => {
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

  const handleCTAClick = () => {
    navigate("/payment?product=Habla, Corrige y Conquista");
  };

  return (
    <div className='landing-container habla-corrige-conquista'>
      {/* Hero Section */}
      <header className='hero-section'>
        <div className='hero-content'>
          <div className='hero-inner'>
            <h1 className='hero-title'>
              Tus palabras construyen o destruyen. Es tu elección.
            </h1>
            <p className='hero-subtitle'>
              Las estrategias reales para comunicar, corregir e influir con
              poder, sin generar resentimiento ni perder a nadie en el intento.
            </p>
            <div className='hero-cta-container'>
              <img
                src='/assets/habla-corrige-conquista-cover.jpg'
                alt='Portada del libro Habla, Corrige y Conquista'
                className='book-cover'
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/250x380/1a1a1a/e0e0e0?text=Habla%2C+Corrige%0AY+Conquista";
                }}
              />
              <div className='cta-content'>
                <p className='cta-quote'>
                  "El manual definitivo para líderes, padres y cualquiera que
                  desee transformar sus relaciones a través del poder de la
                  comunicación empática."
                </p>
                <button onClick={handleCTAClick} className='cta-button'>
                  Domina el Arte de Influir
                </button>
                <p className='cta-badge'>
                  BEST SELLER • Basado en historias y psicología real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Problem Section */}
      <section id='problema' className='problem-section'>
        <div className='section-container'>
          <div className='section-header scroll-reveal'>
            <h2 className='section-title'>
              ¿Tus intentos de "ayudar" terminan en conflicto? No estás solo.
            </h2>
            <p className='section-subtitle'>
              Corregir es necesario, pero la forma en que lo hacemos puede
              fracturar la confianza y levantar muros. Si reconoces estas
              situaciones, este libro es para ti.
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
                  d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                ></path>
              </svg>
              <h3 className='problem-title'>La Muralla Defensiva</h3>
              <p className='problem-description'>
                Apenas empiezas a dar feedback, la otra persona se justifica, te
                interrumpe o encuentra excusas. Tu mensaje nunca llega.
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
                  d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                ></path>
              </svg>
              <h3 className='problem-title'>El Silencio Incómodo</h3>
              <p className='problem-description'>
                Después de corregir a alguien, se instala una tensión. La
                persona se distancia, la confianza se erosiona y la relación se
                enfría.
              </p>
            </div>

            <div className='problem-card scroll-reveal delay-300'>
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
                  d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
                ></path>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                ></path>
              </svg>
              <h3 className='problem-title'>La Motivación Destruida</h3>
              <p className='problem-description'>
                Tu intención era motivar, pero tu crítica, por válida que fuera,
                desinfló el entusiasmo de la persona, dejándola herida y sin
                ganas de mejorar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Revelation Section */}
      <section id='revelacion' className='revelation-section'>
        <div className='section-container'>
          <div className='section-header scroll-reveal'>
            <h2 className='revelation-title'>
              No critiques, no condenes, no te quejes.
              <br />
              Lidera.
            </h2>
            <p className='revelation-subtitle'>
              Este libro te enseña el arte perdido de la corrección empática. No
              se trata de evitar el conflicto, sino de transformarlo en una
              oportunidad para construir lealtad y confianza.
            </p>
          </div>

          <div className='quotes-container'>
            <div className='quote-block scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "Las personas no se abren a los gritos, se abren al respeto. No
                cambian desde la humillación, cambian desde la comprensión."
              </blockquote>
            </div>

            <div className='quote-block quote-reverse scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "El tono con que corriges pesa más que las palabras que usas.
                Las relaciones se quiebran más por CÓMO se dice algo... que por
                LO QUE se dice."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Mastery Section */}
      <section id='maestria' className='mastery-section'>
        <div className='section-container'>
          <div className='section-header scroll-reveal'>
            <h2 className='section-title'>
              Conviértete en un Comunicador Maestro
            </h2>
            <p className='section-subtitle'>
              Aprende a entregar verdades incómodas de una manera que inspire el
              cambio en lugar de provocar una guerra.
            </p>
          </div>

          <div className='features-grid'>
            <div className='feature-card scroll-reveal delay-100'>
              <h3 className='feature-title'>Corregir sin Destruir</h3>
              <p className='feature-description'>
                Aprende a separar a la persona del comportamiento para corregir
                el error sin dañar la relación ni el ego.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-200'>
              <h3 className='feature-title'>El Poder de Preguntar</h3>
              <p className='feature-description'>
                Descubre cómo una pregunta bien formulada puede llevar a la
                autorreflexión y al cambio, siendo más efectiva que diez
                críticas.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-300'>
              <h3 className='feature-title'>Empatía Estratégica</h3>
              <p className='feature-description'>
                Entiende la psicología detrás de la negación y la defensa para
                saber cómo navegar conversaciones difíciles con calma y respeto.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-400'>
              <h3 className='feature-title'>Construir Lealtad</h3>
              <p className='feature-description'>
                Transforma cada corrección en una oportunidad para demostrar
                respeto y fortalecer el vínculo, generando aliados en lugar de
                adversarios.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-500'>
              <h3 className='feature-title'>Inspirar en lugar de Exigir</h3>
              <p className='feature-description'>
                Adopta las técnicas de líderes como Nelson Mandela y Phil
                Jackson para motivar a otros a alcanzar su mejor versión.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-600'>
              <h3 className='feature-title'>Dominar el Tono</h3>
              <p className='feature-description'>
                Comprende por qué el "cómo" dices las cosas es más importante
                que el "qué", y aprende a modular tu comunicación para conectar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id='comprar' className='final-cta-section'>
        <div className='section-container'>
          <div className='final-cta-content scroll-reveal'>
            <img
              src='/assets/habla-corrige-conquista-cover.jpg'
              alt='Portada del libro Habla, Corrige y Conquista'
              className='final-book-cover'
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/300x450/1a1a1a/e0e0e0?text=Habla%2C+Corrige%0AY+Conquista";
              }}
            />
            <h2 className='final-cta-title'>
              El éxito está ligado a tu capacidad de relacionarte con las
              personas.
            </h2>
            <p className='final-cta-text'>
              Cualquier tonto puede criticar. Se necesita carácter para
              comprender, motivar y construir. Conviértete en la persona a la
              que todos escuchan y respetan.
            </p>
            <button onClick={handleCTAClick} className='cta-button final'>
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
            Estrategias para comunicarte con poder y empatía.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HablaCorrigeConquista;
