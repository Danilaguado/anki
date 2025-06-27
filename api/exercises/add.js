// api/exercises/add.js
// Endpoint para añadir un nuevo ejercicio a la hoja "Exercises" en Google Sheets.

import { google } from "googleapis";
import { v4 as uuidv4 } from ("uuid"); // Para generar IDs únicos (CORREGIDO: usa = require para Node.js común en Vercel)

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡IMPORTANTE! Reemplaza con el ID de tu Google Sheet
const EXERCISES_SHEET_NAME = "Exercises"; // El nombre exacto de tu hoja para ejercicios

export default async function handler(req, res) {
  // Asegúrate de que la solicitud sea POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Only POST is accepted.",
    });
  }

  // Desestructurar los datos esperados del cuerpo de la solicitud
  // Los campos deberían coincidir con las columnas de tu hoja "Exercises"
  let { lessonId, type, questionEN, answerES, optionsES, orderInLesson, notes } = req.body;

  // Validar que los campos esenciales no estén vacíos
  if (!lessonId || !type || !questionEN || !answerES || orderInLesson === undefined) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required fields: lessonId, type, questionEN, answerES, and orderInLesson are required.",
    });
  }

  try {
    // Configurar la autenticación con Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Generar un ID único para el nuevo ejercicio
    const exerciseId = uuidv4();

    // Obtener los encabezados de la hoja 'Exercises' para asegurar el orden correcto
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXERCISES_SHEET_NAME}!1:1`, // Obtener solo la primera fila (encabezados)
    });
    const headers = headersResponse.data.values
      ? headersResponse.data.values[0]
      : [];

    if (headers.length === 0) {
      throw new Error(`No headers found in "${EXERCISES_SHEET_NAME}" sheet.`);
    }

    // Crear un array de valores en el orden de los encabezados de la hoja
    const newRow = new Array(headers.length).fill("");

    headers.forEach((header, index) => {
      switch (header) {
        case "ExerciseID":
          newRow[index] = exerciseId;
          break;
        case "LessonID":
          newRow[index] = lessonId;
          break;
        case "Type":
          newRow[index] = type;
          break;
        case "QuestionEN":
          newRow[index] = questionEN;
          break;
        case "AnswerES":
          newRow[index] = answerES;
          break;
        case "OptionsES":
          // Si optionsES es un array, conviértelo a JSON string para guardarlo
          newRow[index] = optionsES ? JSON.stringify(optionsES) : "";
          break;
        case "OrderInLesson":
          newRow[index] = orderInLesson;
          break;
        case "Notes":
          newRow[index] = notes || ""; // Si no se proporciona, dejar vacío
          break;
        default:
          // Para cualquier otra columna no manejada
          break;
      }
    });

    // Añadir la nueva fila a la hoja de Google Sheets
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXERCISES_SHEET_NAME}!A:Z`, // Asegúrate de que el rango cubra todas tus columnas
      valueInputOption: "RAW", // Los datos se escriben tal cual
      resource: {
        values: [newRow], // La nueva fila de datos
      },
    });

    if (appendResponse.status === 200) {
      return res.status(200).json({
        success: true,
        message: "Exercise added successfully.",
        data: {
          exerciseId,
          lessonId,
          type,
          questionEN,
          answerES,
          optionsES,
          orderInLesson,
          notes,
        },
      });
    } else {
      throw new Error("Failed to append exercise to Google Sheets.");
    }
  } catch (error) {
    console.error(
      "Error in /api/exercises/add.js:",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error: "Internal Server Error: " + error.message,
    });
  }
}
