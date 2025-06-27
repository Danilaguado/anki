// api/cards/add.js
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid"; // Importar uuid para generar IDs únicos

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡Asegúrate de que este ID sea correcto!
const CARDS_SHEET_NAME = "Cards";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido. Solo se acepta POST.",
    });
  }

  // Se espera categoryId, question, answer, langQuestion, langAnswer en el cuerpo de la solicitud
  const { categoryId, question, answer, langQuestion, langAnswer } = req.body;

  if (!categoryId || !question || !answer || !langQuestion || !langAnswer) {
    return res.status(400).json({
      success: false,
      error:
        "Todos los campos de la tarjeta (categoryId, question, answer, langQuestion, langAnswer) son requeridos para añadir.",
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

    // Generar un ID único para la nueva tarjeta
    const newCardId = uuidv4();

    // Obtener los encabezados de la hoja 'Cards' para asegurar el orden correcto
    const cardsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CARDS_SHEET_NAME}!1:1`, // Solo obtener la primera fila (encabezados)
    });
    const headers = cardsResponse.data.values
      ? cardsResponse.data.values[0]
      : [];

    if (headers.length === 0) {
      throw new Error(
        `No se encontraron encabezados en la hoja "${CARDS_SHEET_NAME}".`
      );
    }

    // Crear un array de valores en el orden de los encabezados
    const newRow = new Array(headers.length).fill("");

    // Mapear los datos de la nueva tarjeta a sus columnas correspondientes
    headers.forEach((header, index) => {
      switch (header) {
        case "ID":
          newRow[index] = newCardId;
          break;
        case "CategoryID":
          newRow[index] = categoryId;
          break;
        case "Question":
          newRow[index] = question;
          break;
        case "Answer":
          newRow[index] = answer;
          break;
        case "LangQuestion":
          newRow[index] = langQuestion;
          break;
        case "LangAnswer":
          newRow[index] = langAnswer;
          break;
        // Añade más casos si tienes otras columnas en tu hoja "Cards"
        default:
          // Si hay otras columnas no manejadas, puedes dejarles el valor vacío o un valor por defecto
          break;
      }
    });

    // Añadir la nueva fila a la hoja de Google Sheets
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CARDS_SHEET_NAME}!A:F`, // Especifica el rango donde se añadirán los datos (ej. A:F si son 6 columnas)
      valueInputOption: "RAW",
      resource: {
        values: [newRow], // La nueva fila de datos
      },
    });

    if (appendResponse.status === 200) {
      return res.status(200).json({
        success: true,
        message: `Tarjeta con ID ${newCardId} añadida exitosamente.`,
        data: {
          id: newCardId,
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
      error: "Error en el servidor al añadir la tarjeta: " + error.message,
    });
  }
}
