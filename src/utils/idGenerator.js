// /utils/idGenerator.js - Utilidades para generar IDs más cortos y únicos

/**
 * Genera un ID corto único basado en timestamp y caracteres aleatorios
 * Formato: [timestamp_base36][random_chars]
 * Ejemplo: "lx8kj9f3" (8 caracteres aproximadamente)
 */
export function generateShortId() {
  // Usar solo los últimos dígitos del timestamp para hacerlo más corto
  const timestamp = (Date.now() % 1000000).toString(36); // Base 36 para más caracteres
  const random = Math.random().toString(36).substr(2, 4); // 4 caracteres aleatorios
  return `${timestamp}${random}`;
}

/**
 * Genera un ID específico para usuarios
 * Formato: u_[short_id]
 * Ejemplo: "u_lx8kj9f3"
 */
export function generateUserId() {
  return `u_${generateShortId()}`;
}

/**
 * Genera un ID específico para sesiones
 * Formato: s_[short_id]
 * Ejemplo: "s_lx8kj9f3"
 */
export function generateSessionId() {
  return `s_${generateShortId()}`;
}

/**
 * Genera un ID específico para mazos
 * Formato: d_[short_id]
 * Ejemplo: "d_lx8kj9f3"
 */
export function generateDeckId() {
  return `d_${generateShortId()}`;
}

/**
 * Genera un ID específico para interacciones
 * Formato: i_[short_id]
 * Ejemplo: "i_lx8kj9f3"
 */
export function generateInteractionId() {
  return `i_${generateShortId()}`;
}

/**
 * Convierte un timestamp a un formato más legible para IDs
 * Útil para crear IDs que mantengan algo de orden cronológico
 */
export function timestampToShortId(timestamp = Date.now()) {
  // Crear un ID que sea sorteable cronológicamente pero corto
  const base36Time = timestamp.toString(36);
  // Tomar solo los últimos caracteres para mantenerlo corto
  return base36Time.slice(-6);
}

/**
 * Genera un ID de palabra más amigable
 * Formato: w_[número]
 * Ejemplo: "w_1", "w_2", "w_150"
 */
export function generateWordId(index) {
  return `w_${index}`;
}

/**
 * Valida si un ID tiene el formato esperado
 */
export function validateIdFormat(id, expectedPrefix = null) {
  if (!id || typeof id !== "string") return false;

  if (expectedPrefix) {
    return (
      id.startsWith(expectedPrefix + "_") &&
      id.length > expectedPrefix.length + 1
    );
  }

  // Validación general: debe tener al menos 3 caracteres
  return id.length >= 3;
}

/**
 * Extrae información de un ID (tipo y timestamp aproximado si es posible)
 */
export function parseId(id) {
  if (!validateIdFormat(id)) {
    return { valid: false };
  }

  const parts = id.split("_");
  if (parts.length >= 2) {
    const prefix = parts[0];
    const identifier = parts.slice(1).join("_");

    const typeMap = {
      u: "user",
      s: "session",
      d: "deck",
      i: "interaction",
      w: "word",
    };

    return {
      valid: true,
      type: typeMap[prefix] || "unknown",
      prefix,
      identifier,
      originalId: id,
    };
  }

  return {
    valid: true,
    type: "unknown",
    prefix: null,
    identifier: id,
    originalId: id,
  };
}

/**
 * Genera un batch de IDs únicos
 * Útil cuando necesitas crear múltiples IDs a la vez
 */
export function generateIdBatch(count, type = "general") {
  const ids = new Set();
  const generators = {
    user: generateUserId,
    session: generateSessionId,
    deck: generateDeckId,
    interaction: generateInteractionId,
    general: generateShortId,
  };

  const generator = generators[type] || generateShortId;

  while (ids.size < count) {
    ids.add(generator());
  }

  return Array.from(ids);
}

/**
 * Genera un ID basado en contenido (para evitar duplicados)
 * Útil para palabras o contenido que debe ser único
 */
export function generateContentBasedId(content, prefix = "") {
  // Crear un hash simple del contenido
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }

  // Convertir a base36 y tomar caracteres
  const hashStr = Math.abs(hash).toString(36).substr(0, 6);

  return prefix ? `${prefix}_${hashStr}` : hashStr;
}

// Funciones de utilidad para el sistema de repetición espaciada

/**
 * Genera un ID único para programar una revisión
 */
export function generateReviewId(userId, wordId) {
  const userPart = parseId(userId).identifier || userId;
  const wordPart = parseId(wordId).identifier || wordId;
  const timestamp = timestampToShortId();

  return `r_${userPart}_${wordPart}_${timestamp}`;
}

/**
 * Genera un ID para actividad diaria
 */
export function generateDailyActivityId(userId, date) {
  const userPart = parseId(userId).identifier || userId;
  const dateStr = new Date(date).toISOString().split("T")[0].replace(/-/g, "");

  return `da_${userPart}_${dateStr}`;
}

// Exportar una versión simplificada para uso directo
export const ID = {
  short: generateShortId,
  user: generateUserId,
  session: generateSessionId,
  deck: generateDeckId,
  interaction: generateInteractionId,
  word: generateWordId,
  review: generateReviewId,
  daily: generateDailyActivityId,
  validate: validateIdFormat,
  parse: parseId,
  batch: generateIdBatch,
};

export default ID;
