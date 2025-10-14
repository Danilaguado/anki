// src/pages/Home.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
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

  const books = [
    {
      id: "codigo-conexion",
      title: "El Código de la Conexión",
      badge: "Comunicación",
      description:
        "Descubre las claves para conectar auténticamente con cualquier persona y construir relaciones significativas que transformen tu vida.",
      cover: "/assets/codigo-conexion-cover.jpg",
      route: "/codigo-conexion",
    },
    {
      id: "musculo-voluntad",
      title: "El Músculo de la Voluntad",
      badge: "Autodisciplina",
      description:
        "Aprende a fortalecer tu disciplina y construir hábitos que te lleven a alcanzar tus metas más ambiciosas de manera sostenible.",
      cover: "/assets/musculo-voluntad-cover.jpg",
      route: "/musculo-voluntad",
    },
    {
      id: "habla-corrige-conquista",
      title: "Habla, Corrige y Conquista",
      badge: "Liderazgo",
      description:
        "Domina el arte de la comunicación asertiva y aprende a dar feedback que transforma conflictos en oportunidades de crecimiento.",
      cover: "/assets/habla-corrige-conquista-cover.jpg",
      route: "/habla-corrige-conquista",
    },
    {
      id: "el-ascenso",
      title: "El Ascenso",
      badge: "Liderazgo",
      description:
        "El manual definitivo para el nuevo líder. Aprende a transformar la duda en confianza y la gestión en verdadero impacto.",
      cover: "/assets/el-ascenso-cover.jpg",
      route: "/el-ascenso",
    },
  ];

  const handleBookClick = (route) => {
    navigate(route);
  };

  const handleMainCTA = () => {
    document.getElementById("libros")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className='home-container'>
      {/* Hero Section */}
      <section className='home-hero-section'>
        <div className='home-hero-content'>
          <div className='home-hero-inner'>
            <h1 className='home-hero-title scroll-reveal'>
              Transforma tu vida con las herramientas que necesitas para crecer
              cada día
            </h1>
            <p className='home-hero-subtitle scroll-reveal delay-100'>
              Descubre nuestra colección de libros diseñados para ayudarte a
              dominar la comunicación, la autodisciplina y el liderazgo.
              Estrategias prácticas respaldadas por ciencia y experiencia real.
            </p>
            <button
              onClick={handleMainCTA}
              className='home-cta-button scroll-reveal delay-200'
            >
              Explorar Libros
            </button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className='home-problem-section'>
        <div className='home-section-container'>
          <div className='home-section-header scroll-reveal'>
            <h2 className='home-section-title'>
              ¿Sientes que te falta algo para alcanzar tu siguiente nivel?
            </h2>
            <p className='home-section-subtitle'>
              No estás solo. Miles de personas enfrentan estos mismos desafíos
              cada día. La diferencia está en tomar acción.
            </p>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section id='libros' className='home-books-section'>
        <div className='home-section-container'>
          <div className='home-section-header scroll-reveal'>
            <h2 className='home-books-title'>Nuestra Colección</h2>
            <p className='home-books-subtitle'>
              Cada libro es una herramienta poderosa diseñada para un área
              específica de tu desarrollo personal. Elige el que más resuene
              contigo o descubre la trilogía completa.
            </p>
          </div>

          <div className='home-books-grid'>
            {books.map((book, index) => (
              <div
                key={book.id}
                className={`home-book-card scroll-reveal delay-${
                  (index + 1) * 100
                }`}
                onClick={() => handleBookClick(book.route)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleBookClick(book.route);
                  }
                }}
                tabIndex={0}
                role='button'
                aria-label={`Ver detalles de ${book.title}`}
              >
                <img
                  src={book.cover}
                  alt={`Portada de ${book.title}`}
                  className='home-book-cover'
                />
                <h3 className='home-book-title'>{book.title}</h3>
                <p className='home-book-badge'>{book.badge}</p>
                <p className='home-book-description'>{book.description}</p>
                <button className='home-book-button' aria-hidden='true'>
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className='home-final-cta-section'>
        <div className='home-section-container'>
          <div className='home-final-cta-content scroll-reveal'>
            <h2 className='home-final-cta-title'>
              Da el primer paso hacia la versión que quieres ser
            </h2>
            <p className='home-final-cta-text'>
              No esperes más. Cada día que pasa es una oportunidad perdida de
              crecimiento. Invierte en ti mismo y comienza tu transformación
              hoy.
            </p>
            <button onClick={handleMainCTA} className='home-cta-button final'>
              Comenzar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='home-footer'>
        <div className='home-footer-container'>
          <p>
            <br>
              Este sitio web provee de herramientas para el crecimiento personal
              y relacional.{" "}
            </br>
            <br>
              Su contenido es educativo y no garantiza resultados específicos.
              El lector asume toda la responsabilidad por la aplicación de la
              información.
            </br>
            <a href='https://es-kaizen.vercel.app/terms'>
              {" "}
              Ver Términos y Condiciones
              <br>
                &copy; 2025 Proyecto Kaizen. Todos los derechos reservados.
              </br>
            </a>
          </p>
          <p className='home-footer-subtitle'>
            Herramientas para una vida de crecimiento continuo.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
