import React from "react";
import "../styles/MembershipBanner.css";

const MembershipBanner = () => {
  const handleSaberMasClick = () => {
    console.log(
      'Botón "Saber más" clickeado. Redirigir a la página de membresía.'
    );
    // Cuando tengas la página de membresía, puedes usar: navigate('/membresia');
  };

  return (
    <div className='membership-banner-container'>
      <div className='membership-banner'>
        <div className='membership-icon'>
          {/* Un ícono simple para darle un toque visual */}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z' />
            <path d='M12 12l5.66-5.66' />
            <path d='M12 12L6.34 6.34' />
          </svg>
        </div>
        <div className='membership-text'>
          <h3>Únete a la Membresía Kaizen</h3>
          <p>
            Accede a contenido exclusivo, talleres en vivo y una comunidad de
            alto valor.
          </p>
        </div>
        <button onClick={handleSaberMasClick} className='membership-button'>
          Saber más
        </button>
      </div>
    </div>
  );
};

export default MembershipBanner;
