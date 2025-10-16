import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../styles/PrePaymentPage.css";

const PrePaymentPage = () => {
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const product = searchParams.get("product");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Por favor, ingresa un número de teléfono o e-mail.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/register-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      console.error("Error submitting phone:", err);
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
        <h1 className='prepayment-title'>Inicia sesión o crea una cuenta</h1>
        <p className='prepayment-subtitle'>
          Ingresa tu número de celular o e-mail
        </p>

        <form onSubmit={handleSubmit} className='prepayment-form'>
          <div className='form-group'>
            <label htmlFor='phone-input'>Número de celular o e-mail</label>
            <input
              type='text'
              id='phone-input'
              name='phone'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='Número de celular o e-mail'
              disabled={isSubmitting}
              autoFocus
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
          {/* Este enlace te llevará a WhatsApp. Puedes cambiar el número si es necesario. */}
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
