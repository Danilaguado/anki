// api/process-payment-image.js

export default async function handler(req, res) {
  console.log("🔵 API /process-payment-image llamada");
  console.log("Method:", req.method);

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido" });
  }

  try {
    const { imageBase64, expectedAmount, fileName } = req.body;

    console.log("📦 Body recibido:");
    console.log("- fileName:", fileName);
    console.log("- expectedAmount:", expectedAmount);
    console.log("- imageBase64 length:", imageBase64?.length || 0);

    if (!imageBase64 || !expectedAmount) {
      console.error("❌ Faltan parámetros");
      return res.status(400).json({
        success: false,
        message: "Falta imageBase64 o expectedAmount",
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY no configurada");
      return res.status(500).json({
        success: false,
        message: "API key no configurada en el servidor",
      });
    }

    console.log("✅ GEMINI_API_KEY encontrada");
    console.log(`🤖 Procesando imagen con Gemini Vision...`);

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
- El monto esperado es aproximadamente ${expectedAmount} Bs
- El TELÉFONO debe ser 04125497936 o similar (10 dígitos que empiecen con 04)
- La CÉDULA debe ser 23621688 o similar
- El BANCO debe contener "BNC" o "Banco Nacional" o "Nacional de Crédito"
- La REFERENCIA es un número largo (6+ dígitos)
- Si no encuentras algún campo, usa null
- NO inventes datos

Responde SOLO con el JSON válido, sin markdown.`;

    console.log("📤 Enviando request a Gemini API...");

    // 👇 AQUÍ ESTÁ EL CAMBIO - USA v1 EN VEZ DE v1beta
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
                  inlineData: {
                    // 👈 Cambio: inlineData en camelCase
                    mimeType: "image/jpeg", // 👈 Cambio: mimeType en camelCase
                    data: imageBase64,
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
    console.log("📥 Respuesta de Gemini - Status:", geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error(
        "❌ Error de Gemini API:",
        JSON.stringify(errorData, null, 2)
      );
      return res.status(500).json({
        success: false,
        message: `Error de Gemini: ${geminiResponse.status}`,
        error: errorData,
      });
    }

    const data = await geminiResponse.json();

    if (!data.candidates || !data.candidates[0]) {
      console.error("❌ Respuesta de Gemini sin candidates");
      return res.status(500).json({
        success: false,
        message: "Respuesta de Gemini inválida",
      });
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    console.log("📝 Texto de Gemini:", textResponse);

    let cleanedResponse = textResponse.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    }

    let extractedData;
    try {
      extractedData = JSON.parse(cleanedResponse);
      console.log("✅ JSON parseado:", extractedData);
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      console.error("Texto que falló:", cleanedResponse);
      return res.status(500).json({
        success: false,
        message: "Error parseando respuesta de Gemini",
        error: parseError.message,
      });
    }

    // Validaciones
    const expectedCedula = "23621688";
    const expectedPhone = "04125497936";
    const expectedBanks = ["bnc", "0191", "banconacional", "nacional"];

    const cleanText = (text) =>
      String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s.\-()]/g, "")
        .toLowerCase();

    const hasCedula = extractedData.cedula
      ? cleanText(extractedData.cedula).includes(cleanText(expectedCedula))
      : false;

    const hasPhone = extractedData.telefono
      ? cleanText(extractedData.telefono).includes(
          cleanText(expectedPhone).substring(1)
        )
      : false;

    const hasBank = extractedData.banco
      ? expectedBanks.some((bank) =>
          cleanText(extractedData.banco).includes(bank)
        )
      : false;

    let hasAmount = false;
    if (extractedData.monto && expectedAmount) {
      const amountStr = String(extractedData.monto).replace(/[,\s]/g, "");
      const amount = parseFloat(amountStr);
      const expected = parseFloat(expectedAmount);

      if (!isNaN(amount) && !isNaN(expected)) {
        if (Math.abs(amount - expected) <= 1) {
          hasAmount = true;
        } else {
          const expectedDigits = expected.toFixed(2).replace(/[.,]/g, "");
          const amountDigits = amount.toFixed(2).replace(/[.,]/g, "");

          if (expectedDigits === amountDigits) {
            hasAmount = true;
          } else {
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

            if (matchCount / expectedDigits.length >= 0.8) {
              hasAmount = true;
            }
          }
        }
      }
    }

    const validCount = [hasCedula, hasPhone, hasBank, hasAmount].filter(
      Boolean
    ).length;
    const isValid = validCount >= 2;

    console.log("--- VALIDACIONES ---");
    console.log(`🆔 Cédula: ${hasCedula ? "✅" : "❌"}`);
    console.log(`📱 Teléfono: ${hasPhone ? "✅" : "❌"}`);
    console.log(`🏦 Banco: ${hasBank ? "✅" : "❌"}`);
    console.log(`💰 Monto: ${hasAmount ? "✅" : "❌"}`);
    console.log(`✅ Total: ${validCount}/4`);
    console.log(`${isValid ? "✅ APROBADO" : "❌ RECHAZADO"}`);

    return res.status(200).json({
      success: isValid,
      extractedData,
      reference: extractedData.referencia || "N/A",
      details: {
        hasCedula,
        hasPhone,
        hasBank,
        hasAmount,
        validCount,
      },
    });
  } catch (error) {
    console.error("❌ ERROR CRÍTICO en API:", error);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
