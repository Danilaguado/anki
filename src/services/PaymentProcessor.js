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
    // Vercel usa GEMINI_API_KEY, React usa REACT_APP_GEMINI_API_KEY
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
    // Ejemplo: Si esperamos 889.35, también buscar 89.35 ó 9.35
    const expectedStr = expected.toString();
    for (let i = 1; i < expectedStr.length; i++) {
      const partialExpected = parseFloat(expectedStr.substring(i));
      const partialMatch = amounts.find(
        (amount) => Math.abs(amount - partialExpected) <= 1
      );
      if (partialMatch) {
        console.log(
          `⚠️ Match parcial encontrado: ${partialMatch} (esperado: ${expected})`
        );
        return true; // Aceptar como válido
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

    // 3. AUMENTAR BRILLO
    const brightnessBoost = 30;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + brightnessBoost);
      data[i + 1] = Math.min(255, data[i + 1] + brightnessBoost);
      data[i + 2] = Math.min(255, data[i + 2] + brightnessBoost);
    }

    // 4. CONTRASTE EXTREMO
    const contrast = 3.0;
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

    // 6. BINARIZACIÓN ADAPTATIVA
    const blockSize = 50;
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

        const blockThreshold = (sum / count) * 0.85;

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

      const isValid = hasCedula && hasPhone && hasAmount;

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
  // GEMINI VISION (FALLBACK)
  // ========================================

  async imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async extractWithGemini(file, expectedAmount) {
    try {
      const base64Image = await this.imageToBase64(file);

      const prompt = `Analiza esta imagen de un comprobante de pago móvil venezolano y extrae ÚNICAMENTE la siguiente información en formato JSON:

{
  "monto": "el monto total en bolívares (solo números con decimales, ej: 583.00)",
  "referencia": "número de referencia u operación (solo números, mínimo 6 dígitos)",
  "banco": "nombre del banco completo",
  "telefono": "número de teléfono destino (formato 04xxxxxxxxx)",
  "cedula": "cédula del beneficiario (solo números, sin V ni guiones)",
  "fecha": "fecha de la transacción (formato DD/MM/YYYY)"
}

INSTRUCCIONES CRÍTICAS:
- El MONTO es el número MÁS GRANDE y PROMINENTE de la imagen, usualmente cerca de "Bs" o en el centro/arriba
- Busca números como: 583,00 o 583.00 o 583 Bs
- El monto esperado es aproximadamente ${expectedAmount} Bs
- La REFERENCIA es un número largo (6+ dígitos), diferente al monto
- El TELÉFONO debe ser 04125497936 o similar
- La CÉDULA debe ser 23621688 o similar
- Si no encuentras algún campo con certeza, usa null
- NO inventes datos, solo extrae lo que ves claramente

Responde SOLO con el JSON válido, sin markdown ni texto adicional.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: file.type,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API error ${response.status}: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;

      console.log("📝 Respuesta raw de Gemini:", textResponse);

      let cleanedResponse = textResponse.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
      }

      const extractedData = JSON.parse(cleanedResponse);
      console.log("✅ Datos extraídos por Gemini:", extractedData);

      return extractedData;
    } catch (error) {
      console.error("❌ Error en Gemini Vision:", error);
      throw error;
    }
  }

  validateGeminiData(data, expectedAmount) {
    const results = {
      hasCedula: false,
      hasPhone: false,
      hasBank: false,
      hasAmount: false,
      reference: data.referencia || "N/A",
    };

    if (data.cedula) {
      const cleanCedula = this.cleanText(String(data.cedula));
      const expectedClean = this.cleanText(this.expectedCedula);
      results.hasCedula = cleanCedula.includes(expectedClean);
      console.log(
        `🆔 Cédula: ${data.cedula} → ${results.hasCedula ? "✅" : "❌"}`
      );
    }

    if (data.telefono) {
      const cleanPhone = this.cleanText(String(data.telefono));
      const expectedClean = this.cleanText(this.expectedPhone);
      results.hasPhone = cleanPhone.includes(expectedClean.substring(1));
      console.log(
        `📱 Teléfono: ${data.telefono} → ${results.hasPhone ? "✅" : "❌"}`
      );
    }

    if (data.banco) {
      const cleanBank = this.cleanText(String(data.banco));
      results.hasBank = this.expectedBanks.some((bank) =>
        cleanBank.includes(bank)
      );
      console.log(`🏦 Banco: ${data.banco} → ${results.hasBank ? "✅" : "❌"}`);
    }

    if (data.monto && expectedAmount) {
      const amountStr = String(data.monto).replace(",", ".");
      const amount = parseFloat(amountStr);
      const expected = parseFloat(expectedAmount);
      const difference = Math.abs(amount - expected);
      results.hasAmount = difference <= Math.max(1, expected * 0.02);
      console.log(
        `💰 Monto: ${amount} vs ${expected} (diff: ${difference.toFixed(
          2
        )}) → ${results.hasAmount ? "✅" : "❌"}`
      );
    }

    return results;
  }

  async processWithGemini(file, expectedAmount) {
    console.log("🤖 Usando Gemini Vision como fallback...");

    const extractedData = await this.extractWithGemini(file, expectedAmount);
    const validation = this.validateGeminiData(extractedData, expectedAmount);
    const fullText = JSON.stringify(extractedData, null, 2);
    const isValid =
      validation.hasCedula && validation.hasPhone && validation.hasAmount;

    return {
      success: isValid,
      text: fullText,
      reference: validation.reference,
      extractedData,
      method: "gemini",
      details: {
        hasCedula: validation.hasCedula,
        hasPhone: validation.hasPhone,
        hasBank: validation.hasBank,
        hasAmount: validation.hasAmount,
        confidence: 95,
      },
    };
  }

  // ========================================
  // MÉTODO PRINCIPAL (OCR → GEMINI)
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
      // 1. INTENTAR CON TESSERACT OCR PRIMERO
      const tesseractResult = await this.processWithTesseract(
        file,
        expectedAmount
      );

      if (tesseractResult.success) {
        console.log("✅ ¡VALIDACIÓN EXITOSA CON TESSERACT OCR!");
        return tesseractResult;
      }

      console.log("⚠️ Tesseract no validó correctamente");
      console.log(
        `   Cédula: ${tesseractResult.details.hasCedula ? "✅" : "❌"}`
      );
      console.log(
        `   Teléfono: ${tesseractResult.details.hasPhone ? "✅" : "❌"}`
      );
      console.log(
        `   Monto: ${tesseractResult.details.hasAmount ? "✅" : "❌"}\n`
      );

      // 2. SI FALLA, INTENTAR CON GEMINI (SI ESTÁ DISPONIBLE)
      if (this.useGemini) {
        console.log("🤖 Intentando con Gemini Vision...\n");

        try {
          const geminiResult = await this.processWithGemini(
            file,
            expectedAmount
          );

          if (geminiResult.success) {
            console.log("✅ ¡VALIDACIÓN EXITOSA CON GEMINI!");
            return geminiResult;
          } else {
            console.log("❌ Gemini tampoco pudo validar");
            return geminiResult; // Retornar el resultado fallido
          }
        } catch (geminiError) {
          console.error("❌ Error en Gemini:", geminiError.message);
          console.log("Retornando resultado de Tesseract...");
          return tesseractResult;
        }
      } else {
        console.log("⚠️ Gemini no está disponible (falta API key)");
        console.log("Retornando resultado de Tesseract...");
        return tesseractResult;
      }
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
