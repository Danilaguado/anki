// src/services/PaymentProcessor.js
import Tesseract from "tesseract.js";

export class PaymentProcessor {
  constructor() {
    this.expectedCedula = "23621688";
    this.expectedPhone = "04125497936";
    this.expectedBanks = [
      "bnc",
      "0191",
      "banconacionaldecredito",
      "banconacional",
      "nacionaldecredito",
      "nacional",
      "credito",
    ];
    this.geminiApiKey =
      process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
    this.useGemini = !!this.geminiApiKey;

    if (this.useGemini) {
      console.log("✅ Gemini Vision disponible como respaldo");
    } else {
      console.log("⚠️ Solo Tesseract OCR disponible (sin Gemini fallback)");
    }
  }

  // ========================================
  // MÉTODOS COMUNES
  // ========================================

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
      /\b(\d{6,})\b/g,
    ];

    const allReferences = [];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match) => {
        const numbers = match[0].match(/\d+/g);
        if (numbers && numbers.length > 0) {
          numbers.forEach((num) => {
            if (num.length >= 6) {
              allReferences.push(num);
            }
          });
        }
      });
    }

    if (allReferences.length > 0) {
      return allReferences.sort((a, b) => b.length - a.length)[0];
    }

    return null;
  }

  containsCedula(text) {
    const cleanedText = this.cleanText(text);
    const cedula = this.cleanText(this.expectedCedula);
    const cedulaVariations = [cedula, `v${cedula}`, `v-${cedula}`];
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
    return this.expectedBanks.some((bank) => cleanedText.includes(bank));
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

    // Patrón 2: números enteros
    const pattern2 = /\b(\d{2,6})\b/g;
    matches = text.match(pattern2);

    if (matches) {
      matches.forEach((match) => {
        const amount = parseFloat(match);
        if (!isNaN(amount) && amount > 10 && amount < 100000) {
          amounts.push(amount);
        }
      });
    }

    return [...new Set(amounts)];
  }

  containsAmount(text, expectedAmount) {
    if (!expectedAmount) {
      return false;
    }

    const expected = parseFloat(expectedAmount);
    const amounts = this.extractAmounts(text);

    console.log(`💰 Montos encontrados en texto: [${amounts.join(", ")}]`);
    console.log(`💰 Monto esperado: ${expected}`);

    // Match exacto (± 1)
    const exactMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= 1
    );

    if (exactMatch) {
      console.log(`✅ Match exacto encontrado: ${exactMatch}`);
      return true;
    }

    // 👇 NUEVA LÓGICA: Buscar el monto SIN el primer dígito
    const expectedStr = expected.toString();
    for (let i = 1; i < expectedStr.length; i++) {
      const partialExpected = parseFloat(expectedStr.substring(i));
      if (isNaN(partialExpected)) continue;

      const partialMatch = amounts.find(
        (amount) => Math.abs(amount - partialExpected) <= 1
      );

      if (partialMatch) {
        console.log(
          `⚠️ Match parcial encontrado: ${partialMatch} (esperado: ${expected})`
        );
        return true;
      }
    }

    // Match cercano (± 20%)
    const closeMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= expected * 0.2
    );

    if (closeMatch) {
      console.log(`✅ Match cercano encontrado: ${closeMatch}`);
      return true;
    }

    console.log(`❌ No se encontró el monto esperado`);
    return false;
  }

  // ========================================
  // TESSERACT OCR (MÉTODO PRINCIPAL)
  // ========================================

  preprocessImage(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. Convert to Grayscale first for consistent processing
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }

    // 2. Auto-Invert based on brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += data[i]; // Already grayscale, so R, G, and B are the same
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    const isDarkImage = avgBrightness < 128;

    console.log(
      `📊 Brillo promedio: ${avgBrightness.toFixed(
        2
      )}, Es oscura: ${isDarkImage}`
    );

    if (isDarkImage) {
      console.log("🔄 Invirtiendo colores (imagen oscura detectada)...");
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }

    // 3. Apply a stronger, more controlled contrast enhancement
    const contrast = 2.0; // A strong but safe contrast value
    const factor =
      (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(
        0,
        Math.min(255, factor * (data[i + 1] - 128) + 128)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, factor * (data[i + 2] - 128) + 128)
      );
    }

    // 4. Binarization (Thresholding) to make text stand out
    const threshold = 128; // Standard threshold for binary conversion
    for (let i = 0; i < data.length; i += 4) {
      const finalValue = data[i] > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = finalValue;
    }

    ctx.putImageData(imageData, 0, 0);
    console.log("✅ Preprocesamiento de imagen mejorado completado.");
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = URL.createObjectURL(file);
    });
  }

  async processWithTesseract(file, expectedAmount) {
    console.log("🔧 Procesando con Tesseract OCR...");

    try {
      const img = await this.loadImage(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;
      const maxDimension = 2000;

      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      this.preprocessImage(ctx, width, height);

      const processedBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      const result = await Tesseract.recognize(processedBlob, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`  OCR: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚáéíóúÑñ.,:-()Bs ",
      });

      const extractedText = result.data.text;
      console.log(
        "📄 Texto extraído:",
        extractedText.substring(0, 200) + "..."
      );

      const hasCedula = this.containsCedula(extractedText);
      const hasPhone = this.containsPhone(extractedText);
      const hasBank = this.containsBank(extractedText);
      const hasAmount = this.containsAmount(extractedText, expectedAmount);
      const reference = this.extractReference(extractedText);

      console.log("\n--- VALIDACIONES TESSERACT ---");
      console.log(`🆔 Cédula: ${hasCedula ? "✅" : "❌"}`);
      console.log(`📱 Teléfono: ${hasPhone ? "✅" : "❌"}`);
      console.log(`🏦 Banco: ${hasBank ? "✅" : "❌"}`);
      console.log(`💰 Monto: ${hasAmount ? "✅" : "❌"}`);
      console.log(`📋 Referencia: ${reference || "N/A"}`);
      console.log("----------------------------\n");

      // Acepta con 2 o más validaciones correctas
      const validCount = [hasCedula, hasPhone, hasBank, hasAmount].filter(
        Boolean
      ).length;
      const isValid = validCount >= 2;

      console.log(`✅ Validaciones exitosas: ${validCount}/4`);

      return {
        success: isValid,
        text: extractedText,
        reference: reference || "N/A",
        method: "tesseract",
        details: {
          hasCedula,
          hasPhone,
          hasBank,
          hasAmount,
          confidence: result.data.confidence,
        },
      };
    } catch (error) {
      console.error("❌ Error en Tesseract:", error);
      throw error;
    }
  }

  // ========================================
  // MÉTODO PRINCIPAL
  // ========================================

  async processImage(file, expectedAmount = null) {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 INICIANDO PROCESAMIENTO DE IMAGEN");
    console.log("=".repeat(60));
    console.log(`📄 Archivo: ${file.name}`);
    console.log(`📏 Tamaño: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`💰 Monto esperado: Bs. ${expectedAmount}`);
    console.log("=".repeat(60) + "\n");

    try {
      const tesseractResult = await this.processWithTesseract(
        file,
        expectedAmount
      );

      if (tesseractResult.success) {
        console.log("✅ ¡VALIDACIÓN EXITOSA CON TESSERACT OCR!");
        return tesseractResult;
      }

      console.log("⚠️ Tesseract no validó correctamente");
      return tesseractResult;
    } catch (error) {
      console.error("❌ ERROR CRÍTICO:", error);
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
