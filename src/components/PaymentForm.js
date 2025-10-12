import React, { useState, useEffect, useRef } from "react";

// ==================== ICONOS SVG ====================
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

const FileCheckIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
    <polyline points='14 2 14 8 20 8'></polyline>
    <polyline points='9 15 11 17 15 13'></polyline>
  </svg>
);

const DollarIcon = () => (
  <svg
    width='20'
    height='20'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <line x1='12' y1='1' x2='12' y2='23'></line>
    <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path>
  </svg>
);

const LockIcon = () => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <rect x='3' y='11' width='18' height='11' rx='2' ry='2'></rect>
    <path d='M7 11V7a5 5 0 0 1 10 0v4'></path>
  </svg>
);

const UploadIcon = () => (
  <svg
    width='20'
    height='20'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
    <polyline points='17 8 12 3 7 8'></polyline>
    <line x1='12' y1='3' x2='12' y2='15'></line>
  </svg>
);

// ==================== ESTILOS ====================
const styles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f3f4f6;
  }

  .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    gap: 24px;
    overflow-y: auto;
  }

  .payment-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 32px;
    max-width: 480px;
    width: 100%;
  }

  .secure-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }

  .secure-badge img {
    max-width: 120px;
    width: 60%;
    height: auto;
  }

  .secure-text {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  .header {
    text-align: center;
    margin-bottom: 24px;
  }

  .header h1 {
    font-size: 22px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  .subtitle {
    color: #6b7280;
    font-size: 14px;
  }

  .payment-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    position: relative;
  }

  .form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
    display: block;
    transition: color 0.3s ease;
  }

  .form-group.error label {
    color: #ef4444;
  }

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    transition: all 0.3s ease;
  }

  .form-group input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }

  .form-group.error input {
    border-color: #ef4444;
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  .file-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .file-input-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .file-input-button:hover {
    background-color: #4338ca;
  }

  .file-input-button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }

  .file-input-hidden {
    position: absolute;
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    z-index: -1;
  }

  .file-name-display {
    flex: 1;
    font-size: 14px;
    color: #6b7280;
    font-style: italic;
  }

  .file-upload-success {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 8px 12px;
    background-color: #f0fdf4;
    border: 1px solid #d1fae5;
    border-radius: 6px;
    color: #065f46;
    font-size: 13px;
    font-weight: 500;
    word-break: break-all;
  }

  .payment-info {
    background: #f9fafb;
    padding: 16px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .payment-info > label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #111827;
    margin-bottom: 12px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .info-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .info-label {
    font-size: 14px;
    color: #6b7280;
  }

  .info-value-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-value {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }

  .copy-button {
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #6b7280;
    transition: background-color 0.2s;
  }

  .copy-button:hover:not(:disabled) {
    background-color: #e5e7eb;
  }

  .copy-button.copied {
    color: #10b981;
  }

  .dollar-rate-container {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
  }

  .dollar-icon {
    color: #10b981;
    flex-shrink: 0;
  }

  .dollar-rate-content {
    flex: 1;
  }

  .dollar-rate {
    color: #111827;
    font-size: 14px;
    font-weight: 500;
    margin: 0;
  }

  .dollar-rate strong {
    font-weight: 600;
    font-size: 14px;
  }

  .dollar-rate-loading {
    color: #6b7280;
    font-size: 14px;
    font-style: italic;
    margin: 0;
  }

  .dollar-rate-error {
    color: #991b1b;
    font-size: 13px;
    margin: 0;
  }

  .last-update {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 4px;
  }

  .terms-container {
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    color: #4b5563;
  }

  .checkbox-label input[type="checkbox"] {
    margin-top: 2px;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .checkbox-label a {
    color: #4f46e5;
    text-decoration: none;
  }

  .checkbox-label a:hover {
    text-decoration: underline;
  }

  .whatsapp-input-container {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-in-out, margin-top 0.3s ease-in-out;
  }

  .whatsapp-input-container.open {
    max-height: 100px;
    margin-top: -8px;
  }

  .submit-button {
    width: 100%;
    padding: 12px;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .submit-button:hover:not(:disabled) {
    background-color: #4338ca;
  }

  .submit-button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }

  @media (max-width: 1024px) {
    .secure-badge img {
      max-width: 100px;
    }
  }

  @media (max-width: 640px) {
    .payment-card {
      padding: 24px 20px;
    }

    .file-input-wrapper {
      flex-direction: column;
      align-items: stretch;
    }

    .file-input-button {
      justify-content: center;
    }

    .secure-badge img {
      max-width: 90px;
    }
  }
`;

// ==================== COMPONENTE PRINCIPAL ====================
function PaymentFormApp() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    whatsappNumber: "",
  });
  const [comprobante, setComprobante] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [receiveWhatsapp, setReceiveWhatsapp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [copiedField, setCopiedField] = useState("");
  const [dollarRate, setDollarRate] = useState(null);
  const [loadingDollar, setLoadingDollar] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const whatsappInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const formRefs = {
    nombre: useRef(null),
    correo: useRef(null),
    comprobante: useRef(null),
    whatsappNumber: useRef(null),
    terms: useRef(null),
  };

  const paymentData = {
    banco: { display: "Banco: BNC", value: "0191" },
    telefono: { display: "04125497936", value: "04125497936" },
    cedula: { display: "23621688", value: "23621688" },
  };

  useEffect(() => {
    const fetchDollarRate = async () => {
      try {
        const response = await fetch(
          "https://ve.dolarapi.com/v1/dolares/oficial"
        );
        const data = await response.json();
        setDollarRate(data.promedio);

        if (data.fechaActualizacion) {
          const date = new Date(data.fechaActualizacion);
          setLastUpdate(
            date.toLocaleString("es-VE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }

        setLoadingDollar(false);
      } catch (error) {
        console.error("Error al obtener tasa del dólar:", error);
        setLoadingDollar(false);
      }
    };

    fetchDollarRate();
  }, []);

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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleFileChange = (e) => {
    setComprobante(e.target.files[0]);
    if (errors.comprobante) {
      setErrors((prev) => ({ ...prev, comprobante: false }));
    }
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
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = true;
    }
    if (!formData.correo.trim() || !formData.correo.includes("@")) {
      newErrors.correo = true;
    }
    if (!comprobante) {
      newErrors.comprobante = true;
    }
    if (receiveWhatsapp && !formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = true;
    }
    if (!acceptedTerms) {
      newErrors.terms = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const firstErrorRef = formRefs[firstErrorKey];

      if (firstErrorRef && firstErrorRef.current) {
        firstErrorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        if (firstErrorKey !== "terms" && firstErrorKey !== "comprobante") {
          firstErrorRef.current.focus();
        }
      }

      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      alert("Pago registrado exitosamente!");
      setFormData({ nombre: "", correo: "", whatsappNumber: "" });
      setComprobante(null);
      setAcceptedTerms(false);
      setReceiveWhatsapp(false);
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <>
      <style>{styles}</style>
      <div className='app-container'>
        <div className='payment-card'>
          <div className='header'>
            <h1>Registro de Pago</h1>
            <p className='subtitle'>
              Complete el formulario para registrar su pago móvil.
            </p>
          </div>

          <div className='payment-form'>
            <div className={`form-group ${errors.nombre ? "error" : ""}`}>
              <label htmlFor='nombre'>Nombre</label>
              <input
                ref={formRefs.nombre}
                type='text'
                id='nombre'
                name='nombre'
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder='Su nombre completo'
                disabled={isSubmitting}
              />
            </div>

            <div className={`form-group ${errors.correo ? "error" : ""}`}>
              <label htmlFor='correo'>Correo Electrónico</label>
              <input
                ref={formRefs.correo}
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
              {Object.entries(paymentData).map(([key, data]) => (
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
                      {key === "banco" ? data.value : data.display}
                    </span>
                    <button
                      type='button'
                      onClick={() => copyToClipboard(data.value, key)}
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

            <div className='dollar-rate-container'>
              <div className='dollar-icon'>
                <DollarIcon />
              </div>
              <div className='dollar-rate-content'>
                {loadingDollar ? (
                  <p className='dollar-rate-loading'>Cargando cotización...</p>
                ) : dollarRate ? (
                  <>
                    <p className='dollar-rate'>
                      $USD Cotización BCV:{" "}
                      <strong>Bs. {dollarRate.toFixed(2)}</strong>
                    </p>
                    {lastUpdate && (
                      <p className='last-update'>
                        Última actualización: {lastUpdate}
                      </p>
                    )}
                  </>
                ) : (
                  <p className='dollar-rate-error'>
                    No se pudo cargar la cotización del dólar
                  </p>
                )}
              </div>
            </div>

            <div
              className={`form-group ${errors.comprobante ? "error" : ""}`}
              ref={formRefs.comprobante}
            >
              <label htmlFor='comprobante'>Sube el comprobante</label>
              <div className='file-input-wrapper'>
                <input
                  ref={fileInputRef}
                  type='file'
                  id='comprobante'
                  name='comprobante'
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  accept='image/*,.pdf'
                  className='file-input-hidden'
                />
                <button
                  type='button'
                  className='file-input-button'
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                  disabled={isSubmitting}
                >
                  <UploadIcon />
                  Seleccionar archivo
                </button>
                <span className='file-name-display'>
                  {comprobante
                    ? comprobante.name
                    : "Ningún archivo seleccionado"}
                </span>
              </div>
              {comprobante && (
                <div className='file-upload-success'>
                  <FileCheckIcon />
                  <span>Archivo cargado correctamente</span>
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
                <div
                  className={`form-group ${
                    errors.whatsappNumber ? "error" : ""
                  }`}
                >
                  <label htmlFor='whatsappNumber'>Número de WhatsApp</label>
                  <input
                    ref={formRefs.whatsappNumber}
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
              <label className='checkbox-label' ref={formRefs.terms}>
                <input
                  type='checkbox'
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors((prev) => ({ ...prev, terms: false }));
                    }
                  }}
                  disabled={isSubmitting}
                />
                <span style={{ color: errors.terms ? "#ef4444" : "#4b5563" }}>
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
              type='button'
              disabled={isSubmitting}
              className='submit-button'
              onClick={handleSubmit}
            >
              <LockIcon />
              {isSubmitting ? "Procesando..." : "Registrar Pago"}
            </button>
          </div>
        </div>

        <div className='secure-badge'>
          <img
            src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"%3E%3Crect fill="%234f46e5" width="200" height="80" rx="8"/%3E%3Cpath fill="%23fff" d="M60 25h-8v-5c0-6.6-5.4-12-12-12s-12 5.4-12 12v5h-8c-2.2 0-4 1.8-4 4v26c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V29c0-2.2-1.8-4-4-4zm-20 22c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm7-22H33v-5c0-3.9 3.1-7 7-7s7 3.1 7 7v5z"/%3E%3Ctext x="75" y="35" fill="%23fff" font-family="Arial" font-size="16" font-weight="bold"%3EPAGO SEGURO%3C/text%3E%3Ctext x="75" y="52" fill="%23fff" font-family="Arial" font-size="11"%3EProtegemos tus datos%3C/text%3E%3C/svg%3E'
            alt='Pago Seguro'
          />
          <span className='secure-text'>Transacción 100% Segura</span>
        </div>
      </div>
    </>
  );
}

export default PaymentFormApp;
