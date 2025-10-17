import React, { useState, useRef, useEffect } from "react"; // 👈 Agregado useEffect
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

  // 👇 LEE EL TELÉFONO UNA SOLA VEZ AL MONTAR EL COMPONENTE
  const phoneRef = useRef(sessionStorage.getItem("userPhone"));

  // 👇 VERIFICA SI HAY TELÉFONO AL CARGAR LA PÁGINA
  useEffect(() => {
    const phone = phoneRef.current;
    console.log("📱 Teléfono al cargar página:", phone);

    if (!phone) {
      console.error("❌ No se encontró teléfono en sessionStorage");
      // Opcional: redirigir a PrePaymentPage si no hay teléfono
      // navigate('/start-purchase');
    }
  }, []);

  const processPayment = async (data) => {
    const phone = phoneRef.current; // 👈 USA LA REFERENCIA

    console.log("=== INICIANDO PROCESO DE PAGO ===");
    console.log("📱 Teléfono a enviar:", phone);
    console.log("Monto esperado:", data.expectedAmount);
    console.log(
      "Producto:",
      new URLSearchParams(window.location.search).get("product")
    );

    if (!phone) {
      console.error("❌ No hay teléfono disponible");
      alert(
        "Error: No se encontró el número de teléfono. Por favor, vuelve a intentar."
      );
      return;
    }

    setProcessingStatus({ stage: "processing" });
    setIsSubmitting(true);

    try {
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
          phoneRef.current = null;
        } else {
          throw new Error(result.message || "Error al procesar el pago.");
        }
      } else {
        // PAGO RECHAZADO
        console.error("❌ Validación fallida:", validationResult);

        const comprobanteBase64 = await fileToBase64(data.comprobante);
        console.log("📞 Enviando teléfono en rechazo:", phone);

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

        setProcessingStatus({ stage: "error" });
      }
    } catch (error) {
      console.error("❌ Error en processPayment:", error);
      setProcessingStatus({ stage: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función auxiliar para convertir File a Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
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
