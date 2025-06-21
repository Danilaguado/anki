// api/categories/add.js

import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M";
const CATEGORIES_SHEET_NAME = "Categories";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        success: false,
        error: "Método no permitido. Solo se acepta POST.",
      });
  }

  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({
        success: false,
        error: "El nombre de la categoría es requerido.",
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

    // Validar si el nombre de la categoría ya existe
    const categoriesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CATEGORIES_SHEET_NAME}!A:B`, // Obtener ID y Name
    });
    const categoriesData = categoriesResponse.data.values || [];

    if (categoriesData.length > 0) {
      const headers = categoriesData[0];
      const nameColIndex = headers.indexOf("Name");

      if (nameColIndex === -1) {
        throw new Error(
          `Encabezado 'Name' no encontrado en la hoja "${CATEGORIES_SHEET_NAME}".`
        );
      }

      for (let i = 1; i < categoriesData.length; i++) {
        if (categoriesData[i][nameColIndex] === name) {
          return res
            .status(409)
            .json({
              success: false,
              error: `La categoría "${name}" ya existe.`,
            });
        }
      }
    }

    const newId = `cat-${Date.now()}`;
    // Para appendRow, necesitamos los valores en el orden de las columnas esperadas.
    // Si la hoja Categories solo tiene ID y Name, el array debe ser [newId, name].
    // Si tiene más columnas, se deben agregar valores vacíos o nulos para esas columnas.
    // Para ser robustos, primero obtendremos los encabezados para saber el número de columnas.
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CATEGORIES_SHEET_NAME}!1:1`, // Obtener solo la primera fila (encabezados)
    });
    const sheetHeaders = headersResponse.data.values[0];

    if (!sheetHeaders || sheetHeaders.length === 0) {
      throw new Error(
        `No se pudieron obtener los encabezados de la hoja "${CATEGORIES_SHEET_NAME}".`
      );
    }

    const idColIndex = sheetHeaders.indexOf("ID");
    const nameColIndex = sheetHeaders.indexOf("Name");

    if (idColIndex === -1 || nameColIndex === -1) {
      throw new Error(
        `Encabezados 'ID' o 'Name' no encontrados en la hoja "${CATEGORIES_SHEET_NAME}" para añadir.`
      );
    }

    const newRow = Array(sheetHeaders.length).fill(""); // Crear un array con el tamaño de los encabezados
    newRow[idColIndex] = newId;
    newRow[nameColIndex] = name;

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: CATEGORIES_SHEET_NAME,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [newRow],
      },
    });

    if (appendResponse.status === 200) {
      return res
        .status(200)
        .json({ success: true, data: { id: newId, name: name, cards: [] } });
    } else {
      throw new Error("Error al añadir la categoría en Google Sheets.");
    }
  } catch (error) {
    console.error(
      "Error en la función Serverless (add-category):",
      error.message,
      error.stack
    );
    return res
      .status(500)
      .json({
        success: false,
        error: "Error en el servidor al añadir categoría: " + error.message,
      });
  }
}
