// src/App.js
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { ProcessingModal } from "./components/ProcessingModal";
import { PaymentProcessor } from "./services/PaymentProcessor";

// --- Iconos SVG ---
const CopyIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <rect x='9' y='9' width='13' height='13' rx='2' ry='2'></rect>
    <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path>
  </svg>
);

const CheckIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <polyline points='20 6 9 17 4 12'></polyline>
  </svg>
);

const AlertIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='12' cy='12' r='10'></circle>
    <line x1='12' y1='8' x2='12' y2='12'></line>
    <line x1='12' y1='16' x2='12.01' y2='16'></line>
  </svg>
);

const FileCheckIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
    <polyline points='14 2 14 8 20 8'></polyline>
    <polyline points='9 15 11 17 15 13'></polyline>
  </svg>
);

function App() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    whatsappNumber: "",
  });
  const [comprobante, setComprobante] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [receiveWhatsapp, setReceiveWhatsapp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [copiedField, setCopiedField] = useState("");
  const [processingStatus, setProcessingStatus] = useState(null);
  const whatsappInputRef = useRef(null);
  const paymentProcessor = useRef(new PaymentProcessor()).current;

  const paymentData = {
    banco: { display: "Banco: BNC", value: "0191" },
    telefono: { display: "04125497936", value: "04125497936" },
    cedula: { display: "23621688", value: "23621688" },
  };

  useEffect(() => {
    if (receiveWhatsapp && whatsappInputRef.current) {
      whatsappInputRef.current.focus();
    }
  }, [receiveWhatsapp]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setComprobante(e.target.files[0]);
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
      alert("No se pudo copiar. Por favor copie manualmente.");
    }
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setMessage({ type: "error", text: "Por favor ingrese su nombre." });
      return false;
    }
    if (!formData.correo.trim() || !formData.correo.includes("@")) {
      setMessage({
        type: "error",
        text: "Por favor ingrese un correo válido.",
      });
      return false;
    }
    if (!comprobante) {
      setMessage({
        type: "error",
        text: "Por favor suba el comprobante de pago.",
      });
      return false;
    }
    if (receiveWhatsapp && !formData.whatsappNumber.trim()) {
      setMessage({
        type: "error",
        text: "Por favor ingrese su número de WhatsApp.",
      });
      return false;
    }
    if (!acceptedTerms) {
      setMessage({
        type: "error",
        text: "Debe aceptar los términos y condiciones.",
      });
      return false;
    }
    return true;
  };

  const processPayment = async () => {
    // Mostrar modal de procesamiento
    setProcessingStatus({ stage: "processing" });

    try {
      // Procesar imagen con OCR
      // Para modo simulado (pruebas), usa esta línea:
      //   const validationResult = await paymentProcessor.mockValidation(
      //     comprobante
      //   );

      // Para OCR real, descomenta esta línea y comenta la de arriba:
      const validationResult = await paymentProcessor.processImage(comprobante);

      if (validationResult.success) {
        // Pago aprobado - Enviar datos al servidor
        const response = await fetch("/api/submit-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: formData.nombre,
            correo: formData.correo,
            comprobante: comprobante.name,
            whatsapp: receiveWhatsapp ? "Sí" : "No",
            whatsappNumber: formData.whatsappNumber,
            fecha: new Date().toISOString(),
            banco: paymentData.banco.value,
            telefono: paymentData.telefono.value,
            cedula: paymentData.cedula.value,
            ocrResult: validationResult,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Mostrar modal de éxito
          setProcessingStatus({ stage: "success" });

          // Limpiar formulario
          setFormData({ nombre: "", correo: "", whatsappNumber: "" });
          setComprobante(null);
          setAcceptedTerms(false);
          setReceiveWhatsapp(false);
          document.getElementById("comprobante").value = "";
        } else {
          throw new Error(result.message || "Error al procesar el pago.");
        }
      } else {
        // Pago no reconocido
        setProcessingStatus({ stage: "error" });
      }
    } catch (error) {
      console.error("Error:", error);
      setProcessingStatus({ stage: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!validateForm()) return;

    setIsSubmitting(true);
    await processPayment();
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    setProcessingStatus(null);
  };

  return (
    <div className='app-container'>
      <div className='payment-card'>
        <div className='header'>
          <h1>Registro de Pago</h1>
          <p className='subtitle'>
            Complete el formulario para registrar su pago móvil.
          </p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            <AlertIcon />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className='payment-form'>
          <div className='form-group'>
            <label htmlFor='nombre'>Nombre</label>
            <input
              type='text'
              id='nombre'
              name='nombre'
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder='Su nombre completo'
              disabled={isSubmitting}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='correo'>Correo Electrónico</label>
            <input
              type='email'
              id='correo'
              name='correo'
              value={formData.correo}
              onChange={handleInputChange}
              placeholder='ejemplo@correo.com'
              disabled={isSubmitting}
            />
          </div>

          <div className='payment-info'>
            <label>Datos del Pago Móvil</label>
            {Object.entries(paymentData).map(([key, { display, value }]) => (
              <div key={key} className='info-row'>
                <span className='info-label'>
                  {key === "banco" ? (
                    <span>
                      Banco: <strong>BNC</strong>
                    </span>
                  ) : (
                    `${key.charAt(0).toUpperCase() + key.slice(1)}:`
                  )}
                </span>
                <div className='info-value-container'>
                  <span className='info-value'>
                    {key === "banco" ? value : display}
                  </span>
                  <button
                    type='button'
                    onClick={() => copyToClipboard(value, key)}
                    className={`copy-button ${
                      copiedField === key ? "copied" : ""
                    }`}
                    title='Copiar'
                    disabled={isSubmitting}
                  >
                    {copiedField === key ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className='form-group'>
            <label htmlFor='comprobante'>Sube el comprobante</label>
            <input
              type='file'
              id='comprobante'
              name='comprobante'
              onChange={handleFileChange}
              disabled={isSubmitting}
              accept='image/*,.pdf'
            />
            {comprobante && (
              <div className='file-upload-success'>
                <FileCheckIcon />
                <span>{comprobante.name}</span>
              </div>
            )}
          </div>

          <div className='terms-container'>
            <label className='checkbox-label'>
              <input
                type='checkbox'
                checked={receiveWhatsapp}
                onChange={(e) => setReceiveWhatsapp(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>Recibir Material por Whatsapp (Opcional)</span>
            </label>
            <div
              className={`whatsapp-input-container ${
                receiveWhatsapp ? "open" : ""
              }`}
            >
              <div className='form-group'>
                <label htmlFor='whatsappNumber'>Número de WhatsApp</label>
                <input
                  ref={whatsappInputRef}
                  type='tel'
                  id='whatsappNumber'
                  name='whatsappNumber'
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                  placeholder='Ej: 04123456789'
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <label className='checkbox-label'>
              <input
                type='checkbox'
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>
                Acepto los{" "}
                <a
                  href='#terms'
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      "Términos y Condiciones: Al registrar su pago, usted autoriza el procesamiento de sus datos personales con el único fin de verificar el pago móvil realizado."
                    );
                  }}
                >
                  términos y condiciones
                </a>
                .
              </span>
            </label>
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='submit-button'
          >
            {isSubmitting ? "Procesando..." : "Registrar Pago"}
          </button>
        </form>
      </div>

      <ProcessingModal status={processingStatus} onClose={handleCloseModal} />
    </div>
  );
}

export default App;
