import React, { useState } from "react";

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

const PaymentForm = () => {
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1a1a1a",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          Registro de Pago
        </h1>
        <p
          style={{
            color: "#666",
            fontSize: "14px",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Complete el formulario para registrar su pago móvil
        </p>

        {message.text && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "6px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor:
                message.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${
                message.type === "success" ? "#86efac" : "#fecaca"
              }`,
              color: message.type === "success" ? "#166534" : "#991b1b",
            }}
          >
            <AlertIcon />
            <span style={{ fontSize: "14px" }}>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#1a1a1a",
                marginBottom: "8px",
              }}
            >
              Nombre Completo
            </label>
            <input
              type='text'
              name='nombre'
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder='Ingrese su nombre completo'
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Correo */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#1a1a1a",
                marginBottom: "8px",
              }}
            >
              Correo Electrónico
            </label>
            <input
              type='email'
              name='correo'
              value={formData.correo}
              onChange={handleInputChange}
              placeholder='correo@ejemplo.com'
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Datos del Pago Móvil */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "16px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#1a1a1a",
                marginBottom: "12px",
              }}
            >
              Datos para Pago Móvil
            </label>

            {Object.entries(paymentData).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    textTransform: "capitalize",
                  }}
                >
                  {key === "banco"
                    ? "Banco"
                    : key === "telefono"
                    ? "Teléfono"
                    : "Cédula"}
                  :
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1a1a1a",
                    }}
                  >
                    {value}
                  </span>
                  <button
                    type='button'
                    onClick={() =>
                      copyToClipboard(value.replace(/\./g, ""), key)
                    }
                    style={{
                      padding: "4px",
                      background: copiedField === key ? "#10b981" : "#e5e7eb",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.2s",
                    }}
                    title='Copiar'
                  >
                    {copiedField === key ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Referencia */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#1a1a1a",
                marginBottom: "8px",
              }}
            >
              Últimos 4 Dígitos de Referencia
            </label>
            <input
              type='text'
              name='referencia'
              value={formData.referencia}
              onChange={handleInputChange}
              placeholder='0000'
              maxLength='4'
              pattern='[0-9]*'
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Términos y Condiciones */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                color: "#4b5563",
              }}
            >
              <input
                type='checkbox'
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{
                  marginTop: "2px",
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                }}
              />
              <span>
                Acepto los{" "}
                <a
                  href='#'
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
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
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: isSubmitting ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.target.style.backgroundColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.target.style.backgroundColor = "#3b82f6";
            }}
          >
            {isSubmitting ? "Procesando..." : "Registrar Pago"}
          </button>
        </form>

        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          Sus datos serán procesados de forma segura
        </p>
      </div>
    </div>
  );
};

export default PaymentForm;
