import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
      setError("Por favor, ingresa un número de teléfono.");
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

      if (result.success) {
        // Si todo sale bien, redirigimos al formulario de pago, pasando el producto
        navigate(`/payment?product=${encodeURIComponent(product)}`);
      } else {
        throw new Error(result.message || "Ocurrió un error.");
      }
    } catch (err) {
      setError("No se pudo procesar tu solicitud. Intenta de nuevo.");
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
        <h1 className='prepayment-title'>Estás a un paso</h1>
        <p className='prepayment-subtitle'>
          Ingresa tu número de WhatsApp para continuar con la compra.
        </p>

        <form onSubmit={handleSubmit} className='prepayment-form'>
          <div className='form-group'>
            <label htmlFor='phone'>Número de Teléfono</label>
            <input
              type='tel'
              id='phone'
              name='phone'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='Ej: 0412 123 4567'
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
        <p className='prepayment-footer'>
          Al continuar, aceptas recibir información sobre tu compra y futuras
          ofertas.
        </p>
      </div>
    </div>
  );
};

export default PrePaymentPage;
