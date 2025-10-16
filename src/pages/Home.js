// src/pages/Home.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import Footer from "../components/Footer";
import PriceDisplay from "../components/PriceDisplay"; // Importar el nuevo componente
import bookData from "../data/bookData.json"; // Importar los datos
import TestimonialCarousel from "../components/TestimonialCarousel";
import MembershipBanner from "../components/MembershipBanner";
import NewsletterSubscribe from "../components/NewsletterSubscribe";

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
              contigo o descubre la colección completa.
            </p>
          </div>

          <div className='home-books-grid'>
            {bookData.map((book, index) => (
              <div
                key={book.id}
                className={`home-book-card scroll-reveal delay-${
                  (index + 1) * 100
                }`}
                onClick={() => handleBookClick(`/${book.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleBookClick(`/${book.id}`);
                  }
                }}
                tabIndex={0}
                role='button'
                aria-label={`Ver detalles de ${book.title}`}
              >
                <img
                  src={book.hero.coverImage}
                  alt={`Portada de ${book.title}`}
                  className='home-book-cover'
                />
                <h3 className='home-book-title'>{book.productName}</h3>
                <p className='home-book-badge'>
                  {book.badge || "Desarrollo Personal"}
                </p>
                <p className='home-book-description'>{book.hero.subtitle}</p>

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "20px",
                    width: "100%",
                  }}
                >
                  <PriceDisplay priceUSD={book.priceUSD || 5} />
                </div>

                <button className='home-book-button' aria-hidden='true'>
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MembershipBanner />
      <TestimonialCarousel />
      {/* Final CTA Section */}
      {/* <section className='home-final-cta-section'>
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
      </section> */}
      <section
        className='home-newsletter-section'
        style={{ padding: "5px 24px", backgroundColor: "#1a1a1a" }}
      >
        <NewsletterSubscribe /> {/* <-- 2. Añadir el componente */}
      </section>
      <Footer />
    </div>
  );
};

export default Home;
