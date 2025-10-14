// src/services/PaymentProcessor.js
import Tesseract from "tesseract.js";

export class PaymentProcessor {
  constructor() {
    this.expectedCedula = "23621688";
    this.expectedPhone = "04125497936";
    this.expectedBanks = ["bnc", "0191", "banconacionaldecredito"]; // Variaciones del banco
  }

  // Limpia texto para comparación
  cleanText(text) {
    return text
      .normalize("NFD") // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
      .replace(/[\s.\-()]/g, "") // Elimina espacios, puntos, guiones
      .toLowerCase();
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

  // NUEVO: Verifica si contiene el banco
  containsBank(text) {
    const cleanedText = this.cleanText(text);

    // Busca cualquiera de las variaciones del banco
    return this.expectedBanks.some((bank) => cleanedText.includes(bank));
  }

  // NUEVO: Extrae montos del texto (busca patrones numéricos)
  extractAmounts(text) {
    // Busca patrones de montos: números con comas o puntos decimales
    const amountPatterns = [
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g, // Formato: 1.234,56 o 1,234.56
      /(\d+[.,]\d{2})/g, // Formato simple: 123.45 o 123,45
      /(\d+)/g, // Solo números enteros
    ];

    const amounts = [];
    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          // Normaliza el formato (convierte todo a punto decimal)
          const normalized = match.replace(/\./g, "").replace(",", ".");
          const amount = parseFloat(normalized);
          if (!isNaN(amount) && amount > 0) {
            amounts.push(amount);
          }
        });
        // Si encontramos con este patrón, no seguimos buscando
        if (amounts.length > 0) break;
      }
    }
    return amounts;
  }

  // NUEVO: Verifica si el monto está presente en el texto
  containsAmount(text, expectedAmount) {
    if (!expectedAmount) {
      return false;
    }

    const expected = parseFloat(expectedAmount);
    const amounts = this.extractAmounts(text);

    console.log("Monto esperado:", expected);
    console.log("Montos encontrados en el comprobante:", amounts);

    // Busca el monto exacto o con un margen de error de 0.5 (por errores de OCR)
    const foundAmount = amounts.find(
      (amount) => Math.abs(amount - expected) <= 0.5
    );

    return !!foundAmount;
  }

  // Procesa la imagen con OCR
  async processImage(file, expectedAmount = null) {
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
      const hasBank = this.containsBank(extractedText);
      const hasAmount = this.containsAmount(extractedText, expectedAmount);

      return {
        success: hasCedula && hasPhone && hasBank && hasAmount,
        text: extractedText,
        details: {
          hasCedula,
          hasPhone,
          hasBank,
          hasAmount,
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
}
