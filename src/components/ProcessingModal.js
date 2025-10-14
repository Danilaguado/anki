// src/components/ProcessingModal.js
import React, { useState, useEffect } from "react";
import "./ProcessingModal.css";

const LoadingSpinner = ({ progress }) => (
  <div className='spinner-container'>
    <div className='spinner'>
      <div className='spinner-ring'></div>
      <div className='spinner-ring'></div>
      <div className='spinner-ring'></div>
    </div>
    {progress !== undefined && (
      <div className='progress-bar-container'>
        <div className='progress-bar'>
          <div
            className='progress-fill'
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className='progress-text'>{Math.round(progress)}%</span>
      </div>
    )}
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

const ProcessingSteps = ({ currentStep }) => {
  const steps = [
    { id: 1, label: "Validando imagen", icon: "📷" },
    { id: 2, label: "Procesando OCR", icon: "🔍" },
    { id: 3, label: "Verificando datos", icon: "✅" },
    { id: 4, label: "Registrando pago", icon: "💳" },
    { id: 5, label: "Enviando confirmación", icon: "📧" },
  ];

  return (
    <div className='processing-steps'>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`step ${index < currentStep ? "completed" : ""} ${
            index === currentStep ? "active" : ""
          }`}
        >
          <div className='step-icon'>
            {index < currentStep ? "✓" : step.icon}
          </div>
          <span className='step-label'>{step.label}</span>
        </div>
      ))}
    </div>
  );
};

export const ProcessingModal = ({ status, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "💡 Sabías que procesamos más de 1000 pagos al mes",
    "🔒 Tu información está protegida con encriptación SSL",
    "⚡ Nuestro sistema valida pagos en segundos",
    "🎯 Tasa de éxito del 99.5% en validaciones",
    "🚀 Tu material será enviado automáticamente",
  ];

  useEffect(() => {
    if (status?.stage === "processing") {
      // Simular progreso
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      // Cambiar paso actual
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 4) return prev;
          return prev + 1;
        });
      }, 1000);

      // Rotar tips
      const tipInterval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % tips.length);
      }, 3000);

      return () => {
        clearInterval(interval);
        clearInterval(stepInterval);
        clearInterval(tipInterval);
      };
    }
  }, [status, tips.length]);

  if (!status) return null;

  const getContent = () => {
    switch (status.stage) {
      case "processing":
        return {
          icon: <LoadingSpinner progress={progress} />,
          title: "Procesando tu Pago",
          message: (
            <div className='processing-message'>
              <ProcessingSteps currentStep={currentStep} />
              <div className='tip-container'>
                <p className='tip-text fade-in-text'>{tips[tipIndex]}</p>
              </div>
            </div>
          ),
          showButton: false,
        };

      case "success":
        return {
          icon: <SuccessIcon />,
          title: "¡Pago Aprobado!",
          message: (
            <>
              <div className='success-message'>
                <p style={{ marginBottom: "16px" }}>
                  <strong>¡Felicitaciones!</strong> Tu pago ha sido verificado
                  exitosamente.
                </p>
                <div className='success-details'>
                  <div className='detail-item'>
                    <span className='detail-icon'>📧</span>
                    <span>Revisa tu correo electrónico</span>
                  </div>
                  <div className='detail-item'>
                    <span className='detail-icon'>📂</span>
                    <span>Incluye carpeta de spam</span>
                  </div>
                  <div className='detail-item'>
                    <span className='detail-icon'>⏱️</span>
                    <span>Llegará en los próximos minutos</span>
                  </div>
                </div>
              </div>
              <div className='community-invite'>
                <h3>🎉 ¡Únete a nuestra comunidad!</h3>
                <p>
                  No te pierdas el contenido exclusivo que compartimos en
                  nuestro Canal de WhatsApp:
                </p>
                <ul>
                  <li>💎 Talleres exclusivos cada semana</li>
                  <li>🤝 Red de networking de alto valor</li>
                  <li>📚 Material premium gratuito</li>
                  <li>🎯 Desafíos y retos mensuales</li>
                </ul>
              </div>
            </>
          ),
          showButton: true,
          buttonText: "🚀 Unirme al Canal de WhatsApp",
          buttonLink: "https://whatsapp.com/channel/0029VbBQrlRF1YlOxxbDT30X",
          buttonClass: "success-button",
        };

      case "error":
        return {
          icon: <ErrorIcon />,
          title: "Verificación Manual Necesaria",
          message: (
            <div className='error-message'>
              <p>
                No pudimos verificar automáticamente tu pago, pero no te
                preocupes, esto sucede ocasionalmente.
              </p>
              <div className='error-reasons'>
                <p>
                  <strong>Posibles razones:</strong>
                </p>
                <ul>
                  <li>La imagen del comprobante no es clara</li>
                  <li>El formato del comprobante es diferente</li>
                  <li>Problemas temporales de conexión</li>
                </ul>
              </div>
              <p className='error-solution'>
                <strong>Solución rápida:</strong> Contacta con nuestro soporte
                por WhatsApp y validaremos tu pago manualmente en minutos.
              </p>
            </div>
          ),
          showButton: true,
          buttonText: "💬 Contactar Soporte por WhatsApp",
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
      <div
        className={`modal-content ${status.stage}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-icon'>{content.icon}</div>

        <h2 className='modal-title'>{content.title}</h2>
        <div className='modal-message'>{content.message}</div>

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

        {status.stage === "processing" && (
          <p className='processing-note'>
            Por favor no cierres esta ventana...
          </p>
        )}
      </div>
    </div>
  );
};
