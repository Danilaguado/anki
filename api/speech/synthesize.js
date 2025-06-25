// pages/api/speech/synthesize.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Método no permitido. Solo POST." });
  }

  const { text, lang } = req.body;
  if (!text || !lang) {
    return res
      .status(400)
      .json({ success: false, error: "Texto y idioma son requeridos." });
  }

  // Obtiene la clave de ElevenLabs desde variables de entorno
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY no configurada en variables de entorno.");
    return res.status(500).json({
      success: false,
      error: "Key de ElevenLabs faltante en configuración.",
    });
  }

  try {
    // Mapea idioma a Voice ID de ElevenLabs
    const voiceId = getElevenLabsVoiceId(lang);
    if (!voiceId) {
      return res
        .status(400)
        .json({ success: false, error: `Idioma '${lang}' no soportado.` });
    }

    // Llama a la API de ElevenLabs
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            // Puedes añadir speaking_rate si tu plan lo permite
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      // Parseo mejorado del error para detalle legible
      const errText = await elevenLabsResponse.text();
      let detail;
      try {
        detail = JSON.parse(errText).detail || errText;
      } catch {
        detail = errText;
      }
      console.error("ElevenLabs API error detail:", detail);
      throw new Error(
        `ElevenLabs API Error: ${elevenLabsResponse.status} - ${elevenLabsResponse.statusText}. Details: ${detail}`
      );
    }

    // Convierte el arrayBuffer a Base64 para enviar al cliente
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const audioContent = Buffer.from(audioBuffer).toString("base64");

    return res.status(200).json({ success: true, audioContent });
  } catch (err) {
    console.error("Error en TTS ElevenLabs:", err);
    return res
      .status(500)
      .json({ success: false, error: `Error ElevenLabs: ${err.message}` });
  }
}

/**
 * Devuelve el Voice ID de ElevenLabs según el código de idioma.
 * Personaliza estos IDs con tus voces favoritas.
 */
function getElevenLabsVoiceId(lang) {
  switch (lang) {
    case "en-US":
      return "21m00Tcm4TlvDq8ikWAM"; // Rachel
    case "es-ES":
      return "pNnIDT4R8wUaP8B3BvDq"; // Antonio
    case "es-LA":
      return "EXAVITQu4vr4xnSDxMaL"; // Bella (soporta español)
    case "fr-FR":
      return "TxGEqnHWrfWFTCxWZLAD"; // Antoni (soporta francés)
    default:
      return null;
  }
}
