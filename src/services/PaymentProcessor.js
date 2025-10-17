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
    console.log("✅ PaymentProcessor con Tesseract OCR inicializado");
  }

  // ========================================
  // MÉTODOS AUXILIARES
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

    // Patrón 1: Buscar CUALQUIER número con comas o puntos
    const pattern1 = /(\d+[.,]\d+)/g;
    let matches = text.match(pattern1);

    if (matches) {
      matches.forEach((match) => {
        const normalized = match.replace(",", ".");
        const amount = parseFloat(normalized);
        if (!isNaN(amount) && amount > 0) {
          amounts.push(amount);
        }
      });
    }

    // Patrón 2: Buscar números cerca de "Bs"
    const bsPattern = /Bs\.?\s*(\d+[.,]?\d*)/gi;
    matches = text.match(bsPattern);

    if (matches) {
      matches.forEach((match) => {
        const numbers = match.match(/\d+[.,]?\d*/);
        if (numbers) {
          const normalized = numbers[0].replace(",", ".");
          const amount = parseFloat(normalized);
          if (!isNaN(amount) && amount > 0) {
            amounts.push(amount);
          }
        }
      });
    }

    // Patrón 3: números grandes (3+ dígitos)
    const pattern3 = /\b(\d{3,})\b/g;
    matches = text.match(pattern3);

    if (matches) {
      matches.forEach((match) => {
        const amount = parseFloat(match);
        if (!isNaN(amount) && amount > 50) {
          amounts.push(amount);
        }
      });
    }

    console.log(`🔍 Todos los números encontrados: [${amounts.join(", ")}]`);
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

    // Comparar solo los DÍGITOS (ignorar punto/coma)
    const expectedDigits = expected.toFixed(2).replace(/[.,]/g, "");

    for (const amount of amounts) {
      const amountDigits = amount.toFixed(2).replace(/[.,]/g, "");

      // Si los dígitos son EXACTAMENTE los mismos
      if (amountDigits === expectedDigits) {
        console.log(
          `✅ Match de dígitos encontrado: ${amount} → "${amountDigits}" (esperado: ${expected} → "${expectedDigits}")`
        );
        return true;
      }

      // Si coinciden al menos el 80% de los dígitos en orden
      if (expectedDigits.length >= 4) {
        let matchCount = 0;
        let expectedIndex = 0;

        for (
          let i = 0;
          i < amountDigits.length && expectedIndex < expectedDigits.length;
          i++
        ) {
          if (amountDigits[i] === expectedDigits[expectedIndex]) {
            matchCount++;
            expectedIndex++;
          }
        }

        const matchPercentage = matchCount / expectedDigits.length;
        if (matchPercentage >= 0.8) {
          console.log(
            `⚠️ Match parcial de dígitos: ${amount} → "${amountDigits}" (${Math.round(
              matchPercentage * 100
            )}% coincidencia con "${expectedDigits}")`
          );
          return true;
        }
      }
    }

    // Buscar los mismos dígitos desordenados
    const expectedDigitsSorted = expectedDigits.split("").sort().join("");

    for (const amount of amounts) {
      const amountDigits = amount.toFixed(2).replace(/[.,]/g, "");
      const amountDigitsSorted = amountDigits.split("").sort().join("");

      if (amountDigitsSorted === expectedDigitsSorted) {
        console.log(
          `⚠️ Match de dígitos desordenados: ${amount} → "${amountDigits}" (esperado: ${expected} → "${expectedDigits}")`
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

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = URL.createObjectURL(file);
    });
  }

  // ========================================
  // PREPROCESAMIENTO - 3 ESTRATEGIAS
  // ========================================

  preprocessImage(ctx, width, height, strategy = "balanced") {
    console.log(`🎨 Aplicando estrategia: ${strategy}`);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Convertir a escala de grises SIEMPRE
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }

    // Calcular brillo promedio
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += data[i];
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    console.log(`📊 Brillo promedio: ${avgBrightness.toFixed(2)}/255`);

    if (strategy === "inverted") {
      // ESTRATEGIA 1: Invertir colores (para imágenes oscuras)
      console.log("🔄 Invirtiendo colores...");
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    } else if (strategy === "high-contrast") {
      // ESTRATEGIA 2: Alto contraste (para imágenes claras)
      console.log("⚡ Aplicando alto contraste...");
      const contrast = 5.0;
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
    } else {
      // ESTRATEGIA 3: Balanceado (contraste moderado)
      console.log("⚖️ Aplicando contraste balanceado...");
      const contrast = 2.5;
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
    }

    // Binarización adaptativa
    const blockSize = 20;
    const tempData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let sum = 0;
        let count = 0;

        for (let by = y; by < Math.min(y + blockSize, height); by++) {
          for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
            const i = (by * width + bx) * 4;
            sum += tempData[i];
            count++;
          }
        }

        const blockThreshold = (sum / count) * 0.8;

        for (let by = y; by < Math.min(y + blockSize, height); by++) {
          for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
            const i = (by * width + bx) * 4;
            const value = data[i] > blockThreshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = value;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    console.log(`✅ Preprocesamiento "${strategy}" completado`);
  }

  // ========================================
  // TESSERACT - INTENTOS MÚLTIPLES
  // ========================================

  async processWithTesseract(file, expectedAmount) {
    console.log("🔧 Procesando con Tesseract OCR - Modo Multi-Estrategia...");

    try {
      const img = await this.loadImage(file);

      let width = img.width;
      let height = img.height;
      const maxDimension = 2000;

      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }

      const strategies = ["balanced", "high-contrast", "inverted"];
      const results = [];

      // Procesar con cada estrategia
      for (const strategy of strategies) {
        console.log(`\n${"=".repeat(50)}`);
        console.log(`🧪 INTENTANDO ESTRATEGIA: ${strategy.toUpperCase()}`);
        console.log("=".repeat(50));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        this.preprocessImage(ctx, width, height, strategy);

        const processedBlob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png", 1.0)
        );

        const result = await Tesseract.recognize(processedBlob, "spa", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const progress = Math.round(m.progress * 100);
              if (progress % 20 === 0) {
                console.log(`  OCR [${strategy}]: ${progress}%`);
              }
            }
          },
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_char_whitelist:
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚáéíóúÑñ.,:-()Bs ",
        });

        const extractedText = result.data.text;
        console.log(
          `📄 Texto extraído [${strategy}]:`,
          extractedText.substring(0, 150) + "..."
        );
        console.log(`📊 Confianza OCR: ${result.data.confidence.toFixed(2)}%`);

        const hasCedula = this.containsCedula(extractedText);
        const hasPhone = this.containsPhone(extractedText);
        const hasBank = this.containsBank(extractedText);
        const hasAmount = this.containsAmount(extractedText, expectedAmount);
        const reference = this.extractReference(extractedText);

        const validCount = [hasCedula, hasPhone, hasBank, hasAmount].filter(
          Boolean
        ).length;

        console.log(`\n--- VALIDACIONES [${strategy}] ---`);
        console.log(`🆔 Cédula: ${hasCedula ? "✅" : "❌"}`);
        console.log(`📱 Teléfono: ${hasPhone ? "✅" : "❌"}`);
        console.log(`🏦 Banco: ${hasBank ? "✅" : "❌"}`);
        console.log(`💰 Monto: ${hasAmount ? "✅" : "❌"}`);
        console.log(`📋 Referencia: ${reference || "N/A"}`);
        console.log(`✅ Total: ${validCount}/4`);
        console.log(`📊 Confianza: ${result.data.confidence.toFixed(2)}%`);

        results.push({
          strategy,
          extractedText,
          hasCedula,
          hasPhone,
          hasBank,
          hasAmount,
          reference,
          validCount,
          confidence: result.data.confidence,
          score: validCount * 100 + result.data.confidence,
        });

        // 👇 NUEVA LÓGICA: Si ya tiene suficientes validaciones, detener
        if (validCount >= 1) {
          console.log(
            `\n🎯 ¡VALIDACIÓN EXITOSA CON ${strategy.toUpperCase()}!`
          );
          console.log(`⏭️  Saltando estrategias restantes (optimización)`);
          break; // Salir del loop
        }
      }

      // Ordenar por mejor puntuación
      results.sort((a, b) => b.score - a.score);

      console.log("\n" + "=".repeat(60));
      console.log("🏆 RESULTADOS FINALES");
      console.log("=".repeat(60));
      results.forEach((r, i) => {
        console.log(
          `${i + 1}. ${r.strategy.toUpperCase()} - Score: ${r.score.toFixed(
            2
          )} (${r.validCount}/4 validaciones, ${r.confidence.toFixed(
            2
          )}% confianza)`
        );
      });

      // Seleccionar el mejor resultado
      const bestResult = results[0];
      console.log(
        `\n✅ MEJOR ESTRATEGIA: ${bestResult.strategy.toUpperCase()}`
      );
      console.log(`✅ Validaciones: ${bestResult.validCount}/4`);
      console.log(`✅ Confianza: ${bestResult.confidence.toFixed(2)}%`);

      const isValid = bestResult.validCount >= 1;

      return {
        success: isValid,
        text: bestResult.extractedText,
        reference: bestResult.reference || "N/A",
        method: `tesseract-${bestResult.strategy}`,
        details: {
          hasCedula: bestResult.hasCedula,
          hasPhone: bestResult.hasPhone,
          hasBank: bestResult.hasBank,
          hasAmount: bestResult.hasAmount,
          validCount: bestResult.validCount,
          confidence: bestResult.confidence,
          allResults: results.map((r) => ({
            strategy: r.strategy,
            validCount: r.validCount,
            confidence: r.confidence,
            score: r.score,
          })),
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
    console.log("🚀 INICIANDO PROCESO DE VALIDACIÓN");
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
        console.log("\n✅ ¡VALIDACIÓN EXITOSA!");
        return tesseractResult;
      }

      console.log("\n⚠️ Validación no exitosa");
      console.log(`   Validaciones: ${tesseractResult.details.validCount}/4`);
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
          validCount: 0,
          confidence: 0,
        },
      };
    }
  }
}
