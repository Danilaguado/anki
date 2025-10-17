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
      /\b(\d{6,})\b/g, // Números largos que podrían ser referencias
    ];

    const allReferences = [];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match) => {
        const numbers = match[0].match(/\d+/g);
        if (numbers && numbers.length > 0) {
          numbers.forEach((num) => {
            if (num.length >= 6) {
              // Referencias típicamente tienen al menos 6 dígitos
              allReferences.push(num);
            }
          });
        }
      });
    }

    // Retornar la referencia más larga (probablemente la correcta)
    if (allReferences.length > 0) {
      const reference = allReferences.sort((a, b) => b.length - a.length)[0];
      return reference;
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
    const found = this.expectedBanks.some((bank) => {
      const isFound = cleanedText.includes(bank);
      if (isFound) {
      }
      return isFound;
    });

    return found;
  }

  extractAmounts(text) {
    const amounts = [];

    // Patrón 1: números con formato decimal (punto o coma)
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

    // Patrón 2: números enteros grandes
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

    // Match exacto (± 1)
    const exactMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= 1
    );

    if (exactMatch) {
      return true;
    }

    // Match cercano (± 20%)
    const closeMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= expected * 0.2
    );

    if (closeMatch) {
      return true;
    }

    return false;
  }

  // FUNCIÓN MEJORADA: Preprocesamiento más inteligente
  preprocessImage(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. DETECTAR SI ES IMAGEN OSCURA
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    const isDarkImage = avgBrightness < 128;

    console.log(
      `📊 Brillo promedio: ${avgBrightness.toFixed(
        2
      )}, Es oscura: ${isDarkImage}`
    );

    // 2. INVERTIR SI ES OSCURA
    if (isDarkImage) {
      console.log("🔄 Invirtiendo colores...");
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }

    // 3. AUMENTAR SATURACIÓN/BRILLO antes del contraste
    const brightnessBoost = 30;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + brightnessBoost);
      data[i + 1] = Math.min(255, data[i + 1] + brightnessBoost);
      data[i + 2] = Math.min(255, data[i + 2] + brightnessBoost);
    }

    // 4. CONTRASTE EXTREMO
    const contrast = 3.0; // Aumentado de 1.5 a 3.0
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, contrast * (data[i] - 128) + 128));
      data[i + 1] = Math.min(
        255,
        Math.max(0, contrast * (data[i + 1] - 128) + 128)
      );
      data[i + 2] = Math.min(
        255,
        Math.max(0, contrast * (data[i + 2] - 128) + 128)
      );
    }

    // 5. ESCALA DE GRISES
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // 6. BINARIZACIÓN ADAPTATIVA MÁS AGRESIVA
    // Calcular threshold por bloque (más efectivo para fondos grises)
    const blockSize = 50;
    const tempData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        // Calcular promedio del bloque
        let sum = 0;
        let count = 0;

        for (let by = y; by < Math.min(y + blockSize, height); by++) {
          for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
            const i = (by * width + bx) * 4;
            sum += tempData[i];
            count++;
          }
        }

        const blockThreshold = (sum / count) * 0.85; // Threshold adaptativo

        // Aplicar threshold al bloque
        for (let by = y; by < Math.min(y + blockSize, height); by++) {
          for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
            const i = (by * width + bx) * 4;
            const value = data[i] > blockThreshold ? 255 : 0;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    console.log("✅ Preprocesamiento completado");
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async processImage(file, expectedAmount = null) {
    try {
      // Cargar imagen
      const img = await this.loadImage(file);

      // Crear canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Escalar si es muy grande
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

      // Dibujar imagen
      ctx.drawImage(img, 0, 0, width, height);

      // Preprocesar
      this.preprocessImage(ctx, width, height);

      // Convertir a blob
      const processedBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      // Ejecutar OCR con mejores configuraciones
      const result = await Tesseract.recognize(processedBlob, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text") {
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚáéíóúÑñ.,:-() ",
      });

      const extractedText = result.data.text;
      // Validaciones
      const hasCedula = this.containsCedula(extractedText);
      const hasPhone = this.containsPhone(extractedText);
      const hasBank = this.containsBank(extractedText);
      const hasAmount = this.containsAmount(extractedText, expectedAmount);
      const reference = this.extractReference(extractedText);

      // Validación: requiere cédula, teléfono y monto
      // El banco es opcional porque a veces no se detecta bien
      const isValid = hasCedula && hasPhone && hasAmount;

      return {
        success: isValid,
        text: extractedText,
        reference: reference || "N/A",
        details: {
          hasCedula,
          hasPhone,
          hasBank,
          hasAmount,
          confidence: result.data.confidence,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        text: "",
        reference: null,
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
