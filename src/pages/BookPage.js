// src/pages/BookPage.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/BookLanding.css";
import BookPreviewModal from "../components/BookPreviewModal";
import Footer from "../components/Footer";
import bookData from "../data/bookData.json";
import PriceDisplay from "../components/PriceDisplay"; // Importar

const BookPage = () => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const { bookId } = useParams();

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
      { threshold: 0.1 }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [bookId]);

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

  const book = bookData.find((b) => b.id === bookId);

  useEffect(() => {
    if (!book) {
      navigate("/");
    }
  }, [book, navigate]);

  if (!book) {
    return <div>Libro no encontrado, redirigiendo...</div>;
  }

  const handlePreviewClick = () => setShowPreview(true);
  const handleCTAClick = () =>
    navigate(`/payment?product=${encodeURIComponent(book.productName)}`);

  const problemIcons = [
    // ... (tus íconos)
  ];

  return (
    <div className={`book-landing-container theme-${book.theme || "default"}`}>
      {/* Hero Section */}
      <header className='book-hero-section'>
        <div className='book-hero-content'>
          <div className='book-hero-inner'>
            <h1
              className='book-hero-title scroll-reveal'
              dangerouslySetInnerHTML={{ __html: book.hero.title }}
            />
            <p className='book-hero-subtitle scroll-reveal delay-100'>
              {book.hero.subtitle}
            </p>
          </div>
          <div className='book-hero-cta-container scroll-reveal delay-200'>
            <img
              src={book.hero.coverImage}
              alt={`Portada de ${book.productName}`}
              className='book-cover'
            />
            <div className='book-cta-content'>
              <p className='book-cta-quote'>{book.hero.quote}</p>

              <PriceDisplay priceUSD={book.priceUSD || 5} />

              <button onClick={handleCTAClick} className='book-cta-button'>
                {book.hero.cta}
              </button>
              <button
                onClick={handlePreviewClick}
                className='book-cta-button-preview'
              >
                Ver Vista Previa Gratuita
              </button>
              <p className='book-cta-badge'>{book.hero.badge}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Problem Section */}
      <section id='problema' className='book-problem-section'>
        <div className='book-section-container'>
          <div className='book-section-header scroll-reveal'>
            <h2 className='book-section-title'>{book.problems.title}</h2>
            <p className='book-section-subtitle'>{book.problems.subtitle}</p>
          </div>
          <div className='book-problems-grid'>
            {book.problems.items.map((item, index) => (
              <div
                key={index}
                className={`book-problem-card scroll-reveal delay-${
                  (index + 1) * 100
                }`}
              >
                {/* Asumo que tienes los iconos definidos */}
                <h3 className='book-problem-title'>{item.title}</h3>
                <p className='book-problem-description'>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revelation Section */}
      <section id='revelacion' className='book-revelation-section'>
        <div className='book-section-container'>
          <div className='book-section-header scroll-reveal'>
            <h2
              className='book-revelation-title'
              dangerouslySetInnerHTML={{ __html: book.revelation.title }}
            />
            <p className='book-section-subtitle'>{book.revelation.subtitle}</p>
          </div>
          <div className='book-quotes-container'>
            {book.revelation.quotes.map((quote, index) => (
              <div
                key={index}
                className={`book-quote-block scroll-reveal ${
                  index % 2 !== 0 ? "book-quote-reverse" : ""
                }`}
              >
                <div className='book-quote-mark'>"</div>
                <blockquote className='book-quote-text'>{quote}</blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mastery Section */}
      <section id='maestria' className='book-mastery-section'>
        <div className='book-section-container'>
          <div className='book-section-header scroll-reveal'>
            <h2 className='book-section-title'>{book.mastery.title}</h2>
            <p className='book-section-subtitle'>{book.mastery.subtitle}</p>
          </div>
          <div className='book-features-grid'>
            {book.mastery.features.map((feature, index) => (
              <div
                key={index}
                className={`book-feature-card scroll-reveal delay-${
                  (index + 1) * 100
                }`}
              >
                <h3 className='book-feature-title'>{feature.title}</h3>
                <p className='book-feature-description'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id='comprar' className='book-final-cta-section'>
        <div className='book-section-container'>
          <div className='book-final-cta-content scroll-reveal'>
            <img
              src={book.hero.coverImage}
              alt={`Portada de ${book.productName}`}
              className='book-final-book-cover'
            />
            <div>
              <h2 className='book-final-cta-title'>{book.finalCta.title}</h2>
              <p className='book-final-cta-text'>{book.finalCta.text}</p>

              <PriceDisplay priceUSD={book.priceUSD || 5} />

              <button
                onClick={handleCTAClick}
                className='book-cta-button final'
              >
                {book.finalCta.cta}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <BookPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        bookTitle={book.productName}
        previewFolder={book.id}
        productName={book.productName}
      />
    </div>
  );
};

export default BookPage;
