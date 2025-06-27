// api/categories/update.js

import { google } from "googleapis";

const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M"; // ¡Asegúrate de que este ID sea correcto!
const CATEGORIES_SHEET_NAME = "Categories";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido. Solo se acepta PUT.",
    });
  }

  let { id, name } = req.body; // id de la categoría a actualizar y el nuevo nombre

  // Consola de depuración: muestra los valores recibidos
  console.log("Valores recibidos en req.body para actualizar categoría:", {
    id,
    name,
  });

  // Asegurarse de que id y name no sean undefined/null y aplicar trim
  id = id ? String(id).trim() : "";
  name = name ? String(name).trim() : "";

  // Consola de depuración: muestra los valores después de aplicar trim
  console.log(
    "Valores procesados para actualizar categoría (después de trim):",
    { id, name }
  );

  // Validar campos después de aplicar trim
  if (!id) {
    return res.status(400).json({
      success: false,
      error: "El ID de la categoría es requerido y no puede estar vacío.",
    });
  }
  if (!name) {
    return res.status(400).json({
      success: false,
      error:
        "El nuevo nombre de la categoría es requerido y no puede estar vacío.",
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
      // Podría indicar que la hoja está vacía o no existe
      return res
        .status(404)
        .json({
          success: false,
          error: `No hay datos o la hoja "${CATEGORIES_SHEET_NAME}" está vacía.`,
        });
    }

    const headers = categoriesData[0];
    const idColIndex = headers.indexOf("ID");
    const nameColIndex = headers.indexOf("Name");

    if (idColIndex === -1 || nameColIndex === -1) {
      // Si faltan encabezados, devuelve un error claro
      const missingHeaders = [];
      if (idColIndex === -1) missingHeaders.push("ID");
      if (nameColIndex === -1) missingHeaders.push("Name");
      return res.status(500).json({
        success: false,
        error: `Faltan encabezados requeridos (${missingHeaders.join(
          ", "
        )}) en la hoja "${CATEGORIES_SHEET_NAME}". Por favor, asegúrate de que las columnas 'ID' y 'Name' existan.`,
      });
    }

    let rowIndex = -1;
    for (let i = 1; i < categoriesData.length; i++) {
      if (categoriesData[i][idColIndex] === id) {
        rowIndex = i + 1; // +1 porque la API de Sheets es 1-indexada para filas, y getValues es 0-indexado sin encabezado
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({
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
      // Si la API de Sheets devuelve un error pero con status 200 (raro, pero posible)
      // O si el status no es 200, lanzar un error más detallado
      throw new Error(
        `Error inesperado al actualizar la categoría en Google Sheets. Estado: ${updateResponse.status}`
      );
    }
  } catch (error) {
    console.error(
      "Error en la función Serverless (update-category):",
      error.message,
      error.stack
    );
    return res.status(500).json({
      success: false,
      error:
        "Error interno del servidor al actualizar categoría: " + error.message,
    });
  }
}
