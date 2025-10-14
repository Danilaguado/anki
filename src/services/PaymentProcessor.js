// src/services/PaymentProcessor.js
import Tesseract from "tesseract.js";

export class PaymentProcessor {
  constructor() {
    this.expectedCedula = "23621688";
    this.expectedPhone = "04125497936";
    // Más variaciones del banco
    this.expectedBanks = [
      "bnc",
      "0191",
      "banconacionaldecredito",
      "banconacional",
      "nacionaldecredito",
      "nacional",
      "credito",
    ];
  }

  cleanText(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s.\-()]/g, "")
      .toLowerCase();
  }

  extractReference(text) {
    const patterns = [
      /(?:referencia|operaci[oó]n|nro\.?\s*de\s*referencia)[:\s]*(\d+)/gi,
      /(?:operaci[oó]n)[:\s]*(\d+)/gi,
      /(?:ref)[:\s]*(\d+)/gi,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const numbers = match[0].match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const reference = numbers.sort((a, b) => b.length - a.length)[0];
          console.log("📋 Referencia encontrada:", reference);
          return reference;
        }
      }
    }

    console.log("📋 Referencia: NO encontrada");
    return null;
  }

  extractNumbers(text) {
    const numbers = text.match(/\d+/g) || [];
    return numbers.join("");
  }

  containsCedula(text) {
    const cleanedText = this.cleanText(text);
    const cedula = this.cleanText(this.expectedCedula);

    const cedulaVariations = [cedula, `v${cedula}`];

    return cedulaVariations.some((variation) =>
      cleanedText.includes(variation)
    );
  }

  containsPhone(text) {
    const cleanedText = this.cleanText(text);
    const phone = this.cleanText(this.expectedPhone);

    const phoneVariations = [phone, phone.substring(1), phone.substring(2)];

    return phoneVariations.some(
      (variation) => cleanedText.includes(variation) && variation.length >= 10
    );
  }

  containsBank(text) {
    const cleanedText = this.cleanText(text);

    console.log("🏦 Texto limpio para buscar banco:", cleanedText);
    console.log("🏦 Buscando variaciones:", this.expectedBanks);

    const found = this.expectedBanks.some((bank) => {
      const isFound = cleanedText.includes(bank);
      if (isFound) {
        console.log(`🏦 ✓ Encontrado: "${bank}"`);
      }
      return isFound;
    });

    return found;
  }

  extractAmounts(text) {
    const amounts = [];

    // Patrón 1: números con formato decimal
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

    // Si no encontró nada con decimales, busca números enteros
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

    return [...new Set(amounts)];
  }

  containsAmount(text, expectedAmount) {
    if (!expectedAmount) {
      console.log("⚠️ No hay monto esperado");
      return false;
    }

    const expected = parseFloat(expectedAmount);
    const amounts = this.extractAmounts(text);

    console.log("💰 Monto esperado:", expected);
    console.log("💰 Montos encontrados:", amounts);

    // Busca el monto exacto (± 0.5)
    const exactMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= 0.5
    );

    if (exactMatch) {
      console.log("✓ Match exacto encontrado:", exactMatch);
      return true;
    }

    // Busca montos cercanos (± 15%)
    const closeMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= expected * 0.15
    );

    if (closeMatch) {
      console.log("✓ Match cercano encontrado:", closeMatch);
      return true;
    }

    console.log("✗ No se encontró match de monto");
    return false;
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  async processImage(file, expectedAmount = null) {
    try {
      const img = await this.loadImage(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = avg > 128 ? 255 : 0;
        data[i] = threshold;
        data[i + 1] = threshold;
        data[i + 2] = threshold;
      }

      ctx.putImageData(imageData, 0, 0);

      const processedBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      const result = await Tesseract.recognize(processedBlob, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`Progreso OCR: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const extractedText = result.data.text;
      console.log("========== TEXTO EXTRAÍDO ==========");
      console.log(extractedText);
      console.log("====================================");

      const hasCedula = this.containsCedula(extractedText);
      const hasPhone = this.containsPhone(extractedText);
      const hasBank = this.containsBank(extractedText);
      const hasAmount = this.containsAmount(extractedText, expectedAmount);
      const reference = this.extractReference(extractedText);

      console.log("========== VALIDACIÓN ==========");
      console.log("✓ Cédula esperada:", this.expectedCedula);
      console.log("✓ Cédula encontrada:", hasCedula ? "SÍ" : "NO");
      console.log("✓ Teléfono esperado:", this.expectedPhone);
      console.log("✓ Teléfono encontrado:", hasPhone ? "SÍ" : "NO");
      console.log("✓ Bancos esperados:", this.expectedBanks);
      console.log("✓ Banco encontrado:", hasBank ? "SÍ" : "NO");
      console.log("✓ Monto esperado:", expectedAmount);
      console.log("✓ Monto validado:", hasAmount ? "SÍ" : "NO");
      console.log("📋 Referencia:", reference || "NO encontrada");
      console.log("================================");

      // IMPORTANTE: Si falta el banco pero todo lo demás está bien, igual aprobar
      const isValid = hasCedula && hasPhone && hasAmount;

      if (isValid && !hasBank) {
        console.log(
          "⚠️ ADVERTENCIA: Banco no detectado pero otros datos válidos"
        );
      }

      return {
        success: isValid,
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
