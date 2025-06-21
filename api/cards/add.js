// api/cards/add.js

import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M";
const CATEGORIES_SHEET_NAME = "Categories";
const CARDS_SHEET_NAME = "Cards";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido. Solo se acepta POST.",
    });
  }

  const { categoryId, question, answer, langQuestion, langAnswer } = req.body;

  if (!categoryId || !question || !answer || !langQuestion || !langAnswer) {
    return res.status(400).json({
      success: false,
      error: "Todos los campos de la tarjeta son requeridos.",
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

    // Validar que la categoría existe
    const categoriesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CATEGORIES_SHEET_NAME}!A:A`, // Obtener solo los IDs de categoría
    });
    const existingCategoryIds = (categoriesResponse.data.values || [])
      .map((row) => row[0])
      .slice(1); // Ignorar encabezado

    if (!existingCategoryIds.includes(categoryId)) {
      return res.status(404).json({
        success: false,
        error: `Categoría con ID ${categoryId} no encontrada. No se puede añadir la tarjeta.`,
      });
    }

    const newId = `card-${Date.now()}`;

    // Obtener encabezados de la hoja Cards para determinar el orden de las columnas
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CARDS_SHEET_NAME}!1:1`, // Obtener solo la primera fila (encabezados)
    });
    const sheetHeaders = headersResponse.data.values[0];

    if (!sheetHeaders || sheetHeaders.length === 0) {
      throw new Error(
        `No se pudieron obtener los encabezados de la hoja "${CARDS_SHEET_NAME}".`
      );
    }

    const cardIdColIndex = sheetHeaders.indexOf("ID");
    const catIdCardColIndex = sheetHeaders.indexOf("CategoryID");
    const questionColIndex = sheetHeaders.indexOf("Question");
    const answerColIndex = sheetHeaders.indexOf("Answer");
    const langQuestionColIndex = sheetHeaders.indexOf("LangQuestion");
    const langAnswerColIndex = sheetHeaders.indexOf("LangAnswer");

    if (
      [
        cardIdColIndex,
        catIdCardColIndex,
        questionColIndex,
        answerColIndex,
        langQuestionColIndex,
        langAnswerColIndex,
      ].some((idx) => idx === -1)
    ) {
      throw new Error(
        `Uno o más encabezados requeridos no encontrados en la hoja "${CARDS_SHEET_NAME}" para añadir tarjeta. Asegúrate de tener: ID, CategoryID, Question, Answer, LangQuestion, LangAnswer.`
      );
    }

    const newRow = Array(sheetHeaders.length).fill("");
    newRow[cardIdColIndex] = newId;
    newRow[catIdCardColIndex] = categoryId;
    newRow[questionColIndex] = question;
    newRow[answerColIndex] = answer;
    newRow[langQuestionColIndex] = langQuestion;
    newRow[langAnswerColIndex] = langAnswer;

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: CARDS_SHEET_NAME,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [newRow],
      },
    });

    if (appendResponse.status === 200) {
      return res.status(200).json({
        success: true,
        data: {
          id: newId,
          categoryId,
          question,
          answer,
          langQuestion,
          langAnswer,
        },
      });
    } else {
      throw new Error("Error al añadir la tarjeta en Google Sheets.");
    }
  } catch (error) {
    console.error(
      "Error en la función Serverless (add-card):",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error: "Error en el servidor al añadir tarjeta: " + error.message,
    });
  }
}
