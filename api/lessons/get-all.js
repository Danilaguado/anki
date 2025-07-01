// api/lessons/get-all.js
// Endpoint para obtener todas las lecciones (módulos) y sus ejercicios asociados de Google Sheets.

import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡IMPORTANTE! Reemplaza con el ID de tu Google Sheet
const MODULES_SHEET_NAME = "Modules";
const EXERCISES_SHEET_NAME = "Exercises";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Only GET is accepted.",
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

    // 1. Obtener todas las lecciones (módulos)
    const modulesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MODULES_SHEET_NAME}!A:Z`, // Ajusta el rango si tienes más columnas
    });
    const modulesData = modulesResponse.data.values || [];

    if (modulesData.length < 1) {
      return res.status(200).json({ success: true, lessons: [] }); // No hay lecciones, devuelve array vacío
    }

    const modulesHeaders = modulesData[0];
    const rawLessons = modulesData.slice(1); // Excluir encabezados

    let lessons = rawLessons.map((row) => {
      const lesson = {};
      modulesHeaders.forEach((header, index) => {
        lesson[header] = row[index];
      });
      return lesson;
    });

    // NUEVO: Ordenar las lecciones por OrderInPage
    lessons.sort((a, b) => {
      // Intenta parsear OrderInPage como número. Si es nulo o no es un número, lo trata como un valor muy alto para que vaya al final.
      const orderA = parseInt(a.OrderInPage, 10);
      const orderB = parseInt(b.OrderInPage, 10);

      // Manejar casos donde OrderInPage no es un número o está vacío
      if (isNaN(orderA) && isNaN(orderB)) return 0; // Ambos no son números, mantener orden original
      if (isNaN(orderA)) return 1; // A no es número, B es número, B va primero
      if (isNaN(orderB)) return -1; // B no es número, A es número, A va primero

      return orderA - orderB;
    });

    // 2. Obtener todos los ejercicios
    const exercisesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXERCISES_SHEET_NAME}!A:Z`, // Ajusta el rango si tienes más columnas
    });
    const exercisesData = exercisesResponse.data.values || [];

    let exercises = [];
    if (exercisesData.length > 1) {
      // Asegúrate de que haya datos además de los encabezados
      const exercisesHeaders = exercisesData[0];
      const rawExercises = exercisesData.slice(1);

      exercises = rawExercises.map((row) => {
        const exercise = {};
        exercisesHeaders.forEach((header, index) => {
          // Intentar parsear OptionsEN si es un string JSON
          if (header === "OptionsEN" && row[index]) {
            try {
              exercise[header] = JSON.parse(row[index]);
            } catch (e) {
              console.warn(
                `Could not parse OptionsEN for exercise. Value: ${row[index]}`,
                e
              );
              exercise[header] = row[index]; // Mantener como string si falla el parseo
            }
          } else {
            exercise[header] = row[index];
          }
        });
        return exercise;
      });
    }

    // 3. Unir lecciones con sus ejercicios
    const lessonsWithExercises = lessons.map((lesson) => {
      // Filtrar ejercicios que pertenecen a esta lección
      const lessonExercises = exercises
        .filter((exercise) => exercise.LessonID === lesson.LessonID)
        .sort((a, b) => (a.OrderInLesson || 0) - (b.OrderInLesson || 0)); // Ordenar por OrderInLesson

      return {
        ...lesson,
        exercises: lessonExercises,
      };
    });

    return res
      .status(200)
      .json({ success: true, lessons: lessonsWithExercises });
  } catch (error) {
    console.error(
      "Error in /api/lessons/get-all.js:",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error: "Internal Server Error: " + error.message,
    });
  }
}
