import React, { useState, useEffect } from "react";
import "../styles/TopBanner.css";

const TopBanner = () => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const getEndTime = () => {
      let endTime = sessionStorage.getItem("countdownEndTime");

      if (endTime) {
        const remainingTime = parseInt(endTime, 10) - Date.now();

        // Si quedan menos de 3 horas, resetea a 4 horas desde ahora
        if (remainingTime < 3 * 60 * 60 * 1000) {
          const newEndTime = Date.now() + 4 * 60 * 60 * 1000;
          sessionStorage.setItem("countdownEndTime", newEndTime.toString());
          return newEndTime;
        }
        return parseInt(endTime, 10);
      } else {
        // Si no existe, inicializa en 69 horas
        const newEndTime = Date.now() + 69 * 60 * 60 * 1000;
        sessionStorage.setItem("countdownEndTime", newEndTime.toString());
        return newEndTime;
      }
    };

    const endTime = getEndTime();

    const calculateTimeLeft = () => {
      const difference = endTime - Date.now();
      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
        setIsVisible(true);
      } else {
        // Si el tiempo se acabó, resetea la próxima vez que se cargue la página
        sessionStorage.removeItem("countdownEndTime");
        setIsVisible(false);
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Llama una vez al inicio

    return () => clearInterval(timer);
  }, []);

  const formatTime = (unit) => unit.toString().padStart(2, "0");

  if (!isVisible || !timeLeft) {
    return null;
  }

  return (
    <div className='top-banner'>
      Todos los libros con 33% OFF por...{" "}
      <strong>
        {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:
        {formatTime(timeLeft.seconds)}
      </strong>
    </div>
  );
};

export default TopBanner;
