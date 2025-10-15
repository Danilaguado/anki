// src/pages/MusculoVoluntad.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";
import BookPreviewModal from "../components/BookPreviewModal";
import Footer from "../components/Footer";

const MusculoVoluntad = () => {
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
              La disciplina no es un don. Es un músculo. Y tú puedes entrenarlo.
            </h1>
            <p className='hero-subtitle'>
              Descubre el sistema científico para construir autodisciplina
              inquebrantable y convertir tus metas en realidad inevitable.
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
                  "El manual definitivo para dominar tus impulsos, construir
                  hábitos duraderos y alcanzar cualquier meta que te propongas."
                </p>

                <button onClick={handleCTAClick} className='cta-button'>
                  Fortalecer mi Disciplina
                </button>

                <button
                  onClick={handlePreviewClick}
                  className='cta-button-preview'
                >
                  Ver Vista Previa Gratuita
                </button>

                <p className='cta-badge'>
                  BEST SELLER • Respaldado por neurociencia y psicología.
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
              ¿Empiezas con fuego pero terminas en humo? No es falta de
              voluntad. Es falta de sistema.
            </h2>
            <p className='section-subtitle'>
              La motivación es emocional y volátil. La disciplina es estratégica
              y confiable. Es hora de dejar de depender de lo primero y dominar
              lo segundo.
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
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                ></path>
              </svg>
              <h3 className='problem-title'>El Ciclo de la Motivación</h3>
              <p className='problem-description'>
                Comienzas lleno de energía, pero a los pocos días la llama se
                apaga. Vuelves a tus viejos hábitos, sintiéndote derrotado una
                vez más.
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
              <h3 className='problem-title'>La Tiranía de "Mañana"</h3>
              <p className='problem-description'>
                Sabes lo que debes hacer, pero lo postergás una y otra vez. Tu
                yo del futuro paga el precio de las decisiones de tu yo del
                presente.
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
              <h3 className='problem-title'>La Ilusión del Esfuerzo</h3>
              <p className='problem-description'>
                Te esfuerzas, pero no ves resultados. Te preguntas si vale la
                pena. La respuesta es sí, pero solo si entrenas correctamente.
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
              La Fuerza de Voluntad es como un Músculo.
              <br />
              Úsala Mal y se Agota. Entrénala Bien y se Multiplica.
            </h2>
            <p className='revelation-subtitle'>
              Este libro te enseña el método científico para construir
              autodisciplina sostenible. No se trata de represión brutal, sino
              de arquitectura inteligente de hábitos.
            </p>
          </div>

          <div className='quotes-container'>
            <div className='quote-block scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "No se trata de ser perfecto. Se trata de ser consistente. La
                consistencia mediocre supera a la perfección esporádica."
              </blockquote>
            </div>

            <div className='quote-block quote-reverse scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "Tu futuro no está determinado por un gran acto heroico. Está
                construido por pequeñas decisiones diarias que nadie ve pero que
                todos eventualmente sentirán."
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
              Construye el Sistema que Te Hace Imparable
            </h2>
            <p className='section-subtitle'>
              Aprende las estrategias específicas que usan las personas más
              disciplinadas del mundo para mantener el rumbo incluso cuando la
              motivación desaparece.
            </p>
          </div>

          <div className='features-grid'>
            <div className='feature-card scroll-reveal delay-100'>
              <h3 className='feature-title'>Arquitectura de Hábitos</h3>
              <p className='feature-description'>
                Diseña tu entorno para que la acción correcta sea la más fácil.
                Deja de confiar en tu fuerza de voluntad y empieza a confiar en
                tu sistema.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-200'>
              <h3 className='feature-title'>El Poder del Mínimo Viable</h3>
              <p className='feature-description'>
                Descubre por qué hacer "2 minutos" es más poderoso que
                proponerse "1 hora". La consistencia microscópica construye
                momentum imparable.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-300'>
              <h3 className='feature-title'>Dominar la Recompensa Retrasada</h3>
              <p className='feature-description'>
                Aprende a reprogramar tu cerebro para disfrutar del proceso, no
                solo del resultado. Esta es la clave de la disciplina
                sostenible.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-400'>
              <h3 className='feature-title'>El Reseteo Estratégico</h3>
              <p className='feature-description'>
                Qué hacer cuando fallas. Cómo levantarte sin autodestrucción.
                Las caídas son inevitables; el abandono es opcional.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-500'>
              <h3 className='feature-title'>Identidad sobre Resultados</h3>
              <p className='feature-description'>
                No te enfoques en "bajar 10 kilos". Conviértete en "una persona
                que entrena". El cambio de identidad hace que los hábitos sean
                automáticos.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-600'>
              <h3 className='feature-title'>La Matriz de Energía</h3>
              <p className='feature-description'>
                Administra tu fuerza de voluntad como un recurso limitado.
                Aprende cuándo gastarla y cuándo automatizar para no depender de
                ella.
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
              La versión disciplinada de ti ya existe. Solo necesitas el mapa.
            </h2>
            <p className='final-cta-text'>
              Deja de esperar el momento perfecto. Empieza a construir el
              sistema que te llevará a donde quieres estar. La disciplina es el
              puente entre tus metas y tus logros.
            </p>
            <button onClick={handleCTAClick} className='cta-button final'>
              Quiero mi Guía Ahora
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <BookPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        bookTitle='El Músculo de la Voluntad'
        previewFolder='musculo-voluntad'
        productName='El Músculo de la Voluntad'
      />
    </div>
  );
};

export default MusculoVoluntad;
