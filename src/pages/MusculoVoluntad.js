// src/pages/MusculoVoluntad.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

const MusculoVoluntad = () => {
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
    navigate("/payment?product=El Músculo de la Voluntad");
  };

  return (
    <div className='landing-container musculo-voluntad'>
      {/* Hero Section */}
      <header className='hero-section'>
        <div className='hero-content'>
          <div className='hero-inner'>
            <h1 className='hero-title'>
              La motivación te abandona. La disciplina te construye.
            </h1>
            <p className='hero-subtitle'>
              El manual de entrenamiento, basado en ciencia, para forjar una
              autodisciplina a prueba de excusas y dejar de ser un esclavo de
              tus impulsos.
            </p>
            <div className='hero-cta-container'>
              <img
                src='/assets/musculo-voluntad-cover.jpg'
                alt='Portada del libro El Músculo de la Voluntad'
                className='book-cover'
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/250x380/111827/e0e0e0?text=El+M%C3%BAsculo+de+la%0AVoluntad";
                }}
              />
              <div className='cta-content'>
                <p className='cta-quote'>
                  "Deja de empezar cada lunes y empieza a construir cada día. La
                  disciplina es un músculo, y este es tu gimnasio."
                </p>
                <button onClick={handleCTAClick} className='cta-button'>
                  Forja tu Voluntad Hoy
                </button>
                <p className='cta-badge'>
                  BEST SELLER • Basado en psicología y neurociencia.
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
              Si este ciclo te destruye, no es tu culpa. Es tu sistema.
            </h2>
            <p className='section-subtitle'>
              Has sido víctima de la gran mentira: que la disciplina es un don.
              En realidad, es una habilidad que se entrena. Estás perdiendo una
              batalla neurológica que no sabías que estabas luchando.
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
                  d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
                ></path>
              </svg>
              <h3 className='problem-title'>El Proyecto Abandonado</h3>
              <p className='problem-description'>
                Empiezas con una energía arrolladora, pero a la tercera semana,
                ese curso, dieta o rutina es un recuerdo incómodo que alimenta
                tu frustración.
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
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                ></path>
              </svg>
              <h3 className='problem-title'>La Procrastinación Crónica</h3>
              <p className='problem-description'>
                Aplazas lo importante por el alivio temporal de la distracción,
                solo para que la tarea regrese más grande y cargada de ansiedad.
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
                  d='M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
                ></path>
              </svg>
              <h3 className='problem-title'>La Fatiga de Decisión</h3>
              <p className='problem-description'>
                Llegas al final del día con la intención de avanzar, pero tu
                "fuerza de voluntad" está agotada y eliges, una vez más, la
                comodidad inmediata.
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
              La Voluntad no es Magia.
              <br />
              Es un Músculo.
            </h2>
            <p className='revelation-subtitle'>
              Este libro no te dará motivación barata. Te entregará el manual de
              operaciones de tu cerebro para que ganes la batalla contra tus
              impulsos y construyas sistemas que funcionen incluso en tus peores
              días.
            </p>
          </div>

          <div className='quotes-container'>
            <div className='quote-block scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "La fuerza de voluntad es un recurso finito que se agota. Deja
                de culparte por ello y empieza a usar estrategias inteligentes
                para conservarla para lo que de verdad importa."
              </blockquote>
            </div>

            <div className='quote-block quote-reverse scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "Cada vez que eliges la incomodidad a corto plazo de la
                disciplina, estás comprando una porción de libertad a largo
                plazo. Estás votando por tu futuro yo."
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
              Conviértete en el Arquitecto de tu Disciplina
            </h2>
            <p className='section-subtitle'>
              Aprenderás a ser más inteligente, no más duro. A construir
              sistemas, no a depender de la inspiración fugaz.
            </p>
          </div>

          <div className='features-grid'>
            <div className='feature-card scroll-reveal delay-100'>
              <h3 className='feature-title'>El Sistema Anti-Inercia</h3>
              <p className='feature-description'>
                Domina la "Regla de los 2 Minutos" para hacer que empezar sea
                tan fácil que sea imposible decir que no.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-200'>
              <h3 className='feature-title'>Hábitos en Piloto Automático</h3>
              <p className='feature-description'>
                Usa el "Apilamiento de Hábitos" para anclar nuevas rutinas a las
                que ya tienes, construyendo sobre una base sólida.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-300'>
              <h3 className='feature-title'>Arquitectura de la Elección</h3>
              <p className='feature-description'>
                Diseña tu entorno para que los buenos hábitos sean inevitables y
                los malos, casi imposibles.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-400'>
              <h3 className='feature-title'>La Mentalidad "Anti-Fracaso"</h3>
              <p className='feature-description'>
                Aprende a usar la autocompasión como una herramienta estratégica
                para recuperarte de los fallos y nunca saltarte un hábito dos
                veces.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-500'>
              <h3 className='feature-title'>El Arte de la Consistencia</h3>
              <p className='feature-description'>
                Implementa el método de Seinfeld "No Rompas la Cadena" para
                enfocarte en el progreso diario, no en la perfección.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-600'>
              <h3 className='feature-title'>Ganar la Guerra a las Excusas</h3>
              <p className='feature-description'>
                Domina el reencuadre cognitivo para cambiar la narrativa que te
                cuentas y transformar los obstáculos en oportunidades.
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
              src='/assets/musculo-voluntad-cover.jpg'
              alt='Portada del libro El Músculo de la Voluntad'
              className='final-book-cover'
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/300x450/111827/e0e0e0?text=El+M%C3%BAsculo+de+la%0AVoluntad";
              }}
            />
            <h2 className='final-cta-title'>
              La disciplina no es una prisión. Es el precio de tu libertad.
            </h2>
            <p className='final-cta-text'>
              La libertad financiera, física y profesional se construye con la
              disciplina diaria. Deja de desearlo. Empieza a construirlo. Tu yo
              del futuro te lo agradecerá.
            </p>
            <button onClick={handleCTAClick} className='cta-button final'>
              Empieza a Construir Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='footer'>
        <div className='footer-container'>
          <p>&copy; 2025 Proyecto Kaizen. Todos los derechos reservados.</p>
          <p className='footer-subtitle'>
            Un sistema para el crecimiento personal y la consecución de metas.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MusculoVoluntad;
