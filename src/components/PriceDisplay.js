// src/components/PriceDisplay.js
import React, { useState, useEffect } from "react";
import "../styles/PriceDisplay.css";

const PriceDisplay = () => {
  const [dollarRate, setDollarRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDollarRate = async () => {
      try {
        // Reutilizamos la lógica de caché de sessionStorage que ya tienes
        const sessionRate = sessionStorage.getItem("dollarRate");
        const sessionTimestamp = sessionStorage.getItem("dollarRateTimestamp");

        if (sessionRate && sessionTimestamp) {
          const timestamp = new Date(sessionTimestamp);
          const now = new Date();
          const hoursDiff = (now - timestamp) / (1000 * 60 * 60);

          if (hoursDiff < 1) {
            setDollarRate(parseFloat(sessionRate));
            setLoading(false);
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
      } catch (error) {
        console.error("Error fetching dollar rate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDollarRate();
  }, []);

  if (loading) {
    return <div className='price-container loading'>Cargando precio...</div>;
  }

  if (!dollarRate) {
    // Si no se puede cargar, no mostramos nada para no romper el diseño.
    return null;
  }

  // Tomamos el precio base de 1 USD como está en tu lógica de PaymentForm
  const priceInBolivares = dollarRate * 3;
  // Calculamos el precio original sumando el 33% al precio con descuento
  const originalPrice = priceInBolivares / (1 - 0.33);

  return (
    <div className='price-container'>
      <div className='price-display'>
        <span className='discount'>-33%</span>
        <span className='price'>
          <sup>Bs.</sup>
          {priceInBolivares.toFixed(2).replace(".", ",").split(",")[0]}
          <sup>{priceInBolivares.toFixed(2).split(",")[1]}</sup>
        </span>
      </div>
      <div className='original-price'>
        Precio de capa sugerido:{" "}
        <s>Bs. {originalPrice.toFixed(2).replace(".", ",")}</s>
      </div>
    </div>
  );
};

export default PriceDisplay;
