// api/process-payment-image.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Método no permitido" });
  }

  const { imageBase64, expectedAmount, fileName } = req.body;

  if (!imageBase64 || !expectedAmount) {
    return res.status(400).json({
      success: false,
      message: "Falta imageBase64 o expectedAmount",
    });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY no configurada en Vercel");
    return res.status(500).json({
      success: false,
      message: "API key no configurada",
    });
  }

  try {
    console.log("🤖 Procesando imagen con Gemini Vision...");
    console.log(`📄 Archivo: ${fileName}`);
    console.log(`💰 Monto esperado: ${expectedAmount}`);

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

    const response = await fetch(
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
                  inline_data: {
                    mime_type: "image/jpeg",
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error de Gemini:", errorData);
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;

    console.log("📝 Respuesta de Gemini:", textResponse);

    let cleanedResponse = textResponse.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    }

    const extractedData = JSON.parse(cleanedResponse);

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
        // Match exacto (± 1)
        if (Math.abs(amount - expected) <= 1) {
          hasAmount = true;
        } else {
          // Match de dígitos
          const expectedDigits = expected.toFixed(2).replace(/[.,]/g, "");
          const amountDigits = amount.toFixed(2).replace(/[.,]/g, "");

          if (expectedDigits === amountDigits) {
            hasAmount = true;
          } else {
            // Match parcial (80%)
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
    console.error("❌ Error procesando imagen:", error);
    return res.status(500).json({
      success: false,
      message: "Error procesando imagen",
      error: error.message,
    });
  }
}
