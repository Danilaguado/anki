// api/categories/get-all.js

import { google } from "googleapis";

// Configuración de tu hoja de cálculo
const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M";
const CATEGORIES_SHEET_NAME = "Categories";
const CARDS_SHEET_NAME = "Cards";

/**
 * Función principal para la API de Vercel para manejar peticiones GET.
 * Devuelve todas las categorías con sus tarjetas.
 *
 * @param {object} req - Objeto de petición HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({
        success: false,
        error: "Método no permitido. Solo se acepta GET.",
      });
  }

  try {
    // 1. Autenticación con Google Sheets API
    // Las credenciales se leen de las variables de entorno de Vercel.
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Asegura que los saltos de línea se interpreten correctamente
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"], // Permiso para leer y escribir
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 2. Leer datos de la hoja "Categories"
    const categoriesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CATEGORIES_SHEET_NAME}!A:B`, // Asume columnas ID y Name
    });
    const categoriesRows = categoriesResponse.data.values || [];

    const categoriesMap = new Map();
    if (categoriesRows.length > 0) {
      const headersCategories = categoriesRows[0];
      const idColIndex = headersCategories.indexOf("ID");
      const nameColIndex = headersCategories.indexOf("Name");

      if (idColIndex === -1 || nameColIndex === -1) {
        throw new Error(
          `Encabezados 'ID' o 'Name' no encontrados en la hoja "${CATEGORIES_SHEET_NAME}".`
        );
      }

      for (let i = 1; i < categoriesRows.length; i++) {
        const row = categoriesRows[i];
        const categoryId = row[idColIndex];
        const categoryName = row[nameColIndex];
        if (categoryId && categoryName) {
          categoriesMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            cards: [],
          });
        }
      }
    } else {
      console.warn(
        `No se encontraron datos en la hoja "${CATEGORIES_SHEET_NAME}".`
      );
    }

    // 3. Leer datos de la hoja "Cards"
    const cardsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CARDS_SHEET_NAME}!A:F`, // Asume columnas ID, CategoryID, Question, Answer, LangQuestion, LangAnswer
    });
    const cardsRows = cardsResponse.data.values || [];

    if (cardsRows.length > 0) {
      const headersCards = cardsRows[0];
      const cardIdColIndex = headersCards.indexOf("ID");
      const categoryIdColIndex = headersCards.indexOf("CategoryID");
      const questionColIndex = headersCards.indexOf("Question");
      const answerColIndex = headersCards.indexOf("Answer");
      const langQuestionColIndex = headersCards.indexOf("LangQuestion");
      const langAnswerColIndex = headersCards.indexOf("LangAnswer");

      if (
        cardIdColIndex === -1 ||
        categoryIdColIndex === -1 ||
        questionColIndex === -1 ||
        answerColIndex === -1 ||
        langQuestionColIndex === -1 ||
        langAnswerColIndex === -1
      ) {
        throw new Error(
          `Uno o más encabezados requeridos no encontrados en la hoja "${CARDS_SHEET_NAME}". Asegúrate de tener: ID, CategoryID, Question, Answer, LangQuestion, LangAnswer.`
        );
      }

      for (let i = 1; i < cardsRows.length; i++) {
        const row = cardsRows[i];
        const card = {
          id: row[cardIdColIndex],
          categoryId: row[categoryIdColIndex],
          question: row[questionColIndex],
          answer: row[answerColIndex],
          langQuestion: row[langQuestionColIndex],
          langAnswer: row[langAnswerColIndex],
        };
        // Solo añade la tarjeta si tiene un ID de tarjeta válido, pertenece a una categoría existente y tiene una pregunta
        if (
          card.id &&
          card.categoryId &&
          categoriesMap.has(card.categoryId) &&
          card.question
        ) {
          categoriesMap.get(card.categoryId).cards.push(card);
        }
      }
    } else {
      console.warn(`No se encontraron datos en la hoja "${CARDS_SHEET_NAME}".`);
    }

    const categories = Array.from(categoriesMap.values());
    return res.status(200).json(categories);
  } catch (error) {
    console.error(
      "Error en la función Serverless (get-all):",
      error.message,
      error.stack
    );
    return res
      .status(500)
      .json({
        success: false,
        error: "Error en el servidor al obtener datos: " + error.message,
      });
  }
}
