// src/pages/PaymentPage.js
import React, { useState, useRef } from "react";
import "../styles/PaymentForm.css";
import PaymentForm from "../components/PaymentForm";
import SecureBadge from "../components/SecureBadge";
import { ProcessingModal } from "../components/ProcessingModal";
import { PaymentProcessor } from "../services/PaymentProcessor";

function PaymentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const paymentProcessor = useRef(new PaymentProcessor()).current;
  const formRef = useRef(null);

  const processPayment = async (data) => {
    // AGREGAR ESTE LOG AL INICIO
    console.log("=== DATOS RECIBIDOS EN PAYMENTPAGE ===");
    console.log("data completo:", data);
    console.log("data.expectedAmount:", data.expectedAmount);
    console.log("=====================================");

    setProcessingStatus({ stage: "processing" });
    setIsSubmitting(true);

    try {
      // Validar el comprobante con OCR
      const validationResult = await paymentProcessor.processImage(
        data.comprobante,
        data.expectedAmount // ← Verifica que esto esté así
      );

      if (validationResult.success) {
        const response = await fetch("/api/submit-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: data.formData.nombre,
            correo: data.formData.correo,
            referencia: validationResult.reference,
            fecha: new Date().toISOString(),
            producto:
              new URLSearchParams(window.location.search).get("product") ||
              "El Código de la Conexión", // NUEVO
          }),
        });
        const result = await response.json();

        if (result.success) {
          setProcessingStatus({ stage: "success" });
          // Resetear el formulario
          if (formRef.current) {
            formRef.current.resetForm();
          }
        } else {
          throw new Error(result.message || "Error al procesar el pago.");
        }
      } else {
        setProcessingStatus({ stage: "error" });
      }
    } catch (error) {
      console.error("Error:", error);
      setProcessingStatus({ stage: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setProcessingStatus(null);
  };

  return (
    <div className='app-container'>
      <PaymentForm
        ref={formRef}
        onSubmit={processPayment}
        isSubmitting={isSubmitting}
      />
      <SecureBadge />
      <ProcessingModal status={processingStatus} onClose={handleCloseModal} />
    </div>
  );
}

export default PaymentPage;
