// src/services/PaymentProcessor.js

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

    // Buscar API key en variables de entorno
    this.geminiApiKey =
      process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

    if (!this.geminiApiKey) {
      console.error(
        "❌ ERROR: No se encontró GEMINI_API_KEY en las variables de entorno"
      );
      throw new Error("Falta configurar GEMINI_API_KEY");
    }

    console.log("✅ Gemini Vision API configurada correctamente");
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

  // ========================================
  // GEMINI VISION - EXTRACCIÓN
  // ========================================

  async extractWithGemini(file, expectedAmount) {
    console.log("🤖 Enviando imagen a Gemini Vision API...");

    try {
      const base64Image = await this.imageToBase64(file);

      const prompt = `Analiza esta imagen de un comprobante de pago móvil venezolano y extrae la siguiente información en formato JSON:

{
  "monto": "el monto total en bolívares (solo números con decimales, ej: 889.35)",
  "referencia": "número de referencia u operación completo",
  "banco": "nombre del banco completo",
  "telefono": "número de teléfono del beneficiario",
  "cedula": "cédula del beneficiario (solo números)",
  "fecha": "fecha de la transacción"
}

INSTRUCCIONES IMPORTANTES:
- El MONTO es el número más grande y prominente, busca cerca de "Bs" o en el centro
- El monto esperado es aproximadamente ${expectedAmount} Bs (pero puede tener decimales diferentes)
- El TELÉFONO del beneficiario debe ser 04125497936 o similar (10 dígitos que empiecen con 04)
- La CÉDULA debe ser 23621688 o similar
- El BANCO debe contener "BNC" o "Banco Nacional" o "Nacional de Crédito"
- La REFERENCIA es un número largo (6+ dígitos), diferente al monto
- Si no encuentras algún campo, usa null
- NO inventes datos que no veas claramente

Responde SOLO con el JSON válido, sin markdown ni explicaciones.`;

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
        console.error("❌ Error de Gemini API:", errorData);
        throw new Error(
          `Gemini API error ${response.status}: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]) {
        throw new Error("Respuesta de Gemini sin datos válidos");
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      console.log("📝 Respuesta raw de Gemini:", textResponse);

      // Limpiar markdown si existe
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
      console.error("❌ Error en extractWithGemini:", error);
      throw error;
    }
  }

  // ========================================
  // VALIDACIONES
  // ========================================

  validateCedula(cedula) {
    if (!cedula) return false;
    const cleanCedula = this.cleanText(String(cedula));
    const expectedClean = this.cleanText(this.expectedCedula);
    return cleanCedula.includes(expectedClean);
  }

  validatePhone(telefono) {
    if (!telefono) return false;
    const cleanPhone = this.cleanText(String(telefono));
    const expectedClean = this.cleanText(this.expectedPhone);
    // Buscar con o sin el 0 inicial
    return (
      cleanPhone.includes(expectedClean) ||
      cleanPhone.includes(expectedClean.substring(1))
    );
  }

  validateBank(banco) {
    if (!banco) return false;
    const cleanBank = this.cleanText(String(banco));
    return this.expectedBanks.some((bank) => cleanBank.includes(bank));
  }

  validateAmount(monto, expectedAmount) {
    if (!monto || !expectedAmount) return false;

    const amountStr = String(monto).replace(/[,\s]/g, "");
    const amount = parseFloat(amountStr);
    const expected = parseFloat(expectedAmount);

    if (isNaN(amount) || isNaN(expected)) return false;

    // Match exacto (± 1 Bs)
    if (Math.abs(amount - expected) <= 1) {
      console.log(`✅ Match exacto: ${amount} ≈ ${expected}`);
      return true;
    }

    // Comparar dígitos ignorando punto decimal
    const expectedDigits = expected.toFixed(2).replace(/[.,]/g, "");
    const amountDigits = amount.toFixed(2).replace(/[.,]/g, "");

    if (expectedDigits === amountDigits) {
      console.log(
        `✅ Match de dígitos: ${amount} → "${amountDigits}" = "${expectedDigits}"`
      );
      return true;
    }

    // Buscar coincidencia parcial de dígitos (80% o más)
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
        `⚠️ Match parcial: ${amount} (${Math.round(
          matchPercentage * 100
        )}% coincidencia)`
      );
      return true;
    }

    // Buscar dígitos desordenados
    const expectedSorted = expectedDigits.split("").sort().join("");
    const amountSorted = amountDigits.split("").sort().join("");

    if (expectedSorted === amountSorted) {
      console.log(`⚠️ Match desordenado: ${amount} → dígitos coinciden`);
      return true;
    }

    // Match cercano (± 20%)
    if (Math.abs(amount - expected) <= expected * 0.2) {
      console.log(
        `✅ Match cercano: ${amount} (dentro del ±20% de ${expected})`
      );
      return true;
    }

    console.log(`❌ No match: ${amount} vs ${expected}`);
    return false;
  }

  validateGeminiData(data, expectedAmount) {
    console.log("\n--- VALIDANDO DATOS DE GEMINI ---");

    const hasCedula = this.validateCedula(data.cedula);
    const hasPhone = this.validatePhone(data.telefono);
    const hasBank = this.validateBank(data.banco);
    const hasAmount = this.validateAmount(data.monto, expectedAmount);

    console.log(
      `🆔 Cédula: ${data.cedula || "null"} → ${hasCedula ? "✅" : "❌"}`
    );
    console.log(
      `📱 Teléfono: ${data.telefono || "null"} → ${hasPhone ? "✅" : "❌"}`
    );
    console.log(`🏦 Banco: ${data.banco || "null"} → ${hasBank ? "✅" : "❌"}`);
    console.log(
      `💰 Monto: ${data.monto || "null"} (esperado: ${expectedAmount}) → ${
        hasAmount ? "✅" : "❌"
      }`
    );
    console.log(`📋 Referencia: ${data.referencia || "N/A"}`);
    console.log("--------------------------------\n");

    const validCount = [hasCedula, hasPhone, hasBank, hasAmount].filter(
      Boolean
    ).length;

    return {
      hasCedula,
      hasPhone,
      hasBank,
      hasAmount,
      reference: data.referencia || "N/A",
      validCount,
    };
  }

  // ========================================
  // MÉTODO PRINCIPAL
  // ========================================

  async processImage(file, expectedAmount = null) {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 INICIANDO PROCESAMIENTO CON GEMINI VISION");
    console.log("=".repeat(60));
    console.log(`📄 Archivo: ${file.name}`);
    console.log(`📏 Tamaño: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`💰 Monto esperado: Bs. ${expectedAmount}`);
    console.log("=".repeat(60) + "\n");

    try {
      // Extraer datos con Gemini
      const extractedData = await this.extractWithGemini(file, expectedAmount);

      // Validar datos extraídos
      const validation = this.validateGeminiData(extractedData, expectedAmount);

      // Decidir si es válido (mínimo 2 validaciones correctas)
      const isValid = validation.validCount >= 2;

      console.log(
        `${isValid ? "✅" : "❌"} Validaciones exitosas: ${
          validation.validCount
        }/4`
      );
      console.log(`${isValid ? "✅ PAGO APROBADO" : "❌ PAGO RECHAZADO"}\n`);

      return {
        success: isValid,
        text: JSON.stringify(extractedData, null, 2),
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
