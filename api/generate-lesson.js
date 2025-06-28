// api/generate-lesson.js
// Endpoint para generar una lección usando la API de Gemini y guardarla en Google Sheets.

import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid"; // Para generar IDs únicos

// Tu ID de Google Sheet. ¡IMPORTANTE! Reemplázalo.
const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡IMPORTANTE! Reemplaza con el ID de tu Google Sheet
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
    req.body; // exerciseTypes es el esquema de orden

  if (!topic || !difficulty || !exerciseCount) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required parameters: topic, difficulty, and exerciseCount are required.",
    });
  }

  // --- Construcción del Prompt para Gemini (¡Lógica clave para la coherencia!) ---
  // Se presenta a Gemini como un "maestro" y se refuerza el foco en el tema.
  let geminiPrompt = `You are an experienced and friendly English teacher, specializing in creating coherent and reinforcing lessons for ${difficulty} level Spanish speakers. The goal of this lesson is deep learning and practical application, not just testing. All exercises MUST revolve strictly around the topic/verb: "${topic}".`;

  if (customPrompt) {
    geminiPrompt += ` Special instruction for lesson content: ${customPrompt}.`;
  }

  // Instrucciones detalladas para Gemini sobre el formato, el contenido, la COHERENCIA y las NOTAS
  geminiPrompt += ` The lesson will consist of exactly ${exerciseCount} exercises. The exercises MUST follow this exact order and type: ${exerciseTypes
    .map((type, index) => `${index + 1}. ${type}`)
    .join(", ")}.
  
  For each exercise, please provide the following JSON structure. All fields must be present and correctly formatted. Crucially, ensure that vocabulary is taught before it is tested. The exercises should build upon each other.
  
  - 'type': Must be one of ${exerciseTypes.map((t) => `'${t}'`).join(", ")}.
  - 'questionEN': The English phrase/sentence for the exercise.
  - 'questionES': The Spanish translation of 'questionEN'.
  - 'answerEN': The correct ENGLISH answer/word.
    - For 'fill_in_the_blank': This is the specific English word that fills the '_______' blank in 'questionEN'.
    - For 'multiple_choice': This is the correct English option among the choices.
    - For 'listening': This is the complete English phrase from 'questionEN' (for transcription).
    - For 'translation': This is the English phrase from 'questionEN'.
  - 'answerES': The correct SPANISH translation.
    - For 'translation' and 'listening': This is the Spanish translation of 'questionEN'.
    - For 'fill_in_the_blank' and 'multiple_choice': This is the Spanish translation of 'answerEN'.
  - 'optionsEN': An array of 3 *distinct, incorrect* ENGLISH options. This must be an empty array for other types. The correct answer will be added by the frontend.
  - 'orderInLesson': A number indicating its sequential order (1 to ${exerciseCount}).
  - 'notes': (EXTREMELY IMPORTANT) Provide a brief, friendly, and insightful explanation in **Spanish** of the main concept, word, or grammar point being taught in this specific exercise. Include 2 clear examples of its usage (English sentence + Spanish translation for each example) related to the lesson's topic.
    - **Coherence Rule 1 (for 'multiple_choice' exercises, especially order 1, 2, 3):** The 'questionES' should be a Spanish question asking to choose the correct English word/phrase. The 'notes' MUST introduce and explain the vocabulary word that will be the 'answerEN' for this exercise and its associated concepts. These are key teaching moments.
    - **Coherence Rule 2 (for 'fill_in_the_blank' exercises, especially order 4, 5, 6):** The 'questionEN' should contain exactly one '_______' placeholder. The 'answerEN' for the blank MUST be a word/phrase that was introduced or explained in the 'notes' of an earlier 'multiple_choice' exercise (order 1-3) or appeared in a 'translation' exercise (order 7-9) before this exercise. 'questionES' must be the full Spanish translation of 'questionEN' *with the blank filled correctly in Spanish*, serving as a clear guide.
    - **Coherence Rule 3 (for 'translation' exercises, especially order 7, 8, 9):** These exercises should reuse and reinforce sentences or vocabulary introduced in prior 'multiple_choice' or 'fill_in_the_blank' exercises.
    - **Coherence Rule 4 (for 'listening' exercises, especially order 10, 11, 12):** These exercises should reuse and reinforce sentences or vocabulary introduced in prior 'translation' or interactive exercises.
    - Avoid introducing completely new vocabulary as 'answerEN' in interactive exercises without prior context or explanation in 'notes'. Ensure a smooth and logical progression of learning.
    
  Ensure the entire response is a valid JSON array of exactly ${exerciseCount} exercise objects, nothing more, nothing less.`;

  try {
    console.log("SPREADSHEET_ID actual en el backend:", SPREADSHEET_ID);
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
            // Esquema de respuesta para Gemini
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                type: { type: "STRING" },
                questionEN: { type: "STRING" },
                questionES: { type: "STRING" },
                answerEN: { type: "STRING" },
                answerES: { type: "STRING" },
                optionsEN: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                orderInLesson: { type: "NUMBER" },
                notes: { type: "STRING" },
              },
              required: [
                "type",
                "questionEN",
                "questionES",
                "answerEN",
                "answerES",
                "optionsEN",
                "orderInLesson",
                "notes",
              ],
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
      if (generatedExercises.length !== exerciseCount) {
        console.warn(
          `Gemini generated ${generatedExercises.length} exercises, but ${exerciseCount} were requested. Attempting to use generated exercises.`
        );
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error(
        "Raw Gemini response:",
        geminiResult.candidates[0].content.parts[0].text
      );
      throw new new Error(
        "Failed to parse Gemini's response. It might not be valid JSON: " +
          parseError.message
      )(); // Fix: remove 'new' here
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
            break;
          case "AnswerEN":
            newExerciseRow[index] = exercise.answerEN || "";
            break;
          case "AnswerES":
            newExerciseRow[index] = exercise.answerES || "";
            break;
          case "OptionsEN":
            newExerciseRow[index] = exercise.optionsEN
              ? JSON.stringify(exercise.optionsEN)
              : "";
            break;
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
        exercises: generatedExercises,
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
