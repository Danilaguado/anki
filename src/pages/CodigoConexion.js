// src/pages/CodigoConexion.js - VERSIÓN CORRECTA
import React, { useEffect, useState } from "react"; // 👈 Agregar useState aquí
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";
import BookPreviewModal from "../components/BookPreviewModal";

const CodigoConexion = () => {
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
    navigate("/payment?product=El Código de la Conexión");
  };

  return (
    <div className='landing-container codigo-conexion'>
      {/* Hero Section */}
      <header className='hero-section'>
        <div className='hero-content'>
          <div className='hero-inner'>
            <h1 className='hero-title'>
              ¿Cansado de no entenderla? Existe un código. Y ha sido descifrado.
            </h1>
            <p className='hero-subtitle'>
              La guía definitiva, basada en ciencia, para transformar la
              confusión en una conexión inquebrantable y convertirte en el
              hombre que ella admira y desea.
            </p>
            <div className='hero-cta-container'>
              <img
                src='/assets/codigo-conexion-cover.jpg'
                alt='Portada del libro El Código de la Conexión'
                className='book-cover'
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/250x380/1a1a1a/e0e0e0?text=El+C%C3%B3digo+de+la%0AConexi%C3%B3n";
                }}
              />
              <div className='cta-content'>
                <p className='cta-quote'>
                  "El manual que desearías haber tenido hace años para navegar
                  las complejidades de la intimidad y el deseo."
                </p>

                {/* BOTÓN PRINCIPAL */}
                <button onClick={handleCTAClick} className='cta-button'>
                  Domina el Código Hoy
                </button>

                {/* 👇 BOTÓN DE VISTA PREVIA */}
                <button
                  onClick={handlePreviewClick}
                  className='cta-button-preview'
                >
                  Ver Vista Previa Gratuita
                </button>

                <p className='cta-badge'>
                  BEST SELLER • Basado en décadas de investigación.
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
              Si esto te resulta familiar, no estás solo. Y no es tu culpa.
            </h2>
            <p className='section-subtitle'>
              Millones de hombres buenos se sienten frustrados en sus
              relaciones. Creen que el problema son ellos, cuando en realidad,
              solo están hablando un idioma diferente sin saberlo.
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
              <h3 className='problem-title'>El "Estoy bien"</h3>
              <p className='problem-description'>
                Sientes que esa simple frase esconde un campo minado emocional y
                cualquier paso en falso puede detonar un conflicto.
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
              <h3 className='problem-title'>Soluciones vs. Conexión</h3>
              <p className='problem-description'>
                Tus intentos lógicos de "arreglar" sus problemas son recibidos
                con frustración. Te dice "no me escuchas" cuando es lo único que
                intentas hacer.
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
                  d='M17 16l4-4m0 0l-4-4m4 4H3'
                ></path>
              </svg>
              <h3 className='problem-title'>La Retirada Inevitable</h3>
              <p className='problem-description'>
                Las discusiones escalan sin sentido hasta que te desconectas
                para protegerte, dejando a ambos sintiéndose solos y resentidos.
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
              No es "Lógica Femenina".
              <br />
              Es la Ciencia de la Conexión.
            </h2>
            <p className='revelation-subtitle'>
              Este libro no ofrece frases hechas ni trucos de manipulación. Te
              entrega el manual de operaciones de la conexión humana, basado en
              la psicología y la neurociencia.
            </p>
          </div>

          <div className='quotes-container'>
            <div className='quote-block scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "Las relaciones no mueren por grandes traiciones, sino por miles
                de pequeñas peticiones de conexión ignoradas. Aprende a verlas y
                a responder, y construirás una fortaleza de confianza."
              </blockquote>
            </div>

            <div className='quote-block quote-reverse scroll-reveal'>
              <div className='quote-mark'>"</div>
              <blockquote className='quote-text'>
                "La herramienta más poderosa no es dar tu opinión, es validar su
                emoción. Domina este arte y transformarás el conflicto en la más
                profunda intimidad."
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
              Conviértete en el Arquitecto de tu Relación
            </h2>
            <p className='section-subtitle'>
              Este conocimiento te dará las herramientas para dejar de
              reaccionar y empezar a liderar la dinámica emocional con calma y
              seguridad.
            </p>
          </div>

          <div className='features-grid'>
            <div className='feature-card scroll-reveal delay-100'>
              <h3 className='feature-title'>
                Decodificar el Lenguaje Emocional
              </h3>
              <p className='feature-description'>
                Entender lo que realmente necesita cuando sus palabras dicen
                otra cosa. Pasarás de la confusión a la claridad.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-200'>
              <h3 className='feature-title'>Neutralizar la Toxicidad</h3>
              <p className='feature-description'>
                Identificar los 4 comportamientos que predicen el divorcio y
                aplicar sus antídotos específicos para detener las discusiones
                antes de que destruyan la conexión.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-300'>
              <h3 className='feature-title'>
                Construir una Confianza Inquebrantable
              </h3>
              <p className='feature-description'>
                Hacer depósitos diarios en la "Cuenta Bancaria Emocional" para
                que la relación prospere incluso en momentos de estrés.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-400'>
              <h3 className='feature-title'>Reavivar la Pasión y el Deseo</h3>
              <p className='feature-description'>
                Comprender la psicología de la diferenciación: la clave para
                mantener la atracción y el misterio en una relación a largo
                plazo.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-500'>
              <h3 className='feature-title'>Comunicación No Violenta</h3>
              <p className='feature-description'>
                Un plan paso a paso para expresar tus necesidades sin culpa ni
                crítica, invitando a la colaboración en lugar de a la defensiva.
              </p>
            </div>

            <div className='feature-card scroll-reveal delay-600'>
              <h3 className='feature-title'>Ser su Puerto Seguro</h3>
              <p className='feature-description'>
                Convertirte en el hombre con el que se siente profundamente
                vista, escuchada y segura. La base para una lealtad y amor
                incondicional.
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
              src='/assets/codigo-conexion-cover.jpg'
              alt='Portada del libro El Código de la Conexión'
              className='final-book-cover'
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/300x450/1a1a1a/e0e0e0?text=El+C%C3%B3digo+de+la%0AConexi%C3%B3n";
              }}
            />
            <h2 className='final-cta-title'>
              La maestría está a un clic de distancia.
            </h2>
            <p className='final-cta-text'>
              Deja de adivinar. Empieza a entender. Abandona la frustración y da
              el primer paso para co-crear una relación de significado y
              vitalidad duraderos. Tu futuro yo y tu pareja te lo agradecerán.
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
            Este libro es una herramienta para el crecimiento personal y
            relacional.
          </p>
        </div>
      </footer>

      {/* 👇 MODAL DE VISTA PREVIA - DEBE IR AQUÍ AL FINAL */}
      <BookPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        bookTitle='El Código de la Conexión'
        previewFolder='codigo-conexion'
        productName='El Código de la Conexión'
      />
    </div>
  );
};

export default CodigoConexion;
