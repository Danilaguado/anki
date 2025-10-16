import React, { useState, useEffect } from "react";
import "../styles/FloatingWhatsAppButton.css";

const FloatingWhatsAppButton = () => {
  const [isShaking, setIsShaking] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const WHATSAPP_NUMBER = "5511958682671"; // Tu número de WhatsApp

  useEffect(() => {
    const triggerAnimation = () => {
      setIsShaking(true);
      setShowBubble(true);

      // Ocultar la burbuja después de 10 segundos
      setTimeout(() => {
        setShowBubble(false);
      }, 10000);

      // Detener la animación de temblor
      setTimeout(() => {
        setIsShaking(false);
      }, 1000); // Duración de la animación de temblor
    };

    // Iniciar la animación inmediatamente al cargar y luego cada 3 minutos
    triggerAnimation();
    const intervalId = setInterval(triggerAnimation, 180000); // 3 minutos = 180000 ms

    return () => clearInterval(intervalId);
  }, []);

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      className={`whatsapp-float ${isShaking ? "shake" : ""}`}
      target='_blank'
      rel='noopener noreferrer'
      aria-label='Contactar por WhatsApp'
    >
      {showBubble && <div className='whatsapp-bubble'>¿Necesitas ayuda?</div>}
      <img src='/assets/logo_ws.png' alt='WhatsApp' className='whatsapp-logo' />
    </a>
  );
};

export default FloatingWhatsAppButton;
