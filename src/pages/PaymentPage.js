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
    // 👇 DEBUG: VERIFICAR TELÉFONO 👇
    console.log("🔍 DEBUGGEO - sessionStorage completo:");
    console.log(sessionStorage);

    const phone = sessionStorage.getItem("userPhone");
    console.log("📱 Teléfono obtenido de sessionStorage:", phone);
    console.log("📱 Tipo de phone:", typeof phone);
    console.log("📱 ¿phone es null?:", phone === null);
    console.log("📱 ¿phone es undefined?:", phone === undefined);
    console.log("📱 Longitud de phone:", phone?.length);
    // 👆 FIN DEBUG

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
        console.log("✅ OCR Exitoso. Teléfono a enviar:", phone);

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
            phone: phone, // 👈 ENVIAR EL TELÉFONO
          }),
        });
        const result = await response.json();

        console.log("📡 Respuesta del servidor:", result);

        if (result.success) {
          console.log("✅ Pago registrado exitosamente");
          setProcessingStatus({ stage: "success" });
          if (formRef.current) {
            formRef.current.resetForm();
          }
          // LIMPIAR sessionStorage DESPUÉS DEL ÉXITO
          sessionStorage.removeItem("userPhone");
        } else {
          throw new Error(result.message || "Error al procesar el pago.");
        }
      } else {
        // PAGO RECHAZADO - Notificar al admin
        console.error("❌ Validación fallida:", validationResult);

        // Convertir la imagen a Base64 para enviarla al admin
        const comprobanteBase64 = await fileToBase64(data.comprobante);

        console.log("📞 Enviando teléfono en rechazo:", phone);

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
            phone: phone, // 👈 ENVIAR EL TELÉFONO
          }),
        });

        // Mostrar modal de error al usuario
        setProcessingStatus({ stage: "error" });
      }
    } catch (error) {
      console.error("❌ Error en processPayment:", error);
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
