// api/lessons/add.js
// Endpoint para añadir una nueva lección (módulo) a la hoja "Modules" en Google Sheets.

import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid"; // Para generar IDs únicos

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡IMPORTANTE! Reemplaza con el ID de tu Google Sheet
const MODULES_SHEET_NAME = "Modules"; // El nombre exacto de tu hoja para módulos/lecciones

export default async function handler(req, res) {
  // Asegúrate de que la solicitud sea POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Only POST is accepted.",
    });
  }

  // Desestructurar los datos esperados del cuerpo de la solicitud
  // Los campos deberían coincidir con las columnas de tu hoja "Modules"
  let { title, description, difficulty, topic, promptUsed } = req.body;

  // Validar que los campos esenciales no estén vacíos
  if (!title || !description || !difficulty || !topic) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required fields: title, description, difficulty, and topic are required.",
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

    // Generar un ID único para la nueva lección
    const lessonId = uuidv4();
    const generatedDate = new Date().toISOString(); // Fecha y hora de generación
    const generatedBy = "Gemini"; // Or any other identifier

    // Obtener los encabezados de la hoja 'Modules' para asegurar el orden correcto
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MODULES_SHEET_NAME}!1:1`, // Obtener solo la primera fila (encabezados)
    });
    const headers = headersResponse.data.values
      ? headersResponse.data.values[0]
      : [];

    if (headers.length === 0) {
      throw new Error(`No headers found in "${MODULES_SHEET_NAME}" sheet.`);
    }

    // Crear un array de valores en el orden de los encabezados de la hoja
    const newRow = new Array(headers.length).fill("");

    headers.forEach((header, index) => {
      switch (header) {
        case "LessonID":
          newRow[index] = lessonId;
          break;
        case "Title":
          newRow[index] = title;
          break;
        case "Description":
          newRow[index] = description;
          break;
        case "Difficulty":
          newRow[index] = difficulty;
          break;
        case "Topic":
          newRow[index] = topic;
          break;
        case "GeneratedDate":
          newRow[index] = generatedDate;
          break;
        case "GeneratedBy":
          newRow[index] = generatedBy;
          break;
        case "PromptUsed":
          newRow[index] = promptUsed || ""; // Si no se proporciona, dejar vacío
          break;
        default:
          // Para cualquier otra columna no manejada, dejar el valor vacío o el valor predeterminado si es necesario
          break;
      }
    });

    // Añadir la nueva fila a la hoja de Google Sheets
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MODULES_SHEET_NAME}!A:Z`, // Asegúrate de que el rango cubra todas tus columnas
      valueInputOption: "RAW", // Los datos se escriben tal cual
      resource: {
        values: [newRow], // La nueva fila de datos
      },
    });

    if (appendResponse.status === 200) {
      return res.status(200).json({
        success: true,
        message: "Lesson added successfully.",
        data: {
          lessonId,
          title,
          description,
          difficulty,
          topic,
          generatedDate,
          generatedBy,
          promptUsed,
        },
      });
    } else {
      throw new Error("Failed to append lesson to Google Sheets.");
    }
  } catch (error) {
    console.error("Error in /api/lessons/add.js:", error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error: " + error.message,
    });
  }
}
