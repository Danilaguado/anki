// src/components/PaymentForm.js
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import "../styles/PaymentForm.css";
import {
  CopyIcon,
  CheckIcon,
  FileCheckIcon,
  DollarIcon,
  LockIcon,
  UploadIcon,
} from "./Icons";

const PaymentForm = forwardRef(({ onSubmit, isSubmitting }, ref) => {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    whatsappNumber: "",
  });
  const [comprobante, setComprobante] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
          "https://ve.dolarapi.com/v1/dolares/paralelo"
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
      } catch (error) {
        console.error("Error al obtener tasa del dólar:", error);
      } finally {
        setLoadingDollar(false);
      }
    };
    fetchDollarRate();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!formData.nombre.trim()) newErrors.nombre = true;
    if (!formData.correo.trim() || !formData.correo.includes("@"))
      newErrors.correo = true;
    if (!comprobante) newErrors.comprobante = true;
    if (!acceptedTerms) newErrors.terms = true;

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

    if (onSubmit) {
      await onSubmit({
        formData,
        comprobante,
        paymentData,
      });
    }
  };

  const resetForm = () => {
    setFormData({ nombre: "", correo: "", whatsappNumber: "" });
    setComprobante(null);
    setAcceptedTerms(false);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useImperativeHandle(ref, () => ({ resetForm }));

  return (
    <div className='payment-card'>
      <div className='header'>
        <h1>Registro de Pago</h1>
        <p className='subtitle'>
          Complete el formulario para registrar su pago móvil.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='payment-form'>
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
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <UploadIcon />
              Seleccionar archivo
            </button>
            <span className='file-name-display'>
              {comprobante ? comprobante.name : "Ningún archivo seleccionado"}
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

        <button type='submit' disabled={isSubmitting} className='submit-button'>
          <LockIcon />
          {isSubmitting ? "Procesando..." : "Registrar Pago"}
        </button>
      </form>
    </div>
  );
});

PaymentForm.displayName = "PaymentForm";

export default PaymentForm;
