// api/categories/delete.js

import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M";
const CATEGORIES_SHEET_NAME = "Categories";
const CARDS_SHEET_NAME = "Cards";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido. Solo se acepta DELETE.",
    });
  }

  const { id } = req.query; // El ID de la categoría a eliminar se pasa como parámetro de consulta (ej. /api/categories/delete?id=cat-123)

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "El ID de la categoría es requerido para eliminar.",
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
    const requests = []; // Array para almacenar las solicitudes batch de la API de Sheets

    // --- 1. Eliminar tarjetas asociadas ---
    const cardsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CARDS_SHEET_NAME}!A:F`,
    });
    const cardsData = cardsResponse.data.values || [];

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
        `No se pudo obtener el sheetId para "${CARDS_SHEET_NAME}". La eliminación de tarjetas podría fallar.`,
        e.message
      );
    }

    if (cardsData.length > 0 && cardsSheetId !== null) {
      const cardHeaders = cardsData[0];
      const cardCatIdColIndex = cardHeaders.indexOf("CategoryID");

      if (cardCatIdColIndex === -1) {
        console.warn(
          "Advertencia: Encabezado 'CategoryID' no encontrado en la hoja Cards. No se eliminarán tarjetas relacionadas."
        );
      } else {
        const rowsToDeleteCards = [];
        for (let i = 1; i < cardsData.length; i++) {
          if (cardsData[i][cardCatIdColIndex] === id) {
            rowsToDeleteCards.push(i); // Almacena el índice 0-based de la fila de datos (sin encabezado)
          }
        }

        // Ordenar las filas a eliminar en orden descendente para eliminar de abajo hacia arriba
        // Esto evita problemas de índices al eliminar filas
        rowsToDeleteCards.sort((a, b) => b - a);

        for (const rowIndexToDelete of rowsToDeleteCards) {
          requests.push({
            deleteDimension: {
              range: {
                sheetId: cardsSheetId,
                dimension: "ROWS",
                startIndex: rowIndexToDelete, // Índice 0-based de la fila a eliminar
                endIndex: rowIndexToDelete + 1, // +1 para cubrir solo esa fila
              },
            },
          });
        }
      }
    } else if (cardsSheetId === null) {
      console.warn(
        `No se pudo encontrar el sheetId de la hoja "${CARDS_SHEET_NAME}". No se eliminarán tarjetas relacionadas.`
      );
    }

    // --- 2. Eliminar la categoría ---
    const categoriesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CATEGORIES_SHEET_NAME}!A:B`,
    });
    const categoriesData = categoriesResponse.data.values || [];

    let categoryRowIndex = -1;
    const catHeaders = categoriesData.length > 0 ? categoriesData[0] : [];
    const catIdColIndex = catHeaders.indexOf("ID");

    if (catIdColIndex === -1) {
      throw new Error(
        `Encabezado 'ID' no encontrado en la hoja "${CATEGORIES_SHEET_NAME}" para eliminar categoría.`
      );
    }

    for (let i = 1; i < categoriesData.length; i++) {
      if (categoriesData[i][catIdColIndex] === id) {
        categoryRowIndex = i; // Índice 0-based de la fila de datos (sin encabezado)
        break;
      }
    }

    if (categoryRowIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Categoría con ID ${id} no encontrada para eliminar.`,
      });
    }

    let categoriesSheetId = null;
    try {
      const spreadsheetDetails = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        fields: "sheets.properties",
      });
      categoriesSheetId = spreadsheetDetails.data.sheets.find(
        (s) => s.properties.title === CATEGORIES_SHEET_NAME
      )?.properties.sheetId;
    } catch (e) {
      console.warn(
        `No se pudo obtener el sheetId para "${CATEGORIES_SHEET_NAME}". La eliminación de la categoría podría fallar.`,
        e.message
      );
    }

    if (categoriesSheetId !== null) {
      requests.push({
        deleteDimension: {
          range: {
            sheetId: categoriesSheetId,
            dimension: "ROWS",
            startIndex: categoryRowIndex, // Índice 0-based de la fila a eliminar
            endIndex: categoryRowIndex + 1, // +1 para cubrir solo esa fila
          },
        },
      });
    } else {
      throw new Error(
        `No se pudo encontrar el sheetId de la hoja "${CATEGORIES_SHEET_NAME}". No se pudo eliminar la categoría.`
      );
    }

    // Ejecutar todas las solicitudes batch
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Categoría ${id} y sus tarjetas eliminadas.`,
    });
  } catch (error) {
    console.error(
      "Error en la función Serverless (delete-category):",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error:
        "Error en el servidor al eliminar categoría y tarjetas: " +
        error.message,
    });
  }
}
