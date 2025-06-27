// api/cards/update.js
import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M";
// ¡Asegúrate de que este ID sea correcto!
const CARDS_SHEET_NAME = "Cards";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Only PUT is accepted.",
    });
  }

  let { id, categoryId, question, answer, langQuestion, langAnswer } = req.body;

  console.log("Valores recibidos en req.body para actualizar tarjeta:", {
    id,
    categoryId,
    question,
    answer,
    langQuestion,
    langAnswer,
  });

  langQuestion = langQuestion || "en-US";
  langAnswer = langAnswer || "es-ES";

  id = id ? String(id).trim() : "";
  categoryId = categoryId ? String(categoryId).trim() : "";
  question = question ? String(question).trim() : "";
  answer = answer ? String(answer).trim() : "";
  langQuestion = langQuestion ? String(langQuestion).trim() : "";
  langAnswer = langAnswer ? String(langAnswer).trim() : "";

  console.log(
    "Valores procesados para actualizar tarjeta (después de trim/defaults):",
    { id, categoryId, question, answer, langQuestion, langAnswer }
  );

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Card 'id' is required and cannot be empty.",
    });
  }
  if (!categoryId) {
    return res.status(400).json({
      success: false,
      error: "Card 'categoryId' is required and cannot be empty.",
    });
  }
  if (!question) {
    return res.status(400).json({
      success: false,
      error: "Card 'question' is required and cannot be empty.",
    });
  }
  if (!answer) {
    return res.status(400).json({
      success: false,
      error: "Card 'answer' is required and cannot be empty.",
    });
  }
  if (!langQuestion) {
    return res.status(400).json({
      success: false,
      error: "Card 'langQuestion' is required and cannot be empty.",
    });
  }
  if (!langAnswer) {
    return res.status(400).json({
      success: false,
      error: "Card 'langAnswer' is required and cannot be empty.",
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

    const cardsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CARDS_SHEET_NAME}!A:Z`, // Increased range to fetch all possible columns
    });
    const cardsData = cardsResponse.data.values || [];

    if (cardsData.length < 1) {
      return res.status(404).json({
        success: false,
        error: `No data found in "${CARDS_SHEET_NAME}" sheet or sheet is empty.`,
      });
    }

    const headers = cardsData[0];
    console.log("Encabezados de la hoja Cards:", headers); // Log headers

    const idColIndex = headers.indexOf("ID");
    const categoryIdColIndex = headers.indexOf("CategoryID");
    const questionColIndex = headers.indexOf("Question");
    const answerColIndex = headers.indexOf("Answer");
    const langQuestionColIndex = headers.indexOf("LangQuestion");
    const langAnswerColIndex = headers.indexOf("LangAnswer");

    console.log("Índices de columna:", {
      idColIndex,
      categoryIdColIndex,
      questionColIndex,
      answerColIndex,
      langQuestionColIndex,
      langAnswerColIndex,
    }); // Log indices

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
      const missingHeaders = [];
      if (idColIndex === -1) missingHeaders.push("ID");
      if (categoryIdColIndex === -1) missingHeaders.push("CategoryID");
      if (questionColIndex === -1) missingHeaders.push("Question");
      if (answerColIndex === -1) missingHeaders.push("Answer");
      if (langQuestionColIndex === -1) missingHeaders.push("LangQuestion");
      if (langAnswerColIndex === -1) missingHeaders.push("LangAnswer");
      console.error(
        `Faltan los siguientes encabezados en la hoja "${CARDS_SHEET_NAME}": ${missingHeaders.join(
          ", "
        )}`
      );
      throw new Error(
        `Required headers (${missingHeaders.join(
          ", "
        )}) are missing in "${CARDS_SHEET_NAME}" sheet. Please ensure 'ID', 'CategoryID', 'Question', 'Answer', 'LangQuestion', and 'LangAnswer' columns exist.`
      );
    }

    let rowIndex = -1;
    for (let i = 1; i < cardsData.length; i++) {
      if (cardsData[i][idColIndex] === id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Card with ID ${id} not found for update.`,
      });
    }

    const valuesToUpdate = new Array(headers.length).fill("");
    const existingRow = cardsData[rowIndex - 1];

    // Copy existing row data to preserve columns not being updated
    if (existingRow) {
      headers.forEach((header, index) => {
        if (existingRow[index] !== undefined) {
          valuesToUpdate[index] = existingRow[index];
        }
      });
    }

    // Update specific columns with new values
    valuesToUpdate[idColIndex] = id;
    valuesToUpdate[categoryIdColIndex] = categoryId;
    valuesToUpdate[questionColIndex] = question;
    valuesToUpdate[answerColIndex] = answer;
    valuesToUpdate[langQuestionColIndex] = langQuestion;
    valuesToUpdate[langAnswerColIndex] = langAnswer;

    console.log(
      "Valores que se enviarán a Google Sheets para actualizar:",
      valuesToUpdate
    );

    const rangeToUpdate = `${CARDS_SHEET_NAME}!A${rowIndex}:${String.fromCharCode(
      65 + headers.length - 1
    )}${rowIndex}`;
    console.log("Rango de actualización de Google Sheets:", rangeToUpdate); // Log range

    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeToUpdate,
      valueInputOption: "RAW",
      resource: {
        values: [valuesToUpdate],
      },
    });

    if (updateResponse.status === 200) {
      return res.status(200).json({
        success: true,
        message: `Card with ID ${id} updated successfully.`,
        data: { id, categoryId, question, answer, langQuestion, langAnswer },
      });
    } else {
      throw new Error(
        `Unexpected error updating card in Google Sheets. Status: ${updateResponse.status}`
      );
    }
  } catch (error) {
    console.error(
      "Error in Serverless function (update-card):",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error: "Internal Server Error updating card: " + error.message,
    });
  }
}
