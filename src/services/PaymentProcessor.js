// Agregar estas mejoras a tu PaymentProcessor.js

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

    // Agregar un sistema de confianza
    this.confidenceThreshold = {
      minimum: 60, // Confianza mínima del OCR
      optimal: 80, // Confianza óptima
    };
  }

  // Método mejorado para extraer montos con mejor precisión
  extractAmounts(text) {
    const amounts = [];

    // Limpiar el texto de caracteres que confunden
    const cleanedText = text
      .replace(/[oO]/g, "0") // O por 0
      .replace(/[lI]/g, "1") // l/I por 1
      .replace(/[sS]\s*(?=\d)/g, "5") // S seguida de número por 5
      .replace(/\s+/g, " "); // Normalizar espacios

    // Patrón mejorado para montos venezolanos
    const patterns = [
      // Formato con Bs o BS
      /(?:Bs?\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi,
      // Formato con palabra "bolivares"
      /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:bolivares?|bsf?)/gi,
      // Números con decimales
      /(\d+[.,]\d{2})/g,
      // Números enteros grandes (posibles montos)
      /\b(\d{2,6})\b/g,
    ];

    const foundAmounts = new Set();

    patterns.forEach((pattern) => {
      const matches = cleanedText.matchAll(pattern);
      for (const match of matches) {
        const amountStr = match[1] || match[0];
        // Normalizar: quitar puntos de miles, cambiar coma por punto
        const normalized = amountStr.replace(/\./g, "").replace(",", ".");

        const amount = parseFloat(normalized);

        if (!isNaN(amount) && amount > 0 && amount < 1000000) {
          foundAmounts.add(amount);
        }
      }
    });

    return Array.from(foundAmounts);
  }

  // Método para validar la calidad de la imagen antes del OCR
  async validateImageQuality(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalBrightness = 0;
    let pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / pixelCount;

    // Validar que la imagen no esté muy oscura o muy clara
    if (avgBrightness < 50) {
      console.warn("⚠️ Imagen muy oscura, puede afectar el OCR");
      return { quality: "low", reason: "too_dark" };
    }

    if (avgBrightness > 200) {
      console.warn("⚠️ Imagen muy clara, puede afectar el OCR");
      return { quality: "low", reason: "too_bright" };
    }

    return { quality: "good" };
  }

  // Método mejorado con reintentos y diferentes configuraciones
  async processImageWithRetry(file, expectedAmount = null, maxRetries = 2) {
    let bestResult = null;
    let attempts = [];

    // Diferentes configuraciones de Tesseract para probar
    const configs = [
      {
        psm: Tesseract.PSM.AUTO,
        lang: "spa",
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚáéíóúÑñ.,:-() ",
      },
      {
        psm: Tesseract.PSM.SINGLE_COLUMN,
        lang: "spa+eng",
        tessedit_char_whitelist: undefined, // Sin restricciones
      },
      {
        psm: Tesseract.PSM.SPARSE_TEXT,
        lang: "spa",
        preserve_interword_spaces: "1",
      },
    ];

    for (let i = 0; i <= maxRetries && i < configs.length; i++) {
      try {
        const result = await this.processImageWithConfig(
          file,
          expectedAmount,
          configs[i]
        );
        attempts.push(result);

        // Si encontramos un resultado válido con alta confianza, lo usamos
        if (
          result.success &&
          result.details.confidence > this.confidenceThreshold.optimal
        ) {
          return result;
        }

        // Guardar el mejor resultado hasta ahora
        if (
          !bestResult ||
          result.details.confidence > bestResult.details.confidence ||
          (result.success && !bestResult.success)
        ) {
          bestResult = result;
        }
      } catch (error) {
        console.error(`Intento ${i + 1} falló:`, error);
      }
    }

    // Analizar todos los intentos para tomar la mejor decisión
    const successfulAttempts = attempts.filter((a) => a.success);

    if (successfulAttempts.length > 0) {
      // Retornar el intento exitoso con mayor confianza
      return successfulAttempts.reduce((best, current) =>
        current.details.confidence > best.details.confidence ? current : best
      );
    }

    return bestResult || attempts[0];
  }

  async processImageWithConfig(file, expectedAmount, config) {
    // Tu código actual de processImage pero usando la config proporcionada
    try {
      const img = await this.loadImage(file);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Escalar imagen
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

      // Validar calidad
      const qualityCheck = await this.validateImageQuality(canvas);
      if (qualityCheck.quality === "low") {
        console.warn("Calidad de imagen baja:", qualityCheck.reason);
      }

      // Preprocesar
      this.preprocessImage(ctx, width, height);

      // Convertir a blob
      const processedBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      // OCR con configuración específica
      const result = await Tesseract.recognize(processedBlob, config.lang, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_pageseg_mode: config.psm,
        tessedit_char_whitelist: config.tessedit_char_whitelist,
        preserve_interword_spaces: config.preserve_interword_spaces,
      });

      const extractedText = result.data.text;
      console.log("Confianza OCR:", result.data.confidence);

      // Validaciones
      const hasCedula = this.containsCedula(extractedText);
      const hasPhone = this.containsPhone(extractedText);
      const hasBank = this.containsBank(extractedText);
      const hasAmount = this.containsAmount(extractedText, expectedAmount);
      const reference = this.extractReference(extractedText);

      // Sistema de puntuación para validación más flexible
      let validationScore = 0;
      const scoreWeights = {
        cedula: 35,
        phone: 35,
        amount: 25,
        bank: 5,
      };

      if (hasCedula) validationScore += scoreWeights.cedula;
      if (hasPhone) validationScore += scoreWeights.phone;
      if (hasAmount) validationScore += scoreWeights.amount;
      if (hasBank) validationScore += scoreWeights.bank;

      // Considerar válido si alcanza 70% del score total
      const isValid = validationScore >= 70;

      return {
        success: isValid,
        text: extractedText,
        reference: reference || "N/A",
        validationScore,
        details: {
          hasCedula,
          hasPhone,
          hasBank,
          hasAmount,
          confidence: result.data.confidence,
          qualityCheck,
        },
      };
    } catch (error) {
      console.error("Error en OCR:", error);
      return {
        success: false,
        error: error.message,
        text: "",
        reference: null,
        validationScore: 0,
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

  // Usar el método con reintentos en lugar del original
  async processImage(file, expectedAmount = null) {
    return this.processImageWithRetry(file, expectedAmount);
  }
}
