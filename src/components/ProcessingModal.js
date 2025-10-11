// src/components/ProcessingModal.js
import React from "react";
import "./ProcessingModal.css";

const LoadingSpinner = () => (
  <div className='spinner'>
    <div className='spinner-ring'></div>
    <div className='spinner-ring'></div>
    <div className='spinner-ring'></div>
  </div>
);

const SuccessIcon = () => (
  <svg className='success-icon' viewBox='0 0 52 52'>
    <circle className='success-circle' cx='26' cy='26' r='25' fill='none' />
    <path
      className='success-check'
      fill='none'
      d='M14.1 27.2l7.1 7.2 16.7-16.8'
    />
  </svg>
);

const ErrorIcon = () => (
  <svg className='error-icon' viewBox='0 0 52 52'>
    <circle className='error-circle' cx='26' cy='26' r='25' fill='none' />
    <path className='error-x' fill='none' d='M16 16 36 36 M36 16 16 36' />
  </svg>
);

export const ProcessingModal = ({ status, onClose }) => {
  if (!status) return null;

  const getContent = () => {
    switch (status.stage) {
      case "processing":
        return {
          icon: <LoadingSpinner />,
          title: "Procesando Pago",
          message: "Estamos verificando su comprobante de pago...",
          showButton: false,
        };

      case "success":
        return {
          icon: <SuccessIcon />,
          title: "¡Pago Aprobado!",
          message:
            "Su pago ha sido verificado exitosamente. El material será enviado en breve.",
          showButton: true,
          buttonText: "Unirse al Grupo de WhatsApp",
          buttonLink: "https://whatsapp.com/channel/0029VbBQrlRF1YlOxxbDT30X",
          buttonClass: "success-button",
        };

      case "error":
        return {
          icon: <ErrorIcon />,
          title: "No pudimos reconocer el pago",
          message:
            "No se preocupe, esto puede pasar. Por favor contacte con soporte para verificar su pago de forma manual.",
          showButton: true,
          buttonText: "Contactar Soporte por WhatsApp",
          buttonLink: "https://wa.me/5511958682671",
          buttonClass: "error-button",
        };

      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <div
      className='modal-overlay'
      onClick={status.stage !== "processing" ? onClose : undefined}
    >
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-icon'>{content.icon}</div>

        <h2 className='modal-title'>{content.title}</h2>
        <p className='modal-message'>{content.message}</p>

        {content.showButton && (
          <div className='modal-buttons'>
            <a
              href={content.buttonLink}
              target='_blank'
              rel='noopener noreferrer'
              className={`modal-button ${content.buttonClass}`}
            >
              {content.buttonText}
            </a>
            <button onClick={onClose} className='modal-button secondary-button'>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
