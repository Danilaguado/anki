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
    console.log("=== INICIANDO PROCESO DE PAGO ===");
    console.log("Monto esperado:", data.expectedAmount);
    console.log(
      "Producto:",
      new URLSearchParams(window.location.search).get("product")
    );

    setProcessingStatus({ stage: "processing" });
    setIsSubmitting(true);

    try {
      // Validar el comprobante con OCR
      const validationResult = await paymentProcessor.processImage(
        data.comprobante,
        data.expectedAmount
      );

      console.log("=== RESULTADO DE VALIDACIÓN OCR ===");
      console.log("Success:", validationResult.success);
      console.log("Details:", validationResult.details);
      console.log("===================================");

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
              "El Código de la Conexión",
          }),
        });
        const result = await response.json();

        if (result.success) {
          setProcessingStatus({ stage: "success" });
          if (formRef.current) {
            formRef.current.resetForm();
          }
        } else {
          throw new Error(result.message || "Error al procesar el pago.");
        }
      } else {
        console.error("Validación fallida:", validationResult);
        setProcessingStatus({ stage: "error" });
      }
    } catch (error) {
      console.error("Error en processPayment:", error);
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
