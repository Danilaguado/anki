import React from "react";
import "../styles/MembershipBanner.css";

const MembershipBanner = () => {
  // En el futuro, puedes hacer que este enlace lleve a una página de membresía
  const handleSaberMasClick = () => {
    console.log(
      'Botón "Saber más" clickeado. Redirigir a la página de membresía.'
    );
    // Ejemplo: navigate('/membresia');
  };

  return (
    <section className='membership-banner-section'>
      <div className='membership-banner-content'>
        <div className='membership-banner-text'>
          <h3>ÚNETE A LA MEMBRESÍA MENSUAL</h3>
          <p>
            Accede a contenido exclusivo, talleres en vivo y una comunidad de
            alto valor.
          </p>
        </div>
        <button
          onClick={handleSaberMasClick}
          className='membership-banner-button'
        >
          Saber más
        </button>
      </div>
    </section>
  );
};

export default MembershipBanner;
