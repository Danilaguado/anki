import React, { useState } from "react";
import "../styles/NewsletterSubscribe.css";

const NewsletterSubscribe = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage("Por favor, ingresa un correo válido.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe-newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus("success");
        setMessage("¡Gracias por suscribirte!");
        setEmail("");
      } else {
        throw new Error(result.message || "Ocurrió un error.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "No se pudo procesar tu solicitud.");
    }
  };

  return (
    <div className='newsletter-container'>
      <h3 className='newsletter-title'>Únete a la comunidad Kaizen</h3>
      <p className='newsletter-subtitle'>
        Recibe estrategias, reflexiones y contenido exclusivo directamente en tu
        correo.
      </p>
      <form onSubmit={handleSubmit} className='newsletter-form'>
        <input
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='Tu correo electrónico'
          disabled={status === "loading"}
          className='newsletter-input'
        />
        <button
          type='submit'
          disabled={status === "loading"}
          className='newsletter-button'
        >
          {status === "loading" ? "Enviando..." : "Suscribirse"}
        </button>
      </form>
      {message && <p className={`newsletter-message ${status}`}>{message}</p>}
      <p className='newsletter-disclaimer'>
        Al suscribirte, aceptas nuestros{" "}
        <a href='/terms' target='_blank' rel='noopener noreferrer'>
          Términos y Condiciones
        </a>
        .
      </p>
    </div>
  );
};

export default NewsletterSubscribe;
