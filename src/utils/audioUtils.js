// src/utils/audioUtils.js

/**
 * Convierte un Base64 string en un Blob
 * @param {string} b64Data - El string Base64.
 * @param {string} contentType - El tipo de contenido del Blob (ej. 'audio/mpeg').
 * @param {number} sliceSize - Tamaño de los fragmentos para procesar.
 * @returns {Blob} El objeto Blob.
 */
export function b64toBlob(b64Data, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
}

/**
 * Reproduce audio para un texto dado en un idioma específico usando ElevenLabs.
 * También gestiona un caché de audio.
 * @param {string} text - El texto a reproducir.
 * @param {string} lang - El código de idioma (ej. 'en-US' para inglés, 'es-ES' para español).
 * @param {Map} audioCache - Referencia al Map de caché de audio.
 * @param {function} b64toBlobFunction - La función b64toBlob.
 * @param {function} setMessageFunction - Función para establecer mensajes.
 * @param {function} setIsLoadingFunction - Función para establecer el estado de carga.
 */
export const playAudio = async (
  text,
  lang,
  audioCache,
  b64toBlobFunction,
  setMessageFunction,
  setIsLoadingFunction
) => {
  if (!text) {
    setMessageFunction("No hay texto para reproducir audio.");
    return;
  }

  const cacheKey = `${text}-${lang}`; // Clave única para el caché

  // 1. Intentar obtener el audio del caché
  if (audioCache.has(cacheKey)) {
    const cachedAudioUrl = audioCache.get(cacheKey);
    console.log("PlayAudio: Reproduciendo desde caché:", text);
    setMessageFunction("Reproduciendo (desde caché)...");
    setIsLoadingFunction(true); // Activa la carga
    const audio = new Audio(cachedAudioUrl);
    audio.play();

    audio.onended = () => {
      console.log("PlayAudio: Reproducción desde caché finalizada.");
      setMessageFunction("");
      setIsLoadingFunction(false); // Desactiva la carga
    };
    audio.onerror = (e) => {
      console.error("PlayAudio: Error al reproducir desde caché:", e);
      setMessageFunction("Error al reproducir audio desde caché.");
      setIsLoadingFunction(false); // Desactiva la carga
    };
    return; // Salir, ya hemos manejado la reproducción
  }

  // 2. Si no está en caché, hacer la petición a ElevenLabs
  setIsLoadingFunction(true); // Activa la carga
  setMessageFunction("Generando audio con ElevenLabs...");
  console.log("PlayAudio: Llamando a ElevenLabs para:", text);

  try {
    const response = await fetch("/api/speech/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        lang: lang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "PlayAudio: Error en la respuesta de ElevenLabs API:",
        response.status,
        errorData
      );
      throw new Error(
        errorData.error ||
          `Error HTTP: ${response.status} - ${response.statusText}`
      );
    }

    const { audioContent } = await response.json();
    if (audioContent) {
      const audioBlob = b64toBlobFunction(audioContent, "audio/mpeg");
      const audioUrl = URL.createObjectURL(audioBlob);

      // Guardar en caché antes de reproducir
      audioCache.set(cacheKey, audioUrl);
      console.log("PlayAudio: Audio cacheado y listo para reproducir.");

      const audio = new Audio(audioUrl);
      audio.play();

      audio.onended = () => {
        console.log("PlayAudio: Reproducción desde ElevenLabs finalizada.");
        setMessageFunction("");
        setIsLoadingFunction(false); // Desactiva la carga
      };
      audio.onerror = (e) => {
        console.error("PlayAudio: Error al reproducir audio de ElevenLabs:", e);
        setMessageFunction("Error al reproducir el audio.");
        setIsLoadingFunction(false); // Desactiva la carga
      };
      setMessageFunction("Reproduciendo...");
    } else {
      throw new Error("No se recibió contenido de audio de ElevenLabs.");
    }
  } catch (error) {
    console.error(
      "PlayAudio: Error al generar o reproducir audio con ElevenLabs TTS:",
      error
    );
    setMessageFunction(`No se pudo generar voz: ${error.message}.`);
    setIsLoadingFunction(false); // Desactiva la carga en caso de error
  }
};
