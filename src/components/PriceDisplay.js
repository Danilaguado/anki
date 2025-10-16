import React, { useState, useEffect } from "react";
import "../styles/PriceDisplay.css";

const PriceDisplay = ({ centered = false }) => {
  const [dollarRate, setDollarRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDollarRate = async () => {
      setLoading(true);
      try {
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
        setDollarRate(40.0); // Fallback en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchDollarRate();
  }, []);

  if (loading) {
    return <div className='price-container loading'>Calculando precio...</div>;
  }

  if (!dollarRate) {
    return null; // No mostrar nada si la API falla
  }

  // --- LÓGICA DE PRECIO ---
  const priceInBolivares = dollarRate * 3; // Puedes ajustar el '3' para cambiar el precio en USD
  const discount = 0.33;
  const originalPrice = priceInBolivares * (1 + discount); // Cálculo corregido
  const discountPercentage = Math.round(discount * 100);

  const formatPrice = (price) => {
    const parts = price.toFixed(2).split(".");
    return {
      integer: parts[0],
      decimal: parts[1],
    };
  };

  const formattedCurrent = formatPrice(priceInBolivares);

  return (
    <div className={`price-container ${centered ? "centered" : ""}`}>
      <div className='price-display'>
        <span className='discount'>-{discountPercentage}%</span>
        <span className='price'>
          <sup>Bs.</sup>
          {formattedCurrent.integer}
          <sup>{formattedCurrent.decimal}</sup>
        </span>
      </div>
      <div className='original-price'>
        Valor sin descuento:{" "}
        <s>Bs. {originalPrice.toFixed(2).replace(".", ",")}</s>
      </div>
    </div>
  );
};

export default PriceDisplay;
