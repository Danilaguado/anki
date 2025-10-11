// src/services/PaymentProcessor.js
import Tesseract from "tesseract.js";

export class PaymentProcessor {
  constructor() {
    this.expectedCedula = "23621688";
    this.expectedPhone = "04125497936";
  }

  // Limpia texto para comparación
  cleanText(text) {
    return text.replace(/[\s.\-()]/g, "").toLowerCase();
  }

  // Extrae números de un texto
  extractNumbers(text) {
    const numbers = text.match(/\d+/g) || [];
    return numbers.join("");
  }

  // Verifica si contiene la cédula
  containsCedula(text) {
    const cleanedText = this.cleanText(text);
    const cedula = this.cleanText(this.expectedCedula);
    return cleanedText.includes(cedula);
  }

  // Verifica si contiene el teléfono
  containsPhone(text) {
    const cleanedText = this.cleanText(text);
    const phone = this.cleanText(this.expectedPhone);

    // Buscar el número completo o variaciones
    const phoneVariations = [
      phone,
      phone.substring(1), // Sin el 0 inicial
      phone.substring(2), // Sin 04
    ];

    return phoneVariations.some(
      (variation) => cleanedText.includes(variation) && variation.length >= 10
    );
  }

  // Procesa la imagen con OCR
  async processImage(file) {
    try {
      // Fase 1: Iniciando OCR
      const result = await Tesseract.recognize(
        file,
        "spa", // Español
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              console.log(`Progreso: ${Math.round(m.progress * 100)}%`);
            }
          },
        }
      );

      const extractedText = result.data.text;
      console.log("Texto extraído:", extractedText);

      // Fase 2: Validando datos
      const hasCedula = this.containsCedula(extractedText);
      const hasPhone = this.containsPhone(extractedText);

      return {
        success: hasCedula && hasPhone,
        text: extractedText,
        details: {
          hasCedula,
          hasPhone,
          confidence: result.data.confidence,
        },
      };
    } catch (error) {
      console.error("Error en OCR:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Simula validación (para testing sin OCR real)
  async mockValidation(file) {
    // Simula delay de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Simula 80% de éxito
    const success = Math.random() > 0.2;

    return {
      success,
      text: "Texto simulado del comprobante",
      details: {
        hasCedula: success,
        hasPhone: success,
        confidence: 85,
      },
    };
  }
}
