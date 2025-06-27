// api/cards/delete.js
import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡Asegúrate de que este ID sea correcto!
const CARDS_SHEET_NAME = "Cards";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido. Solo se acepta DELETE.",
    });
  }

  const { id } = req.query; // El ID de la tarjeta a eliminar se pasa como parámetro de consulta (ej. /api/cards/delete?id=card-123)

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "El ID de la tarjeta es requerido para eliminar.",
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

    // --- 1. Encontrar la fila de la tarjeta y eliminarla ---
    const cardsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CARDS_SHEET_NAME}!A:F`, // Ajusta el rango si tus columnas son diferentes
    });
    const cardsData = cardsResponse.data.values || [];

    let cardRowIndex = -1;
    const cardHeaders = cardsData.length > 0 ? cardsData[0] : [];
    const cardIdColIndex = cardHeaders.indexOf("ID"); // Asume que el ID de la tarjeta está en una columna 'ID'

    if (cardIdColIndex === -1) {
      throw new Error(
        `Encabezado 'ID' no encontrado en la hoja "${CARDS_SHEET_NAME}" para eliminar tarjeta.`
      );
    }

    // Buscar la fila de la tarjeta por su ID
    for (let i = 1; i < cardsData.length; i++) {
      // Empezar desde 1 para saltar los encabezados
      if (cardsData[i][cardIdColIndex] === id) {
        cardRowIndex = i; // Índice 0-based de la fila de datos (sin encabezado)
        break;
      }
    }

    if (cardRowIndex === -1) {
      // Si la tarjeta no se encuentra, devolver 404
      return res.status(404).json({
        success: false,
        error: `Tarjeta con ID ${id} no encontrada para eliminar.`,
      });
    }

    let cardsSheetId = null;
    try {
      const spreadsheetDetails = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        fields: "sheets.properties",
      });
      cardsSheetId = spreadsheetDetails.data.sheets.find(
        (s) => s.properties.title === CARDS_SHEET_NAME
      )?.properties.sheetId;
    } catch (e) {
      console.warn(
        `No se pudo obtener el sheetId para "${CARDS_SHEET_NAME}". La eliminación de la tarjeta podría fallar.`,
        e.message
      );
    }

    if (cardsSheetId === null) {
      throw new Error(
        `No se pudo encontrar el sheetId de la hoja "${CARDS_SHEET_NAME}". No se pudo eliminar la tarjeta.`
      );
    }

    // Preparar la solicitud para eliminar la fila
    const requests = [
      {
        deleteDimension: {
          range: {
            sheetId: cardsSheetId,
            dimension: "ROWS",
            startIndex: cardRowIndex, // Índice de la fila a eliminar
            endIndex: cardRowIndex + 1, // +1 para cubrir solo esa fila
          },
        },
      },
    ];

    // Ejecutar la solicitud batch
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: { requests },
    });

    return res.status(200).json({
      success: true,
      message: `Tarjeta con ID ${id} eliminada exitosamente.`,
    });
  } catch (error) {
    console.error(
      "Error en la función Serverless (delete-card):",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error: "Error en el servidor al eliminar la tarjeta: " + error.message,
    });
  }
}
