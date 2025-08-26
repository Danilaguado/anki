// /api/setup.js - Actualizado con todas las tablas de registro
import { google } from "googleapis";

// Función para generar IDs más cortos
function generateShortId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `${timestamp}${random}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }
  const { email, masterWords, userId } = req.body;
  if (!email || !masterWords || !userId) {
    return res.status(400).json({
      success: false,
      message: "Email, words, and userId are required.",
    });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheetInfo.data.sheets.map(
      (s) => s.properties.title
    );

    // Definir todas las hojas necesarias
    const sheetsToEnsure = [
      {
        title: "Master_Palabras",
        headers: ["ID_Palabra", "Inglés", "Español"],
      },
      {
        title: "Decks",
        headers: [
          "ID_Mazo",
          "UserID",
          "Fecha_Creacion",
          "Cantidad_Palabras",
          "Estado",
        ],
      },
      {
        title: "Study_Sessions",
        headers: [
          "ID_Sesion",
          "ID_Mazo",
          "UserID",
          "Timestamp_Inicio",
          "Timestamp_Fin",
          "Duracion_Total_ms",
          "Estado_Final", // Completada, Abandonada
          "Sentimiento_Reportado",
          "Palabras_Correctas",
          "Palabras_Totales",
          "Porcentaje_Acierto",
        ],
      },
      {
        title: "Card_Interactions", // NUEVA: Registro detallado por carta
        headers: [
          "ID_Interaccion",
          "ID_Sesion",
          "ID_Palabra",
          "UserID",
          "Timestamp",
          "Tipo_Interaccion", // Text, Voice
          "Respuesta_Usuario",
          "Es_Correcto",
          "Tiempo_Respuesta_ms",
          "SRS_Difficulty", // easy, good, hard, again
          "Proximo_Repaso", // Fecha calculada del próximo repaso
        ],
      },
      {
        title: "Voice_Interactions", // NUEVA: Específica para interacciones de voz
        headers: [
          "ID_Voz",
          "ID_Sesion",
          "ID_Palabra",
          "UserID",
          "Timestamp",
          "Texto_Detectado",
          "Texto_Esperado",
          "Es_Correcto",
          "Precision_Porcentaje", // Para futuras mejoras
        ],
      },
      {
        title: "Word_Statistics", // NUEVA: Estadísticas acumuladas por palabra
        headers: [
          "UserID",
          "ID_Palabra",
          "Total_Veces_Practicada",
          "Total_Aciertos_Texto",
          "Total_Errores_Texto",
          "Total_Aciertos_Voz",
          "Total_Errores_Voz",
          "Mejor_Tiempo_Respuesta",
          "Peor_Tiempo_Respuesta",
          "Promedio_Tiempo_Respuesta",
          "Dificultad_Promedio", // 1=easy, 2=good, 3=hard, 4=again
          "Ultima_Practica",
          "Proxima_Revision",
        ],
      },
      {
        title: "Daily_Activity", // NUEVA: Actividad diaria del usuario
        headers: [
          "UserID",
          "Fecha",
          "Primera_Sesion", // Hora de primera entrada
          "Ultima_Sesion", // Hora de última actividad
          "Total_Sesiones_Dia",
          "Total_Tiempo_Estudio_ms",
          "Sesiones_Completadas",
          "Sesiones_Abandonadas",
          "Palabras_Practicadas",
          "Porcentaje_Acierto_Dia",
        ],
      },
      {
        title: "Practice_Schedule", // NUEVA: Programación de prácticas
        headers: [
          "UserID",
          "ID_Palabra",
          "Fecha_Programada",
          "Hora_Programada", // opcional para horarios específicos
          "Estado", // Pendiente, Completada, Omitida
          "Timestamp_Completada",
          "Dificultad_Reportada", // cuando se completa
        ],
      },
      {
        title: "User_Settings", // NUEVA: Configuraciones del usuario
        headers: [
          "UserID",
          "Horarios_Practica", // JSON con horarios preferidos
          "Notificaciones_Activas",
          "Idioma_Interface",
          "Timezone",
          "Fecha_Creacion",
          "Ultima_Modificacion",
        ],
      },
      { title: "Users", headers: ["UserID", "Email", "Fecha_Creacion"] },
      {
        title: userId,
        headers: [
          "ID_Palabra",
          "Estado",
          "Intervalo_SRS",
          "Fecha_Proximo_Repaso",
          "Factor_Facilidad",
          "Total_Aciertos",
          "Total_Errores",
          "Total_Voz_Aciertos",
          "Total_Voz_Errores",
        ],
      },
    ];

    // Crear hojas que no existen
    const newSheetsToCreate = sheetsToEnsure.filter(
      (s) => !existingSheets.includes(s.title)
    );

    if (newSheetsToCreate.length > 0) {
      const requests = newSheetsToCreate.map((sheet) => ({
        addSheet: { properties: { title: sheet.title } },
      }));
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests },
      });

      const dataToWrite = newSheetsToCreate.map((sheet) => ({
        range: `${sheet.title}!A1`,
        values: [sheet.headers],
      }));
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: { valueInputOption: "USER_ENTERED", data: dataToWrite },
      });
    }

    // Poblar Master_Palabras si es nueva
    if (!existingSheets.includes("Master_Palabras")) {
      const masterWordsRows = masterWords.map((word) => [
        word.id,
        word.english,
        word.spanish,
      ]);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Master_Palabras!A:C",
        valueInputOption: "USER_ENTERED",
        resource: { values: masterWordsRows },
      });
    }

    // Registrar usuario
    const userRow = [userId, email, new Date().toISOString()];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Users!A:C",
      valueInputOption: "USER_ENTERED",
      resource: { values: [userRow] },
    });

    // Inicializar hoja del usuario
    const userSheetRows = masterWords.map((word) => [
      word.id,
      word.status,
      1,
      null,
      2.5,
      0,
      0,
      0,
      0,
    ]);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${userId}!A:I`,
      valueInputOption: "USER_ENTERED",
      resource: { values: userSheetRows },
    });

    // Inicializar estadísticas por palabra
    const wordStatsRows = masterWords.map((word) => [
      userId,
      word.id,
      0, // Total_Veces_Practicada
      0, // Total_Aciertos_Texto
      0, // Total_Errores_Texto
      0, // Total_Aciertos_Voz
      0, // Total_Errores_Voz
      0, // Mejor_Tiempo_Respuesta
      0, // Peor_Tiempo_Respuesta
      0, // Promedio_Tiempo_Respuesta
      2, // Dificultad_Promedio (good por defecto)
      null, // Ultima_Practica
      null, // Proxima_Revision
    ]);

    if (!existingSheets.includes("Word_Statistics")) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Word_Statistics!A:M",
        valueInputOption: "USER_ENTERED",
        resource: { values: wordStatsRows },
      });
    }

    // Inicializar configuración del usuario
    const userSettingsRow = [
      userId,
      JSON.stringify(["09:00", "13:00", "18:00"]), // Horarios por defecto
      true, // Notificaciones activas
      "es", // Idioma
      "America/Mexico_City", // Timezone por defecto
      new Date().toISOString(),
      new Date().toISOString(),
    ];

    if (!existingSheets.includes("User_Settings")) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "User_Settings!A:G",
        valueInputOption: "USER_ENTERED",
        resource: { values: [userSettingsRow] },
      });
    }

    res.status(200).json({
      success: true,
      message: "Sistema de registro exhaustivo configurado exitosamente.",
    });
  } catch (error) {
    console.error("Error al configurar Google Sheet:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor al configurar la hoja de cálculo.",
      error: error.message,
    });
  }
}
