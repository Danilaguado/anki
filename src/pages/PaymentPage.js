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

  // Función auxiliar para convertir File a Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

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
        // PAGO APROBADO
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
            montoEsperado: data.expectedAmount,
            isRejected: false,
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
        // PAGO RECHAZADO - Notificar al admin
        console.error("Validación fallida:", validationResult);

        // Convertir la imagen a Base64 para enviarla al admin
        const comprobanteBase64 = await fileToBase64(data.comprobante);

        // Enviar notificación al administrador
        await fetch("/api/submit-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: data.formData.nombre,
            correo: data.formData.correo,
            fecha: new Date().toISOString(),
            producto:
              new URLSearchParams(window.location.search).get("product") ||
              "El Código de la Conexión",
            montoEsperado: data.expectedAmount,
            validationError: validationResult,
            comprobanteBase64: comprobanteBase64,
            isRejected: true,
          }),
        });

        // Mostrar modal de error al usuario
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
