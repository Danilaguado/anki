// api/exercises/add.js
// Endpoint para añadir un nuevo ejercicio a la hoja "Exercises".

import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡IMPORTANTE! Reemplaza con el ID de tu Google Sheet
const EXERCISES_SHEET_NAME = "Exercises"; // El nombre exacto de tu hoja para ejercicios

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Only POST is accepted.",
    });
  }

  // Desestructurar los datos esperados del cuerpo de la solicitud
  let {
    lessonId,
    type,
    questionEN,
    questionES,
    answerEN,
    answerES,
    optionsEN,
    orderInLesson,
    notes,
    image,
  } = req.body;

  // Validar que los campos esenciales no estén vacíos.
  if (!lessonId || !type || !questionEN || orderInLesson === undefined) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required fields: lessonId, type, questionEN, and orderInLesson are required.",
    });
  }
  // Validación adicional para asegurar que al menos una de las respuestas esté presente
  if (!answerEN && !answerES) {
    return res.status(400).json({
      success: false,
      error: "At least one answer field (answerEN or answerES) is required.",
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

    const exerciseId = uuidv4();

    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXERCISES_SHEET_NAME}!1:1`,
    });
    const headers = headersResponse.data.values
      ? headersResponse.data.values[0]
      : [];

    if (headers.length === 0) {
      throw new Error(`No headers found in "${EXERCISES_SHEET_NAME}" sheet.`);
    }

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
        case "QuestionES":
          newRow[index] = questionES || "";
          break;
        case "AnswerEN":
          newRow[index] = answerEN || "";
          break;
        case "AnswerES":
          newRow[index] = answerES || "";
          break;
        case "OptionsEN":
          newRow[index] = optionsEN ? JSON.stringify(optionsEN) : "";
          break;
        case "OrderInLesson":
          newRow[index] = orderInLesson;
          break;
        case "Notes":
          newRow[index] = notes || "";
          break;
        case "Image":
          newRow[index] = image || "";
          break; // Mapear Image
        default:
          break;
      }
    });

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXERCISES_SHEET_NAME}!A:Z`,
      valueInputOption: "RAW",
      resource: {
        values: [newRow],
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
          questionES,
          answerEN,
          answerES,
          optionsEN,
          orderInLesson,
          notes,
          image,
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
