import React, { useState, useEffect, useRef } from "react";
import "./PaymentForm.css";

const styles =

// ==================== ICONOS SVG ====================
const CopyIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <rect x='9' y='9' width='13' height='13' rx='2' ry='2'></rect>
    <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path>
  </svg>
);

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
        const response = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
        const data = await response.json();
        setDollarRate(data.promedio);
        
        if (data.fechaActualizacion) {
          const date = new Date(data.fechaActualizacion);
          setLastUpdate(date.toLocaleString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }));
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
        firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (firstErrorKey !== 'terms' && firstErrorKey !== 'comprobante') {
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
            <div className={`form-group ${errors.nombre ? 'error' : ''}`}>
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

            <div className={`form-group ${errors.correo ? 'error' : ''}`}>
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
                      className={`copy-button ${copiedField === key ? "copied" : ""}`}
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
                      $USD Cotización BCV: <strong>Bs. {dollarRate.toFixed(2)}</strong>
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

            <div className={`form-group ${errors.comprobante ? 'error' : ''}`} ref={formRefs.comprobante}>
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
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <UploadIcon />
                  Seleccionar archivo
                </button>
                <span className='file-name-display'>
                  {comprobante ? comprobante.name : 'Ningún archivo seleccionado'}
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
              <div className={`whatsapp-input-container ${receiveWhatsapp ? "open" : ""}`}>
                <div className={`form-group ${errors.whatsappNumber ? 'error' : ''}`}>
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
                <span style={{ color: errors.terms ? '#ef4444' : '#4b5563' }}>
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

const CheckIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <polyline points='20 6 9 17 4 12'></polyline>
  </svg>
);

const FileCheckIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
    <polyline points='14 2 14 8 20 8'></polyline>
    <polyline points='9 15 11 17 15 13'></polyline>
  </svg>
);

const DollarIcon = () => (
  <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <line x1='12' y1='1' x2='12' y2='23'></line>
    <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path>
  </svg>
);

const LockIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <rect x='3' y='11' width='18' height='11' rx='2' ry='2'></rect>
    <path d='M7 11V7a5 5 0 0 1 10 0v4'></path>
  </svg>
);

const UploadIcon = () => (
  <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
    <polyline points='17 8 12 3 7 8'></polyline>
    <line x1='12' y1='3' x2='12' y2='15'></line>
  </svg>)