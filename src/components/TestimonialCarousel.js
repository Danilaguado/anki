import React, { useState } from "react";
import "../styles/TestimonialCarousel.css";

const testimonials = [
  {
    image: "/assets/carrusel/testimonial-1.jpg",
    text: "Este libro cambió por completo la forma en que me comunico. Las técnicas son prácticas y fáciles de aplicar. ¡Totalmente recomendado!",
    author: "Carlos G.",
  },
  {
    image: "/assets/carrusel/testimonial-2.jpg",
    text: "La sección sobre autodisciplina es oro puro. Me ha ayudado a mantenerme enfocado y a construir hábitos que realmente perduran.",
    author: "Ana M.",
  },
  {
    image: "/assets/carrusel/testimonial-3.jpg",
    text: 'Como nuevo líder, me sentía perdido. "El Ascenso" me dio la confianza y las herramientas que necesitaba para guiar a mi equipo.',
    author: "Javier P.",
  },
];

const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? testimonials.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === testimonials.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <section className='testimonial-section'>
      <h2 className='testimonial-title'>Lo que dicen nuestros lectores</h2>
      <div className='testimonial-carousel'>
        <div
          className='testimonial-slides'
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div className='testimonial-slide' key={index}>
              <img
                src={testimonial.image}
                alt={`Testimonio de ${testimonial.author}`}
                className='testimonial-image'
              />
              <blockquote className='testimonial-text'>
                "{testimonial.text}"
              </blockquote>
              <p className='testimonial-author'>- {testimonial.author}</p>
            </div>
          ))}
        </div>
        <button
          className='carousel-button prev'
          onClick={goToPrevious}
          aria-label='Anterior testimonio'
        >
          &#10094;
        </button>
        <button
          className='carousel-button next'
          onClick={goToNext}
          aria-label='Siguiente testimonio'
        >
          &#10095;
        </button>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
