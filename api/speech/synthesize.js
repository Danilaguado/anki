// api/speech/synthesize.js
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Exporta una función para manejar las solicitudes de la API
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
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

  try {
    // 1. Configura el cliente de Google Cloud Text-to-Speech
    // Las credenciales se leen de las variables de entorno de Vercel.
    const client = new TextToSpeechClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        // Asegúrate que la clave privada se maneje correctamente, reemplazando \\n por \n
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
    });

    // 2. Define la solicitud de síntesis de voz
    const request = {
      input: { text: text },
      // Selecciona la voz. Se usan voces WaveNet si están disponibles para el idioma, que son más naturales.
      // Si no, se usa una voz estándar.
      voice: {
        languageCode: lang,
        name: getVoiceName(lang), // Función auxiliar para seleccionar la voz adecuada
        ssmlGender: "NEUTRAL", // Puedes cambiar a 'FEMALE' o 'MALE'
      },
      audioConfig: {
        audioEncoding: "MP3", // Formato de audio de salida
        speakingRate: rate || 1.0, // Aplica la velocidad si se proporciona, sino 1.0 (normal)
      },
    };

    // 3. Realiza la solicitud de síntesis de voz
    const [response] = await client.synthesizeSpeech(request);

    // 4. Envía el contenido de audio base64 al cliente
    // El audioContent es un buffer de Node.js, lo convertimos a base64
    const audioContentBase64 = response.audioContent.toString("base64");

    return res
      .status(200)
      .json({ success: true, audioContent: audioContentBase64 });
  } catch (error) {
    console.error(
      "Error al sintetizar voz con Google Cloud TTS:",
      error.message,
      error.stack
    );
    // Para errores específicos de Google Cloud, podríamos intentar parsearlos.
    const errorMessage =
      error.details || error.message || "Error desconocido al sintetizar voz.";
    return res
      .status(500)
      .json({
        success: false,
        error: "Error en el servidor al sintetizar voz: " + errorMessage,
      });
  }
}

/**
 * Función auxiliar para seleccionar el nombre de la voz más adecuada.
 * Puedes expandir esto para permitir al usuario elegir voces específicas si lo deseas.
 * @param {string} lang - Código de idioma (ej. 'en-US', 'es-ES').
 * @returns {string} El nombre de la voz.
 */
function getVoiceName(lang) {
  // Ejemplos de voces de WaveNet (las más naturales) y Standard.
  // Revisa la documentación de Google Cloud TTS para una lista completa:
  // https://cloud.google.com/text-to-speech/docs/voices
  switch (lang) {
    case "en-US":
      return "en-US-Wavenet-D"; // Una voz WaveNet masculina común en inglés
    case "es-ES":
      return "es-ES-Wavenet-B"; // Una voz WaveNet masculina común en español
    case "es-LA": // Español de América Latina
      return "es-US-Wavenet-A"; // Una voz WaveNet femenina en español de EE. UU.
    case "fr-FR":
      return "fr-FR-Wavenet-B";
    // Añade más casos si necesitas otros idiomas o voces específicas
    default:
      // Si no se encuentra una voz WaveNet específica, intenta con una Standard
      if (lang.startsWith("en")) return "en-US-Standard-A";
      if (lang.startsWith("es")) return "es-ES-Standard-A";
      return "en-US-Standard-A"; // Voz por defecto si el idioma no es reconocido
  }
}
