// src/components/PaymentForm.js
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/PaymentForm.css";
import {
  CopyIcon,
  CheckIcon,
  FileCheckIcon,
  LockIcon,
  UploadIcon,
} from "./Icons";

const PaymentForm = forwardRef(({ onSubmit, isSubmitting }, ref) => {
  const [searchParams] = useSearchParams();
  const productName = searchParams.get("product") || "Producto Digital";

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    whatsappNumber: "",
  });
  const [comprobante, setComprobante] = useState(null);
  const [errors, setErrors] = useState({});
  const [copiedField, setCopiedField] = useState("");
  const [dollarRate, setDollarRate] = useState(null);
  const [loadingDollar, setLoadingDollar] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const fileInputRef = useRef(null);
  const formRefs = {
    nombre: useRef(null),
    correo: useRef(null),
    comprobante: useRef(null),
    whatsappNumber: useRef(null),
  };

  const paymentData = {
    banco: { display: "Banco: BNC", value: "0191" },
    telefono: { display: "04125497936", value: "04125497936" },
    cedula: { display: "23621688", value: "23621688" },
  };

  useEffect(() => {
    const fetchDollarRate = async () => {
      try {
        const sessionRate = sessionStorage.getItem("dollarRate");
        const sessionTimestamp = sessionStorage.getItem("dollarRateTimestamp");

        if (sessionRate && sessionTimestamp) {
          const timestamp = new Date(sessionTimestamp);
          const now = new Date();
          const hoursDiff = (now - timestamp) / (1000 * 60 * 60);

          if (hoursDiff < 1) {
            setDollarRate(parseFloat(sessionRate));
            setLastUpdate(
              timestamp.toLocaleString("es-VE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            );
            setLoadingDollar(false);
            return;
          }
        }

        const response = await fetch(
          "https://ve.dolarapi.com/v1/dolares/paralelo"
        );
        const data = await response.json();

        sessionStorage.setItem("dollarRate", data.promedio);
        sessionStorage.setItem("dollarRateTimestamp", new Date().toISOString());

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

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const firstErrorRef = formRefs[firstErrorKey];
      if (firstErrorRef && firstErrorRef.current) {
        firstErrorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        if (firstErrorKey !== "comprobante") {
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
        expectedAmount: totalAmount,
      });
    }
  };

  const resetForm = () => {
    setFormData({ nombre: "", correo: "", whatsappNumber: "" });
    setComprobante(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useImperativeHandle(ref, () => ({ resetForm }));

  // const totalAmount = dollarRate ? (dollarRate * 1).toFixed(2) : null;
  const totalAmount = 583.0;

  return (
    <div className='payment-card'>
      <div className='header-banner'>
        <img
          src='/assets/kaizenjpg.jpg'
          alt='Kaizen Logo'
          className='header-logo'
        />
      </div>

      <div className='header'>
        <h1>Registro de Pago</h1>
        <p className='subtitle'>
          Complete el formulario para adquirir: <strong>{productName}</strong>
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

        <div className='total-amount-container'>
          <div className='total-amount-content'>
            {loadingDollar ? (
              <p className='total-amount-loading'>Calculando monto...</p>
            ) : totalAmount ? (
              <>
                <p className='total-amount'>
                  Total a pagar: <strong>Bs. {totalAmount}</strong>
                </p>
                {lastUpdate && (
                  <p className='last-update'>
                    Última actualización: {lastUpdate}
                  </p>
                )}
              </>
            ) : (
              <p className='total-amount-error'>No se pudo calcular el monto</p>
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

        <button type='submit' disabled={isSubmitting} className='submit-button'>
          <LockIcon />
          {isSubmitting ? "Procesando..." : "Registrar Pago"}
        </button>

        <div className='terms-disclaimer'>
          <p>
            Al hacer clic en "Registrar Pago", usted confirma que es mayor de
            edad y acepta nuestros{" "}
            <a href='/terms' rel='noopener noreferrer'>
              Términos y Condiciones
            </a>{" "}
            y nuestra Política de Privacidad. Acepta que sus datos personales
            sean procesados para verificar el pago y enviar el producto digital
            adquirido.
          </p>
        </div>
      </form>
    </div>
  );
});

PaymentForm.displayName = "PaymentForm";

export default PaymentForm;
