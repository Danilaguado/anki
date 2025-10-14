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

    // Buscar la cédula con o sin "V" al inicio
    const cedulaVariations = [
      cedula, // 23621688
      `v${cedula}`, // v23621688 (con V-)
    ];

    return cedulaVariations.some((variation) =>
      cleanedText.includes(variation)
    );
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
    const amounts = [];

    // Busca patrones más específicos para montos en bolívares
    const patterns = [
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:Bs|bs|BS)/gi, // "583,00 Bs"
      /(?:Bs|bs|BS)\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/gi, // "Bs 583,00"
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g, // Solo números con decimales
      /(\d+[.,]\d{2})/g, // Números simples con 2 decimales
    ];

    const textClean = text.replace(/\s+/g, " "); // Normaliza espacios

    for (const pattern of patterns) {
      const matches = textClean.matchAll(pattern);
      for (const match of matches) {
        const numStr = match[1] || match[0];
        const normalized = numStr.replace(/\./g, "").replace(",", ".");
        const amount = parseFloat(normalized);

        if (!isNaN(amount) && amount > 0 && amount < 1000000) {
          amounts.push(amount);
        }
      }
      if (amounts.length > 0) break; // Si encontró con este patrón, no sigue
    }

    return [...new Set(amounts)]; // Elimina duplicados
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

    // Busca el monto exacto (± 0.5)
    const exactMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= 0.5
    );

    if (exactMatch) return true;

    // Si no hay match exacto, busca montos que difieran en menos del 15%
    // (para errores de OCR como 889 → 989)
    const closeMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= expected * 0.15
    );

    return !!closeMatch;
  }

  // Procesa la imagen con OCR
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
      console.log("========== TEXTO EXTRAÍDO ==========");
      console.log(extractedText);
      console.log("====================================");

      // Fase 2: Validando datos
      const hasCedula = this.containsCedula(extractedText);
      const hasPhone = this.containsPhone(extractedText);
      const hasBank = this.containsBank(extractedText);
      const hasAmount = this.containsAmount(extractedText, expectedAmount);

      // LOGS DETALLADOS
      console.log("========== VALIDACIÓN ==========");
      console.log("✓ Cédula esperada:", this.expectedCedula);
      console.log("✓ Cédula encontrada:", hasCedula ? "SÍ" : "NO");

      console.log("✓ Teléfono esperado:", this.expectedPhone);
      console.log("✓ Teléfono encontrado:", hasPhone ? "SÍ" : "NO");

      console.log("✓ Bancos esperados:", this.expectedBanks);
      console.log("✓ Banco encontrado:", hasBank ? "SÍ" : "NO");

      console.log("✓ Monto esperado:", expectedAmount);
      console.log("✓ Montos encontrados:", this.extractAmounts(extractedText));
      console.log("✓ Monto validado:", hasAmount ? "SÍ" : "NO");

      console.log("✓ Texto limpio:", this.cleanText(extractedText));
      console.log("================================");

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
