// api/generate-lesson.js
// Endpoint para generar una lección usando la API de Gemini y guardarla en Google Sheets.

import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid"; // Para generar IDs únicos

// Tu ID de Google Sheet. ¡IMPORTANTE! Reemplázalo.
const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡IMPORTANTE! Reemplaza con el ID de tu Google Sheet
const MODULES_SHEET_NAME = "Modules";
const EXERCISES_SHEET_NAME = "Exercises";

export default async function handler(req, res) {
  // --- LOG DE DEPURACIÓN CRÍTICO ---
  console.log(
    "DEBUG: SPREADSHEET_ID visto en el backend al inicio del handler:",
    SPREADSHEET_ID
  );
  // --- FIN LOG DE DEPURACIÓN ---

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Only POST is accepted.",
    });
  }

  const {
    topic,
    difficulty,
    exerciseCount,
    exerciseTypes,
    customPrompt,
    moduleType,
  } = req.body; // exerciseTypes es el esquema de orden

  if (!topic || !difficulty || !exerciseCount || !moduleType) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required parameters: topic, difficulty, exerciseCount, and moduleType are required.",
    });
  }

  let geminiPrompt = "";
  let exercisesSchemaForGemini = [];

  if (moduleType === "standard_lesson") {
    exercisesSchemaForGemini = exerciseTypes; // Para lección estándar, exerciseTypes es el esquema de orden
    geminiPrompt =
      customPrompt ||
      `You are an experienced and friendly English teacher, specializing in creating coherent and reinforcing lessons for ${difficulty} level Spanish speakers. The goal of this lesson is deep learning and practical application, not just testing. All exercises MUST revolve strictly around the topic/verb: "${topic}".`;

    if (customPrompt) {
      geminiPrompt += ` Special instruction for lesson content: ${customPrompt}.`;
    }

    geminiPrompt += `
    **Learning Strategy: Reinforcement and Contextual Introduction**
    
    1.  **Identify 3 core English phrases/sentences** directly related to "${topic}" at a ${difficulty} level. These will be the foundational learning points. You must use these as CORE_PHRASE_1, CORE_PHRASE_2, and CORE_PHRASE_3 for consistent reuse.
    2.  Exercises will heavily reuse and adapt these 3 core phrases (CORE_PHRASE_1, CORE_PHRASE_2, CORE_PHRASE_3) for reinforcement across different exercise types.
    3.  **Vocabulary Introduction:** Any English word/phrase required as an 'answerEN' in 'multiple_choice' or 'fill_in_the_blank' exercises MUST either be:
        a.  Introduced and explained in the 'notes' of an earlier exercise (especially the first one).
        b.  Appeared as a clear translation (questionEN/questionES pair) in an earlier 'translation' exercise.
        This ensures a teaching-first approach. Avoid completely new words as answers without prior explanation.
    
    **Exercise Order and Specific Content Requirements for Each Type:**
    
    The exercises MUST follow this exact sequential order and type for the ${exerciseCount} exercises: ${exercisesSchemaForGemini
      .map((type, index) => `${index + 1}. ${type}`)
      .join(", ")}.
    
    For each exercise object, ensure the following fields are correctly populated:
    -   'type': Matches the ordered type.
    -   'questionEN': The English sentence or phrase for the exercise.
    -   'questionES': The Spanish translation of 'questionEN'.
    -   'answerEN': The correct ENGLISH answer/word.
      - For 'fill_in_the_blank': This is the specific English word that fills the '_______' blank in 'questionEN'.
      - For 'multiple_choice': This is the correct English option among the choices.
      - For 'listening': This is the complete English phrase from 'questionEN' (for transcription).
      - For 'translation': This is the English phrase from 'questionEN'.
    -   'answerES': The correct SPANISH translation for 'answerEN'. (This is the translation of the single word 'answerEN', not the full sentence 'questionEN', unless 'answerEN' *is* the full sentence.)
    -   **'optionsEN': For 'multiple_choice' exercises, this array MUST contain 4 distinct ENGLISH options, INCLUDING 'answerEN' as one of them.** The options should be plausible and related to the context. For other exercise types, this array must be empty. The order within this array does not matters as the frontend will randomize it.
    -   'orderInLesson': Sequential number from 1 to ${exerciseCount}.
    -   'notes': (CRITICAL FOR LEARNING) Provide a brief, friendly, and insightful explanation in **Spanish** of the main concept, word, or grammar point being taught in this specific exercise. Include 2 clear examples of its usage (English sentence + Spanish translation for each example) related to the lesson's topic.
    
    **Specific Requirements by Exercise Type (Reinforced Coherence):**
    
    -   **'multiple_choice' (Exercises 1, 2, 3)**:
        -   'questionEN': A practical English sentence where the 'answerEN' is the key missing word, or a phrase that sets context for the 'answerEN'.
        -   'questionES': A simple, direct question in **Spanish** that relates to 'questionEN' and guides the user to select the correct English word. Example: "¿Qué palabra completa mejor la frase?" or "¿Cuál de estas palabras significa [traducción de answerEN]?". Avoid complex grammar terminology or abstract definitions.
        -   'answerEN': CORE_PHRASE_1 (Ex.1), CORE_PHRASE_2 (Ex.2), CORE_PHRASE_3 (Ex.3) as correct options.
        -   'notes': For Ex. 1, explain CORE_PHRASE_1 thoroughly with 2 examples. For Ex. 2 and 3, explain any new vocabulary or reinforce the meaning of the core phrase (CORE_PHRASE_2 or CORE_PHRASE_3) if applicable.
    
    -   **'fill_in_the_blank' (Exercises 4, 5, 6)**:
        -   'questionEN': A sentence in English with exactly one '_______' placeholder. The word that fills this blank **MUST be the 'answerEN'** (e.g., if 'answerEN' is "get", then 'questionEN' could be "I need to _______ a new job."). The sentence MUST be CORE_PHRASE_1 (Ex.4), CORE_PHRASE_2 (Ex.5), CORE_PHRASE_3 (Ex.6) or a sentence clearly using them.
        -   'questionES': **The complete Spanish translation of 'questionEN' *con el espacio rellenado correctamente en español*. Esta es la pista/guía directa para el usuario.** Por ejemplo, si 'questionEN' es "I need to _______ a new job." y 'answerEN' es "get", entonces 'questionES' debería ser "Necesito conseguir un nuevo trabajo.".
        -   'answerEN': The English word/phrase that fills the blank. (Must correspond to the core phrase from Ex. 1, 2, or 3).
    
    -   **'translation' (Exercises 7, 8, 9)**:
        -   'questionEN': An English sentence/phrase for translation. This sentence **MUST be CORE_PHRASE_1 (Ex.7), CORE_PHRASE_2 (Ex.8), CORE_PHRASE_3 (Ex.9).**
        -   'questionES': The correct Spanish translation of 'questionEN'.
        -   'answerEN': The original 'questionEN' text itself (for validation).
    
    -   **'listening' (Exercises 10, 11, 12)**:
        -   'questionEN': An English sentence/phrase to listen to. This sentence **MUST be CORE_PHRASE_1 (Ex.10), CORE_PHRASE_2 (Ex.11), CORE_PHRASE_3 (Ex.12).**
        -   'questionES': The correct Spanish translation of 'questionEN'.
        -   'answerEN': The original 'questionEN' text itself (for validation).
    
    Ensure the entire response is a valid JSON array of EXACTLY ${exerciseCount} exercise objects, nothing more, nothing less.`;
  } else if (moduleType === "chatbot_lesson") {
    // ¡NUEVO ESQUEMA PARA CHATBOT_LESSON! Genera UN SOLO ejercicio de tipo 'practice_chat'
    // Este ejercicio contendrá TODA la secuencia de la lección en su dialogueSequence.
    exercisesSchemaForGemini = ["practice_chat"]; // Solo 1 ejercicio principal de chat
    exerciseCount = 1; // Forzar a 1 ejercicio para Gemini

    geminiPrompt = `You are an AI simulating a conversation partner and English teacher. Generate a ${difficulty} level English lesson for a Spanish speaker, centered around a conversational scenario related to "${topic}". The lesson will be presented as a continuous chat dialogue.`;

    if (customPrompt) {
      geminiPrompt += ` Special instruction: ${customPrompt}.`;
    }

    geminiPrompt += `
**Lesson Structure for Chatbot Module (Single Exercise Object):**

Provide a single JSON object for ONE exercise of type "practice_chat". This exercise's "dialogueSequence" will contain the entire 12-step lesson flow.

- "type": "practice_chat"
- "questionEN": "Let's start our conversation about ${topic}." (or a similar engaging intro)
- "questionES": "Comencemos nuestra conversación sobre ${topic}."
- "answerEN": The expected *first* English response from the user to start the dialogue (e.g., "Okay, I'm ready.")
- "answerES": Spanish translation of "answerEN"
- "optionsEN": Empty array
- "notes": A brief Spanish explanation of the chat scenario and what the user should aim to practice.
- **"dialogueSequence"**: This is a JSON array that defines the full 12-step conversational lesson. Each step corresponds to one of the exercise types you specified, presented conversationally.
  - **For AI turns**: "speaker": "ai", "phraseEN": AI's line in English, "phraseES": Spanish translation.
    - For the first AI turn, it should be an introduction.
    - For subsequent AI turns that *present an exercise*: "phraseEN" should be the exercise's question (e.g., "Now, complete the sentence: 'I _______ a new job.'"), "phraseES" its Spanish translation, AND include the "exerciseType", "exerciseAnswerEN", "exerciseOptionsEN" (if multiple choice), and "exerciseNotes" for that specific exercise *within the AI's step object*.
  - **For User turns**: "speaker": "user", "expectedEN": The exact English phrase the user is expected to type/say (which is the "exerciseAnswerEN" of the exercise being presented by the preceding AI turn).
  - **Ensure the dialogue is natural and flows well, introducing vocabulary related to "${topic}".** The conversation should seamlessly integrate the 12 exercises.
  - **The 12 exercises (multiple_choice, fill_in_the_blank, translation, listening) must be integrated into the AI's turns in the dialogueSequence.** The AI will present the exercise, and the user will respond.
  - **Example structure for an AI step presenting a multiple_choice exercise:**
    \`{ "speaker": "ai", "phraseEN": "Let's try a multiple choice question. Which word completes: 'I need to _______ a new book.'?", "phraseES": "Intentemos una pregunta de opción múltiple. ¿Qué palabra completa: 'Necesito _______ un libro nuevo.'?", "exerciseType": "multiple_choice", "exerciseQuestionEN": "I need to _______ a new book.", "exerciseQuestionES": "Necesito _______ un libro nuevo.", "exerciseAnswerEN": "get", "exerciseOptionsEN": ["buy", "find", "have", "get"], "exerciseNotes": "El verbo 'get' significa 'obtener'..." }\`
  - **Example structure for a User step:**
    \`{ "speaker": "user", "expectedEN": "get" }\`

Ensure the entire response is a valid JSON array containing EXACTLY ONE exercise object of type "practice_chat", nothing more, nothing less.
`;
  } else {
    return res.status(400).json({
      success: false,
      error:
        "Invalid moduleType. Must be 'standard_lesson' or 'chatbot_lesson'.",
    });
  }

  try {
    console.log(
      "DEBUG: SPREADSHEET_ID visto en el backend al inicio del handler:",
      SPREADSHEET_ID
    );
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
                dialogueSequence: {
                  // Campo opcional para practice_chat
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      speaker: { type: "STRING" },
                      phraseEN: { type: "STRING" },
                      phraseES: { type: "STRING" },
                      expectedEN: { type: "STRING" },
                      // Nuevos campos para ejercicios incrustados en el diálogo
                      exerciseType: { type: "STRING" },
                      exerciseQuestionEN: { type: "STRING" },
                      exerciseQuestionES: { type: "STRING" },
                      exerciseAnswerEN: { type: "STRING" },
                      exerciseOptionsEN: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                      },
                      exerciseNotes: { type: "STRING" },
                    },
                    required: ["speaker"],
                  },
                },
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
        case "OrderInPage":
          newModuleRow[index] = "";
          break; // Se deja vacío para edición manual
        case "TypeModule":
          newModuleRow[index] = moduleType;
          break; // ¡NUEVO! Guardar el tipo de módulo
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
          case "Image":
            newExerciseRow[index] = exercise.image || "";
            break;
          case "DialogueSequence":
            newExerciseRow[index] = exercise.dialogueSequence
              ? JSON.stringify(exercise.dialogueSequence)
              : "";
            break;
          // Nuevos campos para ejercicios incrustados en el diálogo
          case "ExerciseType":
            newExerciseRow[index] = exercise.exerciseType || "";
            break;
          case "ExerciseQuestionEN":
            newExerciseRow[index] = exercise.exerciseQuestionEN || "";
            break;
          case "ExerciseQuestionES":
            newExerciseRow[index] = exercise.exerciseQuestionES || "";
            break;
          case "ExerciseAnswerEN":
            newExerciseRow[index] = exercise.exerciseAnswerEN || "";
            break;
          case "ExerciseOptionsEN":
            newExerciseRow[index] = exercise.exerciseOptionsEN
              ? JSON.stringify(exercise.exerciseOptionsEN)
              : "";
            break;
          case "ExerciseNotes":
            newExerciseRow[index] = exercise.exerciseNotes || "";
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
          TypeModule: moduleType,
        }, // ¡NUEVO! Devolver el tipo de módulo
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
