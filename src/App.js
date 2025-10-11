// src/App.js
import React, { useState } from "react";
import "./App.css";

// Iconos SVG
const CopyIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
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
  >
    <circle cx='12' cy='12' r='10'></circle>
    <line x1='12' y1='8' x2='12' y2='12'></line>
    <line x1='12' y1='16' x2='12.01' y2='16'></line>
  </svg>
);

function App() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    referencia: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [copiedField, setCopiedField] = useState("");

  const paymentData = {
    banco: "0191 BNC",
    telefono: "0412.549.79.36",
    cedula: "23.621.688",
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Solo permitir números en referencia
    if (name === "referencia") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      // Limpiar el texto antes de copiar
      const cleanText = text.replace(/\./g, "").replace(/\s/g, "");
      await navigator.clipboard.writeText(cleanText);
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
      alert("No se pudo copiar. Por favor copie manualmente.");
    }
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setMessage({ type: "error", text: "Por favor ingrese su nombre" });
      return false;
    }
    if (!formData.correo.trim() || !formData.correo.includes("@")) {
      setMessage({ type: "error", text: "Por favor ingrese un correo válido" });
      return false;
    }
    if (!formData.referencia.trim() || formData.referencia.length !== 4) {
      setMessage({
        type: "error",
        text: "Por favor ingrese los 4 últimos dígitos de la referencia",
      });
      return false;
    }
    if (!acceptedTerms) {
      setMessage({
        type: "error",
        text: "Debe aceptar los términos y condiciones",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          correo: formData.correo,
          referencia: formData.referencia,
          fecha: new Date().toISOString(),
          banco: paymentData.banco,
          telefono: paymentData.telefono,
          cedula: paymentData.cedula,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Pago registrado exitosamente. Recibirá una confirmación por correo.",
        });
        setFormData({ nombre: "", correo: "", referencia: "" });
        setAcceptedTerms(false);
      } else {
        throw new Error(result.message || "Error al procesar el pago");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error al procesar su solicitud. Por favor intente nuevamente.",
      });
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='app-container'>
      <div className='payment-card'>
        <div className='header'>
          <h1>Registro de Pago</h1>
          <p className='subtitle'>
            Complete el formulario para registrar su pago móvil
          </p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            <AlertIcon />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className='payment-form'>
          {/* Nombre */}
          <div className='form-group'>
            <label htmlFor='nombre'>Nombre Completo</label>
            <input
              type='text'
              id='nombre'
              name='nombre'
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder='Ingrese su nombre completo'
              disabled={isSubmitting}
            />
          </div>

          {/* Correo */}
          <div className='form-group'>
            <label htmlFor='correo'>Correo Electrónico</label>
            <input
              type='email'
              id='correo'
              name='correo'
              value={formData.correo}
              onChange={handleInputChange}
              placeholder='correo@ejemplo.com'
              disabled={isSubmitting}
            />
          </div>

          {/* Datos del Pago Móvil */}
          <div className='payment-info'>
            <label>Datos para Pago Móvil</label>

            {Object.entries(paymentData).map(([key, value]) => (
              <div key={key} className='info-row'>
                <span className='info-label'>
                  {key === "banco"
                    ? "Banco"
                    : key === "telefono"
                    ? "Teléfono"
                    : "Cédula"}
                  :
                </span>
                <div className='info-value-container'>
                  <span className='info-value'>{value}</span>
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

          {/* Referencia */}
          <div className='form-group'>
            <label htmlFor='referencia'>Últimos 4 Dígitos de Referencia</label>
            <input
              type='text'
              id='referencia'
              name='referencia'
              value={formData.referencia}
              onChange={handleInputChange}
              placeholder='0000'
              maxLength='4'
              pattern='[0-9]*'
              inputMode='numeric'
              disabled={isSubmitting}
            />
          </div>

          {/* Términos y Condiciones */}
          <div className='terms-container'>
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
                      "Términos y Condiciones: Al registrar su pago, autoriza el procesamiento de sus datos personales exclusivamente para fines de verificación del pago móvil realizado."
                    );
                  }}
                >
                  términos y condiciones
                </a>{" "}
                del servicio
              </span>
            </label>
          </div>

          {/* Botón Enviar */}
          <button
            type='submit'
            disabled={isSubmitting}
            className='submit-button'
          >
            {isSubmitting ? "Procesando..." : "Registrar Pago"}
          </button>
        </form>

        <p className='footer-text'>
          Sus datos serán procesados de forma segura
        </p>
      </div>
    </div>
  );
}

export default App;
