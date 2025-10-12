// src/components/SecureBadge.js
import React from "react";

const SecureBadge = () => {
  return (
    <div className='secure-badge'>
      <img src='/assets/pago-seguro.png' alt='Pago Seguro' />
      <span className='secure-text'>Transacción 100% Segura</span>
    </div>
  );
};

export default SecureBadge;
