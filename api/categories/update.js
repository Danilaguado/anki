// api/cards/update.js
import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡Asegúrate de que este ID sea correcto!
const CARDS_SHEET_NAME = "Cards";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido. Solo se acepta PUT.",
    });
  }

  // Se espera el ID de la tarjeta, CategoryID, question, answer, langQuestion, langAnswer en el cuerpo de la solicitud
  const { id, categoryId, question, answer, langQuestion, langAnswer } =
    req.body;

  if (
    !id ||
    !categoryId ||
    !question ||
    !answer ||
    !langQuestion ||
    !langAnswer
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Todos los campos de la tarjeta (id, categoryId, question, answer, langQuestion, langAnswer) son requeridos para actualizar.",
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

    // 1. Obtener todas las tarjetas para encontrar la fila a actualizar
    const cardsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CARDS_SHEET_NAME}!A:F`, // Ajusta el rango para incluir todas tus columnas de tarjetas
    });
    const cardsData = cardsResponse.data.values || [];

    if (cardsData.length < 1) {
      throw new Error(`No hay datos en la hoja "${CARDS_SHEET_NAME}".`);
    }

    const headers = cardsData[0]; // Encabezados de la hoja Cards
    const idColIndex = headers.indexOf("ID");
    const categoryIdColIndex = headers.indexOf("CategoryID");
    const questionColIndex = headers.indexOf("Question");
    const answerColIndex = headers.indexOf("Answer");
    const langQuestionColIndex = headers.indexOf("LangQuestion");
    const langAnswerColIndex = headers.indexOf("LangAnswer");

    // Verificar que todos los encabezados necesarios existan
    if (
      [
        idColIndex,
        categoryIdColIndex,
        questionColIndex,
        answerColIndex,
        langQuestionColIndex,
        langAnswerColIndex,
      ].some((index) => index === -1)
    ) {
      throw new Error(
        `Faltan encabezados requeridos (ID, CategoryID, Question, Answer, LangQuestion, LangAnswer) en la hoja "${CARDS_SHEET_NAME}".`
      );
    }

    let rowIndex = -1;
    // Buscar la fila de la tarjeta por su ID (empezar desde la segunda fila para saltar encabezados)
    for (let i = 1; i < cardsData.length; i++) {
      if (cardsData[i][idColIndex] === id) {
        rowIndex = i + 1; // +1 porque la API de Sheets es 1-indexada para filas
        break;
      }
    }

    if (rowIndex === -1) {
      // Si la tarjeta no se encuentra, devolver 404
      return res.status(404).json({
        success: false,
        error: `Tarjeta con ID ${id} no encontrada para actualizar.`,
      });
    }

    // Preparar los valores para actualizar la fila completa de la tarjeta
    const valuesToUpdate = new Array(headers.length).fill(""); // Crear un array vacío del tamaño de los encabezados

    // Rellenar con los valores existentes para las columnas que no se actualizan explícitamente
    // Esto es importante para no borrar datos de columnas que no manejas en esta API
    const existingRow = cardsData[rowIndex - 1]; // Obtener la fila existente (0-indexed)

    headers.forEach((header, index) => {
      if (existingRow && existingRow[index] !== undefined) {
        valuesToUpdate[index] = existingRow[index];
      }
    });

    // Actualizar solo las columnas que se están enviando
    valuesToUpdate[categoryIdColIndex] = categoryId;
    valuesToUpdate[questionColIndex] = question;
    valuesToUpdate[answerColIndex] = answer;
    valuesToUpdate[langQuestionColIndex] = langQuestion;
    valuesToUpdate[langAnswerColIndex] = langAnswer;
    // El ID no se actualiza, solo se usa para encontrar la fila

    // Preparar el rango para actualizar toda la fila de la tarjeta (ej. A2:F2 si hay 6 columnas)
    // Se calcula dinámicamente desde la columna A hasta la última columna de los encabezados
    const rangeToUpdate = `${CARDS_SHEET_NAME}!A${rowIndex}:${String.fromCharCode(
      65 + headers.length - 1
    )}${rowIndex}`;

    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeToUpdate,
      valueInputOption: "RAW",
      resource: {
        values: [valuesToUpdate], // Se espera un array de arrays, por eso [[valuesToUpdate]]
      },
    });

    if (updateResponse.status === 200) {
      return res.status(200).json({
        success: true,
        message: `Tarjeta con ID ${id} actualizada exitosamente.`,
        data: { id, categoryId, question, answer, langQuestion, langAnswer },
      });
    } else {
      throw new Error("Error al actualizar la tarjeta en Google Sheets.");
    }
  } catch (error) {
    console.error(
      "Error en la función Serverless (update-card):",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error: "Error en el servidor al actualizar la tarjeta: " + error.message,
    });
  }
}
