// src/services/PaymentProcessor.js

export class PaymentProcessor {
  constructor() {
    console.log("✅ PaymentProcessor inicializado (modo API)");
  }

  async imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async processImage(file, expectedAmount = null) {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 INICIANDO PROCESAMIENTO DE IMAGEN");
    console.log("=".repeat(60));
    console.log(`📄 Archivo: ${file.name}`);
    console.log(`📏 Tamaño: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`💰 Monto esperado: Bs. ${expectedAmount}`);
    console.log("=".repeat(60) + "\n");

    try {
      // Convertir imagen a base64
      const imageBase64 = await this.imageToBase64(file);

      console.log("📤 Enviando imagen al servidor...");

      // Llamar al API endpoint
      const response = await fetch("/api/process-payment-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          expectedAmount,
          fileName: file.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error en el servidor");
      }

      console.log("📥 Respuesta del servidor:", result);

      return {
        success: result.success,
        text: JSON.stringify(result.extractedData, null, 2),
        reference: result.reference,
        extractedData: result.extractedData,
        method: "gemini",
        details: result.details,
      };
    } catch (error) {
      console.error("❌ ERROR:", error);
      return {
        success: false,
        error: error.message,
        text: "",
        reference: null,
        method: "error",
        details: {
          hasCedula: false,
          hasPhone: false,
          hasBank: false,
          hasAmount: false,
          confidence: 0,
        },
      };
    }
  }
}
