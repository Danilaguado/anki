// api/generate-lesson.js
// Endpoint para generar una lección usando la API de Gemini y guardarla en Google Sheets.

import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid"; // Para generar IDs únicos

// Tu ID de Google Sheet. ¡IMPORTANTE! Reemplázalo.
const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M";
const MODULES_SHEET_NAME = "Modules";
const EXERCISES_SHEET_NAME = "Exercises";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Only POST is accepted.",
    });
  }

  const { topic, difficulty, exerciseCount, exerciseTypes, customPrompt } =
    req.body;

  if (!topic || !difficulty || !exerciseCount) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required parameters: topic, difficulty, and exerciseCount are required.",
    });
  }

  let geminiPrompt =
    customPrompt ||
    `Generate ${exerciseCount} ${difficulty} level exercises on the topic of "${topic}". `;

  if (exerciseTypes && exerciseTypes.length > 0) {
    geminiPrompt += `Include exercise types: ${exerciseTypes.join(", ")}. `;
  }

  // INSTRUCCIONES ACTUALIZADAS para Gemini sobre el formato y contenido de los campos
  geminiPrompt += `Provide the output as a JSON array of exercise objects. Each exercise object should have:
  - 'type' (e.g., 'translation', 'multiple_choice', 'fill_in_the_blank', 'listening')
  - 'questionEN' (the English question/phrase)
  - 'questionES' (the Spanish translation of questionEN)
  - 'answerEN' (the correct English word/phrase for 'fill_in_the_blank', 'multiple_choice' types, or for listening transcription. Can be empty for 'translation' type if not applicable for direct English answer.)
  - 'answerES' (the correct Spanish translation for 'translation', 'listening' types. Can be empty for 'fill_in_the_blank'/'multiple_choice' if not applicable for Spanish answer.)
  - 'optionsEN' (an array of incorrect ENGLISH options for 'multiple_choice' type, or empty for others)
  - 'orderInLesson' (a number indicating its order, starting from 1)
  - 'notes' (optional, any grammatical notes or context).
  Ensure the response is a valid, single JSON array. Do not include any text before or after the JSON.
  For 'fill_in_the_blank', questionEN should have '_______' placeholder and answerEN should be the word for the blank.
  For 'listening', questionEN is the phrase to listen to, and answerES is its Spanish translation.`;

  try {
    if (SPREADSHEET_ID === "TU_ID_DE_HOJA_DE_CALCULO") {
      console.error(
        "SPREADSHEET_ID is not configured in api/generate-lesson.js"
      );
      return res.status(500).json({
        success: false,
        error:
          "Server configuration error: SPREADSHEET_ID is not set in the backend API. Please update it.",
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

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
            // ACTUALIZADO el esquema para incluir QuestionES y AnswerEN
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                type: { type: "STRING" },
                questionEN: { type: "STRING" },
                questionES: { type: "STRING" }, // NUEVO
                answerEN: { type: "STRING" }, // NUEVO
                answerES: { type: "STRING" },
                optionsEN: {
                  // Cambiado a optionsEN
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                orderInLesson: { type: "NUMBER" },
                notes: { type: "STRING" },
              },
              required: ["type", "questionEN", "answerES", "orderInLesson"], // Mantener AnswerES como requerido para traducción/listening
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

    const lessonId = uuidv4();
    const generatedDate = new Date().toISOString();
    const lessonTitle = `${topic} - ${difficulty} Lección`;
    const lessonDescription = `Lección generada sobre ${topic} (${difficulty} level) con ${exerciseCount} ejercicios.`;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const modulesHeadersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MODULES_SHEET_NAME}!1:1`,
    });
    const modulesHeaders = modulesHeadersResponse.data.values
      ? modulesHeadersResponse.data.values[0]
      : [];
    console.log("Modules sheet headers obtained:", modulesHeaders);

    if (modulesHeaders.length === 0) {
      throw new Error(
        `No headers found in "${MODULES_SHEET_NAME}" sheet. Please ensure the first row has headers.`
      );
    }

    const newModuleRow = new Array(modulesHeaders.length).fill("");
    modulesHeaders.forEach((header, index) => {
      switch (header) {
        case "LessonID":
          newModuleRow[index] = lessonId;
          break;
        case "Title":
          newModuleRow[index] = lessonTitle;
          break;
        case "Description":
          newModuleRow[index] = lessonDescription;
          break;
        case "Difficulty":
          newModuleRow[index] = difficulty;
          break;
        case "Topic":
          newModuleRow[index] = topic;
          break;
        case "GeneratedDate":
          newModuleRow[index] = generatedDate;
          break;
        case "GeneratedBy":
          newModuleRow[index] = "Gemini";
          break;
        case "PromptUsed":
          newModuleRow[index] = geminiPrompt || "";
          break;
        default:
          newModuleRow[index] = "";
      }
    });
    console.log("Prepared new module row:", newModuleRow);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MODULES_SHEET_NAME}!A:Z`,
      valueInputOption: "RAW",
      resource: { values: [newModuleRow] },
    });
    console.log(`Lesson ${lessonId} added to Modules sheet.`);

    const exercisesHeadersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXERCISES_SHEET_NAME}!1:1`,
    });
    const exercisesHeaders = exercisesHeadersResponse.data.values
      ? exercisesHeadersResponse.data.values[0]
      : [];
    console.log("Exercises sheet headers obtained:", exercisesHeaders);

    if (exercisesHeaders.length === 0) {
      throw new Error(
        `No headers found in "${EXERCISES_SHEET_NAME}" sheet. Please ensure the first row has headers.`
      );
    }

    const exercisesRows = generatedExercises.map((exercise) => {
      const newExerciseRow = new Array(exercisesHeaders.length).fill("");
      exercisesHeaders.forEach((header, index) => {
        switch (header) {
          case "ExerciseID":
            newExerciseRow[index] = uuidv4();
            break;
          case "LessonID":
            newExerciseRow[index] = lessonId;
            break;
          case "Type":
            newExerciseRow[index] = exercise.type;
            break;
          case "QuestionEN":
            newExerciseRow[index] = exercise.questionEN;
            break;
          case "QuestionES":
            newExerciseRow[index] = exercise.questionES || "";
            break; // Mapear QuestionES
          case "AnswerEN":
            newExerciseRow[index] = exercise.answerEN || "";
            break; // Mapear AnswerEN
          case "AnswerES":
            newExerciseRow[index] = exercise.answerES || "";
            break; // Mapear AnswerES (para traducción/listening)
          case "OptionsEN":
            newExerciseRow[index] = exercise.optionsEN
              ? JSON.stringify(exercise.optionsEN)
              : "";
            break; // Usar OptionsEN
          case "OrderInLesson":
            newExerciseRow[index] = exercise.orderInLesson;
            break;
          case "Notes":
            newExerciseRow[index] = exercise.notes || "";
            break;
          default:
            newExerciseRow[index] = "";
        }
      });
      return newExerciseRow;
    });

    if (exercisesRows.length > 0) {
      console.log(
        `Preparing to add ${exercisesRows.length} exercises to Exercises sheet.`
      );
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
        },
        exercises: generatedExercises, // Devolver los ejercicios generados por Gemini
      },
    });
  } catch (error) {
    console.error(
      "Error in /api/generate-lesson.js:",
      error.message,
      error.stack
    );
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
    if (error.message.includes("Requested entity was not found")) {
      return res.status(404).json({
        success: false,
        error:
          "Google Sheets Error: The requested spreadsheet ID or sheet name was not found. Please double-check your SPREADSHEET_ID and sheet names (Modules, Exercises) for exact matches.",
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
