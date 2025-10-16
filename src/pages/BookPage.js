// src/pages/BookPage.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/BookLanding.css";
import BookPreviewModal from "../components/BookPreviewModal";
import Footer from "../components/Footer";
import bookData from "../data/bookData.json";
import PriceDisplay from "../components/PriceDisplay";
import "../styles/PriceDisplay.css";

const BookPage = () => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const { bookId } = useParams();

  const book = bookData.find((b) => b.id === bookId);

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
    return () => document.body.classList.remove("preview-modal-open");
  }, [showPreview]);

  if (!book) {
    useEffect(() => {
      navigate("/");
    }, [navigate]);
    return <div>Libro no encontrado, redirigiendo...</div>;
  }

  // --- FUNCIÓN CORREGIDA ---
  const handleCTAClick = () => {
    navigate(`/start-purchase?product=${encodeURIComponent(book.productName)}`);
  };

  const handlePreviewClick = () => setShowPreview(true);

  const problemIcons = [
    <svg
      key='icon1'
      className='book-problem-icon'
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
    </svg>,
    <svg
      key='icon2'
      className='book-problem-icon'
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
    </svg>,
    <svg
      key='icon3'
      className='book-problem-icon'
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
    </svg>,
  ];

  return (
    <div className='book-landing-container'>
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
              alt={`Portada de ${book.title}`}
              className='book-cover'
            />
            <div className='book-cta-content'>
              <p className='book-cta-quote'>{book.hero.quote}</p>
              <PriceDisplay priceUSD={book.priceUSD} />
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
                {problemIcons[index % problemIcons.length]}
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
              alt={`Portada de ${book.title}`}
              className='book-final-book-cover'
            />
            <div>
              <h2 className='book-final-cta-title'>{book.finalCta.title}</h2>
              <p className='book-final-cta-text'>{book.finalCta.text}</p>
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
        bookTitle={book.title}
        previewFolder={book.id}
        productName={book.productName}
      />
    </div>
  );
};

export default BookPage;
