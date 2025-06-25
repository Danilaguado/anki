// api/speech/synthesize.js
// No necesitamos @google-cloud/text-to-speech para ElevenLabs
// import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Exporta una función para manejar las solicitudes de la API
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido. Solo se acepta POST.",
    });
  }

  const { text, lang, rate } = req.body; // text: el texto a sintetizar, lang: el idioma, rate: velocidad (opcional)

  if (!text || !lang) {
    return res
      .status(400)
      .json({ success: false, error: "Texto y idioma son requeridos." });
  }

  // Asegúrate de que tu API Key de ElevenLabs esté configurada en Vercel como ELEVENLABS_API_KEY
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!ELEVENLABS_API_KEY) {
    console.error(
      "ELEVENLABS_API_KEY no está configurada en las variables de entorno de Vercel."
    );
    return res.status(500).json({
      success: false,
      error: "Error de configuración: ElevenLabs API Key no encontrada.",
    });
  }

  try {
    // Determina el voice_id de ElevenLabs basado en el idioma
    // Puedes personalizar esto con los Voice IDs que prefieras de ElevenLabs
    const voiceId = getElevenLabsVoiceId(lang);
    if (!voiceId) {
      return res.status(400).json({
        success: false,
        error: `Idioma '${lang}' no soportado o Voice ID no encontrado para ElevenLabs.`,
      });
    }

    // ElevenLabs usa 'stability' y 'clarity' en lugar de 'rate' directo
    // Puedes ajustar estos valores según cómo quieres que suene la voz
    const stability = 0.5; // 0.0 a 1.0, controla la variabilidad de la voz
    const similarityBoost = 0.75; // 0.0 a 1.0, controla la claridad y el énfasis

    // La API de ElevenLabs para síntesis de voz
    const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const elevenLabsResponse = await fetch(elevenLabsApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY, // Tu API Key de ElevenLabs
        Accept: "audio/mpeg", // Indica que esperamos un archivo de audio MP3
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2", // O "eleven_flash_v2_5" para baja latencia si tu plan lo permite
        voice_settings: {
          stability: stability,
          similarity_boost: similarityBoost,
          // ElevenLabs tiene otros parámetros como style, use_speaker_boost
          // Puedes añadir 'speaking_rate' si el modelo lo permite o ajustarlo en el cliente
        },
      }),
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("Error al llamar a ElevenLabs API:", errorText);
      // Intenta parsear como JSON si el error es JSON, sino usa el texto
      let parsedError = errorText;
      try {
        parsedError = JSON.parse(errorText).detail || errorText;
      } catch (e) {
        // No es JSON, usa el texto crudo
      }
      throw new Error(
        `ElevenLabs API Error: ${elevenLabsResponse.status} - ${elevenLabsResponse.statusText}. Details: ${parsedError}`
      );
    }

    // ElevenLabs devuelve el audio directamente como un Stream/Blob
    // Necesitamos convertirlo a base64 para enviarlo al cliente
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const audioContentBase64 = Buffer.from(audioBuffer).toString("base64");

    return res
      .status(200)
      .json({ success: true, audioContent: audioContentBase64 });
  } catch (error) {
    console.error(
      "Error en la función Serverless (ElevenLabs TTS):",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error:
        "Error en el servidor al sintetizar voz con ElevenLabs: " +
        error.message,
    });
  }
}

/**
 * Función auxiliar para seleccionar el Voice ID de ElevenLabs basado en el idioma.
 * ¡Debes personalizar estos IDs con tus voces favoritas de ElevenLabs!
 * Puedes encontrar los Voice IDs en tu panel de ElevenLabs o en su documentación.
 * @param {string} lang - Código de idioma (ej. 'en-US', 'es-ES').
 * @returns {string|null} El Voice ID de ElevenLabs o null si no se encuentra.
 */
function getElevenLabsVoiceId(lang) {
  // Estos son Voice IDs de ejemplo. CÁMBIALOS por los que prefieras de tu cuenta.
  // Visita https://beta.elevenlabs.io/voice-library para explorar voces.
  switch (lang) {
    case "en-US":
      // Ejemplo de voces populares en inglés
      // "Rachel" (21m00Tcm4TlvDq8ikWAM)
      // "Bella" (EXAVITQu4vr4xnSDxMaL)
      // "Antoni" (TxGEqnHWrfWFTCxWZLAD)
      return "21m00Tcm4TlvDq8ikWAM"; // Por defecto: Rachel
    case "es-ES":
      // Ejemplo de voces populares en español
      // "Antonio" (pNnIDT4R8wUaP8B3BvDq)
      // "Elara" (sOQxQ101g10P76yCqH6U)
      return "pNnIDT4R8wUaP8B3BvDq"; // Por defecto: Antonio
    case "es-LA": // Puedes usar una voz en español de EE. UU. que sirva para LA
      return "EXAVITQu4vr4xnSDxMaL"; // Usando "Bella" que también puede hablar español
    case "fr-FR":
      return "TxGEqnHWrfWFTCxWZLAD"; // Usando "Antoni" que también puede hablar francés
    default:
      // Si el idioma no coincide, puedes retornar una voz por defecto o null
      console.warn(
        `Idioma '${lang}' no mapeado para ElevenLabs. Usando voz de respaldo en inglés.`
      );
      return "21m00Tcm4TlvDq8ikWAM"; // Voz de respaldo en inglés por defecto
  }
}
