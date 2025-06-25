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

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY no configurada en variables de entorno.");
    return res
      .status(500)
      .json({ success: false, error: "Key de ElevenLabs faltante." });
  }

  try {
    const voiceId = getElevenLabsVoiceId(lang);
    if (!voiceId) {
      return res
        .status(400)
        .json({ success: false, error: `Idioma '${lang}' no soportado.` });
    }

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
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const textErr = await elevenLabsResponse.text();
      let detail;
      try {
        // Intentamos parsear JSON y luego stringify para verlo completo
        const obj = JSON.parse(textErr);
        detail = JSON.stringify(obj, null, 2);
      } catch {
        detail = textErr;
      }
      console.error("ElevenLabs API error detail:", detail);
      throw new Error(
        `ElevenLabs API Error: ${elevenLabsResponse.status} - ${elevenLabsResponse.statusText}. Details: ${detail}`
      );
    }

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

function getElevenLabsVoiceId(lang) {
  switch (lang) {
    case "en-US":
      return "21m00Tcm4TlvDq8ikWAM";
    case "es-ES":
      return "pNnIDT4R8wUaP8B3BvDq";
    case "es-LA":
      return "EXAVITQu4vr4xnSDxMaL";
    case "fr-FR":
      return "TxGEqnHWrfWFTCxWZLAD";
    default:
      return null;
  }
}
