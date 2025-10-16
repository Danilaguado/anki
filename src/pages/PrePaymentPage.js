import React, { useState, useEffect } from "react"; // <-- Asegúrate de importar useEffect
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../styles/PrePaymentPage.css";

const PrePaymentPage = () => {
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const product = searchParams.get("product");

  // 👇 INICIA LA NUEVA LÓGICA 👇
  useEffect(() => {
    const handleFocus = () => {
      document.body.classList.add("prepayment-keyboard-active");
    };
    const handleBlur = () => {
      document.body.classList.remove("prepayment-keyboard-active");
    };

    const phoneInput = document.getElementById("phone-input");
    if (phoneInput) {
      phoneInput.addEventListener("focus", handleFocus);
      phoneInput.addEventListener("blur", handleBlur);
    }

    // Función de limpieza para cuando el usuario abandona la página
    return () => {
      if (phoneInput) {
        phoneInput.removeEventListener("focus", handleFocus);
        phoneInput.removeEventListener("blur", handleBlur);
      }
      // Asegurarnos de que la clase se elimine al salir
      document.body.classList.remove("prepayment-keyboard-active");
    };
  }, []); // El array vacío asegura que esto se ejecute solo una vez
  // ☝️ FINALIZA LA NUEVA LÓGICA ☝️

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Por favor, ingresa un número de teléfono.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/register-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        navigate(`/payment?product=${encodeURIComponent(product)}`);
      } else {
        throw new Error(result.message || "Ocurrió un error al registrar.");
      }
    } catch (err) {
      setError("No se pudo procesar tu solicitud. Intenta de nuevo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='prepayment-container'>
      <div className='prepayment-card'>
        <img
          src='/assets/kaizenjpg.jpg'
          alt='Proyecto Kaizen Logo'
          className='prepayment-logo'
        />
        <h1 className='prepayment-title'>Accede a tu compra</h1>
        <p className='prepayment-subtitle'>
          Ingresa tu número de celular para continuar
        </p>
        <form onSubmit={handleSubmit} className='prepayment-form'>
          <div className='form-group'>
            <label htmlFor='phone-input'>Número de Celular</label>
            <input
              type='tel'
              id='phone-input' // El ID que usamos para encontrar el input
              name='phone'
              value={phone}
              onChange={handlePhoneChange}
              placeholder='Ej: 04121234567'
              disabled={isSubmitting}
              autoFocus
              inputMode='numeric'
              pattern='[0-9]*'
            />
          </div>
          {error && <p className='prepayment-error'>{error}</p>}
          <button
            type='submit'
            disabled={isSubmitting}
            className='prepayment-button'
          >
            {isSubmitting ? "Procesando..." : "Continuar"}
          </button>
        </form>
        <div className='prepayment-footer'>
          <p>
            Al continuar, usted concuerda con las{" "}
            <Link to='/terms' target='_blank'>
              Condiciones de Uso
            </Link>{" "}
            y el{" "}
            <Link to='/terms' target='_blank'>
              Aviso de Privacidad
            </Link>{" "}
            de Proyecto Kaizen.
          </p>
          <a
            href='https://wa.me/5511958682671'
            target='_blank'
            rel='noopener noreferrer'
            className='help-link'
          >
            ¿Necesitas ayuda?
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrePaymentPage;
