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

  // Extrae el número de referencia del comprobante
  extractReference(text) {
    // Patrones para buscar la referencia
    const patterns = [
      /(?:referencia|operaci[oó]n|nro\.?\s*de\s*referencia)[:\s]*(\d+)/gi,
      /(?:operaci[oó]n)[:\s]*(\d+)/gi,
      /(?:ref)[:\s]*(\d+)/gi,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Extrae solo los números
        const numbers = match[0].match(/\d+/g);
        if (numbers && numbers.length > 0) {
          // Toma el número más largo (probablemente sea la referencia)
          const reference = numbers.sort((a, b) => b.length - a.length)[0];
          console.log("📋 Referencia encontrada:", reference);
          return reference;
        }
      }
    }

    console.log("📋 Referencia: NO encontrada");
    return null;
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

    // Patrón 1: Busca números con formato decimal (583,00 o 583.00)
    const pattern1 = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;
    let matches = text.match(pattern1);

    if (matches) {
      matches.forEach((match) => {
        const normalized = match.replace(/\./g, "").replace(",", ".");
        const amount = parseFloat(normalized);
        if (!isNaN(amount) && amount > 0 && amount < 1000000) {
          amounts.push(amount);
        }
      });
    }

    // Si no encontró nada con decimales, busca números enteros grandes
    if (amounts.length === 0) {
      const pattern2 = /\b(\d{2,4})\b/g;
      matches = text.match(pattern2);

      if (matches) {
        matches.forEach((match) => {
          const amount = parseFloat(match);
          if (!isNaN(amount) && amount > 10 && amount < 100000) {
            amounts.push(amount);
          }
        });
      }
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

  // Método auxiliar para cargar imagen
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  // Procesa la imagen con OCR
  // Procesa la imagen con OCR
  async processImage(file, expectedAmount = null) {
    try {
      // Crear un canvas para preprocesar la imagen
      const img = await this.loadImage(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      // Dibujar la imagen
      ctx.drawImage(img, 0, 0);

      // Aumentar contraste y convertir a escala de grises
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        // Aumentar contraste (umbral)
        const threshold = avg > 128 ? 255 : 0;
        data[i] = threshold; // R
        data[i + 1] = threshold; // G
        data[i + 2] = threshold; // B
      }

      ctx.putImageData(imageData, 0, 0);

      // Convertir canvas a blob
      const processedBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      // Fase 1: Iniciando OCR con imagen procesada
      const result = await Tesseract.recognize(processedBlob, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`Progreso: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const extractedText = result.data.text;
      console.log("========== TEXTO EXTRAÍDO ==========");
      console.log(extractedText);
      console.log("====================================");

      // Fase 2: Validando datos
      const hasCedula = this.containsCedula(extractedText);
      const hasPhone = this.containsPhone(extractedText);
      const hasBank = this.containsBank(extractedText);
      const hasAmount = this.containsAmount(extractedText, expectedAmount);
      const reference = this.extractReference(extractedText);

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
      console.log("📋 Referencia:", reference || "NO encontrada");
      console.log("✓ Monto validado:", hasAmount ? "SÍ" : "NO");

      console.log("✓ Texto limpio:", this.cleanText(extractedText));
      console.log("================================");

      return {
        success: hasCedula && hasPhone && hasBank && hasAmount,
        text: extractedText,
        reference: reference,
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
