import React, { useState } from "react";
import "../styles/TestimonialCarousel.css";

// Genera una lista de imágenes basada en el patrón y la cantidad que mencionaste
const totalTestimonials = 7;
const testimonials = Array.from({ length: totalTestimonials }, (_, i) => ({
  image: `/assets/carrusel/testimonial-${i + 1}.jpg`,
  id: i + 1,
}));

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
    <section className='testimonial-carousel-section'>
      <h2 className='testimonial-carousel-title'>
        Lo que dicen nuestros lectores
      </h2>
      <div className='testimonial-carousel'>
        <div
          className='testimonial-carousel-slides'
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial) => (
            <div className='testimonial-carousel-slide' key={testimonial.id}>
              <img
                src={testimonial.image}
                alt={`Testimonio ${testimonial.id}`}
                className='testimonial-carousel-image'
              />
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
