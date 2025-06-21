// api/categories/update.js

import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M";
const CATEGORIES_SHEET_NAME = "Categories";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    // Se usa PUT para actualizar un recurso completo
    return res
      .status(405)
      .json({
        success: false,
        error: "Método no permitido. Solo se acepta PUT.",
      });
  }

  const { id, name } = req.body; // id de la categoría a actualizar y el nuevo nombre

  if (!id || !name) {
    return res
      .status(400)
      .json({
        success: false,
        error: "ID y el nuevo nombre de la categoría son requeridos.",
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

    // Obtener todas las categorías para encontrar la fila y el índice de columna
    const categoriesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CATEGORIES_SHEET_NAME}!A:B`, // Obtener ID y Name
    });
    const categoriesData = categoriesResponse.data.values || [];

    if (categoriesData.length < 1) {
      throw new Error(`No hay datos en la hoja "${CATEGORIES_SHEET_NAME}".`);
    }

    const headers = categoriesData[0];
    const idColIndex = headers.indexOf("ID");
    const nameColIndex = headers.indexOf("Name");

    if (idColIndex === -1 || nameColIndex === -1) {
      throw new Error(
        `Encabezados 'ID' o 'Name' no encontrados en la hoja "${CATEGORIES_SHEET_NAME}" para actualizar.`
      );
    }

    let rowIndex = -1;
    for (let i = 1; i < categoriesData.length; i++) {
      if (categoriesData[i][idColIndex] === id) {
        rowIndex = i + 1; // +1 porque la API de Sheets es 1-indexada para filas, y getValues es 0-indexado sin encabezado
        break;
      }
    }

    if (rowIndex === -1) {
      return res
        .status(404)
        .json({
          success: false,
          error: `Categoría con ID ${id} no encontrada para actualizar.`,
        });
    }

    // Preparar el rango para actualizar (ej. B2 si el nombre está en la columna B y la categoría es la segunda fila)
    const rangeToUpdate = `${CATEGORIES_SHEET_NAME}!${String.fromCharCode(
      65 + nameColIndex
    )}${rowIndex}`;

    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeToUpdate,
      valueInputOption: "RAW",
      resource: {
        values: [[name]],
      },
    });

    if (updateResponse.status === 200) {
      return res
        .status(200)
        .json({ success: true, data: { id: id, name: name } });
    } else {
      throw new Error("Error al actualizar la categoría en Google Sheets.");
    }
  } catch (error) {
    console.error(
      "Error en la función Serverless (update-category):",
      error.message,
      error.stack
    );
    return res
      .status(500)
      .json({
        success: false,
        error: "Error en el servidor al actualizar categoría: " + error.message,
      });
  }
}
