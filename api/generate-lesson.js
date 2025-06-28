// api/generate-lesson.js
// Endpoint para generar una lección usando la API de Gemini y guardarla en Google Sheets.

import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid"; // Para generar IDs únicos

// Tu ID de Google Sheet. ¡IMPORTANTE! Reemplázalo.
const SPREADSHEET_ID = "TU_ID_DE_HOJA_DE_CALCULO";
const MODULES_SHEET_NAME = "Modules";
const EXERCISES_SHEET_NAME = "Exercises";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Only POST is accepted.",
    });
  }

  // Los parámetros que el frontend enviaría a este endpoint para guiar la generación
  const { topic, difficulty, exerciseCount, exerciseTypes, customPrompt } =
    req.body;

  // Validación básica de los parámetros de entrada
  if (!topic || !difficulty || !exerciseCount) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required parameters: topic, difficulty, and exerciseCount are required.",
    });
  }

  // Construir el prompt para Gemini
  let geminiPrompt =
    customPrompt ||
    `Generate ${exerciseCount} ${difficulty} level exercises on the topic of "${topic}". `;

  if (exerciseTypes && exerciseTypes.length > 0) {
    geminiPrompt += `Include exercise types: ${exerciseTypes.join(", ")}. `;
  }

  // Instrucciones para el formato JSON de salida de Gemini
  geminiPrompt += `Provide the output as a JSON array of exercise objects. Each exercise object should have:
  - 'type' (e.g., 'translation', 'multiple_choice', 'fill_in_the_blank')
  - 'questionEN' (the English question/phrase)
  - 'answerES' (the correct Spanish answer/translation)
  - 'optionsES' (an array of incorrect Spanish options for multiple_choice, or empty for others)
  - 'orderInLesson' (a number indicating its order, starting from 1)
  - 'notes' (optional, any grammatical notes or context).
  Ensure the response is a valid, single JSON array. Do not include any text before or after the JSON.`; // Added instruction for clean JSON

  try {
    // 1. Llamar a la API de Gemini para generar la lección
    const geminiApiKey = process.env.GEMINI_API_KEY; // <--- ¡CORRECCIÓN AQUÍ!

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY environment variable is not set.");
      return res.status(500).json({
        success: false,
        error:
          "Server configuration error: GEMINI_API_KEY is not set. Please configure it in Vercel environment variables.",
      });
    }

    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    console.log("Calling Gemini API with prompt:", geminiPrompt);

    const geminiResponse = await fetch(geminiApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                type: { type: "STRING" },
                questionEN: { type: "STRING" },
                answerES: { type: "STRING" },
                optionsES: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                orderInLesson: { type: "NUMBER" },
                notes: { type: "STRING" },
              },
              required: ["type", "questionEN", "answerES", "orderInLesson"],
            },
          },
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorDetail = await geminiResponse.json().catch(() => ({}));
      console.error("Gemini API Error:", errorDetail);
      throw new Error(
        `Gemini API responded with status ${geminiResponse.status}: ${
          errorDetail.error?.message || JSON.stringify(errorDetail)
        }`
      );
    }

    const geminiResult = await geminiResponse.json();
    let generatedExercises;
    try {
      // Gemini devuelve un string JSON dentro de parts[0].text. Necesitamos parsearlo.
      // Asegurarse de que el texto no tenga caracteres extra antes o después del JSON
      const rawGeminiText = geminiResult.candidates[0].content.parts[0].text;
      generatedExercises = JSON.parse(rawGeminiText);

      if (!Array.isArray(generatedExercises)) {
        throw new Error("Gemini did not return a JSON array as expected.");
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error(
        "Raw Gemini response:",
        geminiResult.candidates[0].content.parts[0].text
      );
      throw new Error(
        "Failed to parse Gemini's response. It might not be valid JSON: " +
          parseError.message
      );
    }
    console.log("Generated exercises from Gemini:", generatedExercises);

    // 2. Guardar la nueva lección (módulo) en Google Sheets
    const lessonId = uuidv4();
    const generatedDate = new Date().toISOString();
    const lessonTitle = `${topic} - ${difficulty} Lección`; // Puedes hacer el título más dinámico
    const lessonDescription = `Lección generada sobre ${topic} (${difficulty} level) con ${exerciseCount} ejercicios.`;

    // Preparar datos para api/lessons/add.js (directamente, no como una nueva llamada fetch)
    const newLessonData = {
      title: lessonTitle,
      description: lessonDescription,
      difficulty: difficulty,
      topic: topic,
      promptUsed: geminiPrompt,
    };

    // Usar la lógica de autenticación para Sheets nuevamente
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Lógica para añadir la lección a la hoja Modules (similar a api/lessons/add.js)
    const modulesHeadersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MODULES_SHEET_NAME}!1:1`,
    });
    const modulesHeaders = modulesHeadersResponse.data.values
      ? modulesHeadersResponse.data.values[0]
      : [];
    if (modulesHeaders.length === 0) {
      throw new Error(`No headers found in "${MODULES_SHEET_NAME}" sheet.`);
    }

    const newModuleRow = new Array(modulesHeaders.length).fill("");
    modulesHeaders.forEach((header, index) => {
      switch (header) {
        case "LessonID":
          newModuleRow[index] = lessonId;
          break;
        case "Title":
          newModuleRow[index] = newLessonData.title;
          break;
        case "Description":
          newModuleRow[index] = newLessonData.description;
          break;
        case "Difficulty":
          newModuleRow[index] = newLessonData.difficulty;
          break;
        case "Topic":
          newModuleRow[index] = newLessonData.topic;
          break;
        case "GeneratedDate":
          newModuleRow[index] = generatedDate;
          break;
        case "GeneratedBy":
          newModuleRow[index] = "Gemini";
          break;
        case "PromptUsed":
          newModuleRow[index] = newLessonData.promptUsed || "";
          break;
        default:
          newModuleRow[index] = ""; // Ensure all other columns are explicitly filled, if any
      }
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MODULES_SHEET_NAME}!A:Z`,
      valueInputOption: "RAW",
      resource: { values: [newModuleRow] },
    });
    console.log(`Lesson ${lessonId} added to Modules sheet.`);

    // 3. Guardar cada ejercicio en la hoja "Exercises"
    const exercisesHeadersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXERCISES_SHEET_NAME}!1:1`,
    });
    const exercisesHeaders = exercisesHeadersResponse.data.values
      ? exercisesHeadersResponse.data.values[0]
      : [];
    if (exercisesHeaders.length === 0) {
      throw new Error(`No headers found in "${EXERCISES_SHEET_NAME}" sheet.`);
    }

    const exercisesRows = generatedExercises.map((exercise) => {
      const newExerciseRow = new Array(exercisesHeaders.length).fill("");
      exercisesHeaders.forEach((header, index) => {
        switch (header) {
          case "ExerciseID":
            newExerciseRow[index] = uuidv4();
            break; // Nuevo ID para cada ejercicio
          case "LessonID":
            newExerciseRow[index] = lessonId;
            break;
          case "Type":
            newExerciseRow[index] = exercise.type;
            break;
          case "QuestionEN":
            newExerciseRow[index] = exercise.questionEN;
            break;
          case "AnswerES":
            newExerciseRow[index] = exercise.answerES;
            break;
          case "OptionsES":
            newExerciseRow[index] = exercise.optionsES
              ? JSON.stringify(exercise.optionsES)
              : "";
            break;
          case "OrderInLesson":
            newExerciseRow[index] = exercise.orderInLesson;
            break;
          case "Notes":
            newExerciseRow[index] = exercise.notes || "";
            break;
          default:
            newExerciseRow[index] = ""; // Ensure all other columns are explicitly filled
        }
      });
      return newExerciseRow;
    });

    if (exercisesRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${EXERCISES_SHEET_NAME}!A:Z`,
        valueInputOption: "RAW",
        resource: { values: exercisesRows },
      });
      console.log(
        `${exercisesRows.length} exercises added to Exercises sheet for lesson ${lessonId}.`
      );
    }

    // 4. Devolver la lección generada y guardada al frontend
    return res.status(200).json({
      success: true,
      message: "Lesson generated and saved successfully.",
      data: {
        lesson: {
          LessonID: lessonId,
          Title: lessonTitle,
          Description: lessonDescription,
          Difficulty: difficulty,
          Topic: topic,
          GeneratedDate: generatedDate,
          GeneratedBy: "Gemini",
          PromptUsed: geminiPrompt,
        }, // Include LessonID and use correct casing for returned object
        exercises: generatedExercises,
      },
    });
  } catch (error) {
    console.error(
      "Error in /api/generate-lesson.js:",
      error.message,
      error.stack
    );
    // Send a more specific error if it's related to API Key
    if (
      error.message.includes("403") &&
      error.message.includes("unregistered callers")
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Authentication error with Gemini API. Please ensure your GEMINI_API_KEY is correct and has the necessary permissions.",
      });
    }
    return res.status(500).json({
      success: false,
      error:
        "Internal Server Error during lesson generation or saving: " +
        error.message,
    });
  }
}
