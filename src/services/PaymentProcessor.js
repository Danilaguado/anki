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
      console.log("📋 Referencia encontrada:", reference);
      return reference;
    }

    console.log("📋 Referencia: NO encontrada");
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
      console.log("⚠️ No hay monto esperado");
      return false;
    }

    const expected = parseFloat(expectedAmount);
    const amounts = this.extractAmounts(text);

    console.log("💰 Monto esperado:", expected);
    console.log("💰 Montos encontrados:", amounts);

    // Match exacto (± 1)
    const exactMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= 1
    );

    if (exactMatch) {
      console.log("✓ Match exacto encontrado:", exactMatch);
      return true;
    }

    // Match cercano (± 20%)
    const closeMatch = amounts.find(
      (amount) => Math.abs(amount - expected) <= expected * 0.2
    );

    if (closeMatch) {
      console.log("✓ Match cercano encontrado:", closeMatch);
      return true;
    }

    console.log("✗ No se encontró match de monto");
    return false;
  }

  // FUNCIÓN MEJORADA: Preprocesamiento más inteligente
  preprocessImage(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Calcular brillo promedio
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = totalBrightness / (data.length / 4);

    console.log("📊 Brillo promedio de la imagen:", avgBrightness);

    // Ajustar contraste y brillo
    const contrast = 1.5;
    const brightness = avgBrightness < 128 ? 30 : -10;

    for (let i = 0; i < data.length; i += 4) {
      // Aplicar contraste y brillo
      data[i] = Math.min(
        255,
        Math.max(0, contrast * (data[i] - 128) + 128 + brightness)
      );
      data[i + 1] = Math.min(
        255,
        Math.max(0, contrast * (data[i + 1] - 128) + 128 + brightness)
      );
      data[i + 2] = Math.min(
        255,
        Math.max(0, contrast * (data[i + 2] - 128) + 128 + brightness)
      );
    }

    // Convertir a escala de grises
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log("✓ Imagen cargada:", img.width, "x", img.height);
        resolve(img);
      };
      img.onerror = (error) => {
        console.error("✗ Error al cargar imagen:", error);
        reject(error);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async processImage(file, expectedAmount = null) {
    console.log("========== INICIANDO OCR ==========");
    console.log("Archivo:", file.name, "Tamaño:", file.size, "bytes");

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
        console.log("📐 Escalando imagen a:", width, "x", height);
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen
      ctx.drawImage(img, 0, 0, width, height);

      // Preprocesar
      console.log("🎨 Aplicando preprocesamiento...");
      this.preprocessImage(ctx, width, height);

      // Convertir a blob
      const processedBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      console.log("🔍 Iniciando reconocimiento OCR...");

      // Ejecutar OCR con mejores configuraciones
      const result = await Tesseract.recognize(processedBlob, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`⏳ Progreso OCR: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚáéíóúÑñ.,:-() ",
      });

      const extractedText = result.data.text;
      console.log("========== TEXTO EXTRAÍDO ==========");
      console.log(extractedText);
      console.log("Confianza OCR:", result.data.confidence + "%");
      console.log("====================================");

      // Validaciones
      const hasCedula = this.containsCedula(extractedText);
      const hasPhone = this.containsPhone(extractedText);
      const hasBank = this.containsBank(extractedText);
      const hasAmount = this.containsAmount(extractedText, expectedAmount);
      const reference = this.extractReference(extractedText);

      console.log("========== VALIDACIÓN ==========");
      console.log("✓ Cédula esperada:", this.expectedCedula);
      console.log("✓ Cédula encontrada:", hasCedula ? "✅ SÍ" : "❌ NO");
      console.log("✓ Teléfono esperado:", this.expectedPhone);
      console.log("✓ Teléfono encontrado:", hasPhone ? "✅ SÍ" : "❌ NO");
      console.log("✓ Banco encontrado:", hasBank ? "✅ SÍ" : "⚠️ NO");
      console.log("✓ Monto esperado:", expectedAmount);
      console.log("✓ Monto validado:", hasAmount ? "✅ SÍ" : "❌ NO");
      console.log("📋 Referencia:", reference || "❌ NO encontrada");
      console.log("================================");

      // Validación: requiere cédula, teléfono y monto
      // El banco es opcional porque a veces no se detecta bien
      const isValid = hasCedula && hasPhone && hasAmount;

      if (isValid && !hasBank) {
        console.log(
          "⚠️ ADVERTENCIA: Banco no detectado pero otros datos válidos"
        );
      }

      if (isValid && !reference) {
        console.log("⚠️ ADVERTENCIA: Referencia no detectada");
      }

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
      console.error("❌ Error en OCR:", error);
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
