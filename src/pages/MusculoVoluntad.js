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
              La motivación es pasajera. La disciplina es permanente.
            </h1>
            <p className='hero-subtitle'>
              El sistema científico para construir una autodisciplina
              inquebrantable, eliminar la procrastinación y forjar hábitos que
              te conviertan en imparable.
            </p>
            <div className='hero-cta-container'>
              <img
                src='/assets/musculo-voluntad-cover.jpg'
                alt='Portada del libro El Músculo de la Voluntad'
                className='book-cover'
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/250x380/1a1a1a/e0e0e0?text=El+M%C3%BAsculo+de+la%0AVoluntad";
                }}
              />
              <div className='cta-content'>
                <p className='cta-quote'>
                  "El manual definitivo para dejar de depender de la motivación
                  y construir sistemas que te hagan avanzar incluso en tus
                  peores días."
                </p>
                <button onClick={handleCTAClick} className='cta-button'>
                  Forja tu Disciplina Ahora
                </button>
                <p className='cta-badge'>
                  BEST SELLER • Basado en neurociencia y psicología del
                  comportamiento.
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
              ¿Te suena familiar? No estás solo en esta batalla.
            </h2>
            <p className='section-subtitle'>
              Millones de personas luchan con la misma trampa: empiezan con
              entusiasmo, pero terminan rindiéndose cuando las cosas se ponen
              difíciles. No es falta de deseo, es falta de sistema.
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
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                ></path>
              </svg>
              <h3 className='problem-title'>El Ciclo de la Procrastinación</h3>
              <p className='problem-description'>
                Postergás lo importante hasta el último momento. Las tareas se
                acumulan y terminas abrumado, prometiendo que "mañana será
                diferente".
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
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                ></path>
              </svg>
              <h3 className='problem-title'>La Montaña Rusa Motivacional</h3>
              <p className='problem-description'>
                Empezás proyectos con gran entusiasmo, pero cuando la novedad se
                desvanece, abandonás. Dependés de sentirte "inspirado" para
                actuar.
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
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                ></path>
              </svg>
              <h3 className='problem-title'>Hábitos que Nunca Pegan</h3>
              <p className='problem-description'>
                Intentás crear rutinas saludables, pero después de unos días o
                semanas, volvés a los viejos patrones. El cambio parece
                imposible.
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
              La Disciplina No Es un Don.
              <br />
              Es una Habilidad Entrenable.
            </h2>
            <p className='revelation-subtitle'>
              Este libro te enseña el sistema exacto para construir
              autodisciplina basado en décadas de investigación en neurociencia
              y psicología del comportamiento. No necesitás fuerza de voluntad
              sobrehumana, necesitás el sistema correcto.
            </p>
          </div>

          <div className='quotes-container'>
            <div className='quote-block scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "La autodisciplina no se trata de castigarte. Se trata de amarte
                lo suficiente como para hacer lo difícil hoy, para vivir mejor
                mañana."
              </blockquote>
            </div>

            <div className='quote-block quote-reverse scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "No es la motivación lo que separa a los exitosos de los que
                fracasan. Es la capacidad de actuar incluso cuando no tienen
                ganas. Eso es disciplina."
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
              Conviértete en una Máquina de Ejecución
            </h2>
            <p className='section-subtitle'>
              Aprende a construir sistemas que hagan que el progreso sea
              inevitable, incluso en los días en que no tienes ganas de nada.
            </p>
          </div>

          <div className='features-grid'>
            <div className='feature-card scroll-reveal delay-100'>
              <h3 className='feature-title'>Dominar la Procrastinación</h3>
              <p className='feature-description'>
                Descubre las causas neurológicas reales de la procrastinación y
                las estrategias específicas para neutralizarla antes de que tome
                control.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-200'>
              <h3 className='feature-title'>
                Diseño de Hábitos Inquebrantables
              </h3>
              <p className='feature-description'>
                Aplica el método científico de formación de hábitos: desde la
                señal, pasando por la rutina, hasta la recompensa que cementa el
                comportamiento.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-300'>
              <h3 className='feature-title'>El Poder de los Sistemas</h3>
              <p className='feature-description'>
                Aprende a construir entornos y rutinas que hagan que las
                decisiones correctas sean automáticas, eliminando la fatiga de
                decisión.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-400'>
              <h3 className='feature-title'>Gestión de la Energía Mental</h3>
              <p className='feature-description'>
                Optimiza tu fuerza de voluntad entendiendo cuándo estás en tu
                pico de energía y cuándo necesitás protegerte de las
                tentaciones.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-500'>
              <h3 className='feature-title'>Resiliencia ante el Fracaso</h3>
              <p className='feature-description'>
                Desarrolla la mentalidad que convierte los tropiezos en
                aprendizaje, permitiéndote recuperarte más rápido y más fuerte
                cada vez.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-600'>
              <h3 className='feature-title'>El Arte de la Consistencia</h3>
              <p className='feature-description'>
                Domina las estrategias para mantenerte en marcha día tras día,
                convirtiendo la acción disciplinada en tu identidad, no en una
                tarea.
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
                  "https://placehold.co/300x450/1a1a1a/e0e0e0?text=El+M%C3%BAsculo+de+la%0AVoluntad";
              }}
            />
            <h2 className='final-cta-title'>
              El momento de construir tu disciplina es ahora.
            </h2>
            <p className='final-cta-text'>
              Deja de esperar el "momento perfecto". Deja de confiar en la
              motivación. Construye el sistema que te haga imparable. Tu futuro
              yo te lo agradecerá.
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
            El sistema científico para forjar una disciplina inquebrantable.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MusculoVoluntad;
