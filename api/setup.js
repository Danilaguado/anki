// ===== /api/setup.js =====
// Ahora crea la estructura de hojas normalizada.

import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ success: false, message: 'Method Not Allowed' }); }
  const { email, masterWords } = req.body;
  if (!email || !masterWords) { return res.status(400).json({ success: false, message: 'Email and words are required.' }); }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheetInfo.data.sheets.map(s => s.properties.title);

    const sheetsToEnsure = [
      { title: 'Master_Palabras', headers: ['ID_Palabra', 'Inglés', 'Español', 'Estado', 'Intervalo_SRS', 'Fecha_Proximo_Repaso', 'Factor_Facilidad', 'Fecha_Ultimo_Repaso', 'Total_Aciertos', 'Total_Errores', 'Tiempo_Respuesta_Promedio_ms'] },
      { title: 'Decks', headers: ['ID_Mazo', 'Fecha_Creacion', 'Cantidad_Palabras', 'Palabras_IDs'] },
      { title: 'Study_Sessions', headers: ['ID_Sesion', 'ID_Mazo', 'Timestamp_Inicio', 'Timestamp_Fin', 'Duracion_Total_ms', 'Estado_Final', 'Sentimiento_Reportado'] },
      { title: 'Log_Estudio', headers: ['ID_Sesion', 'ID_Palabra', 'Resultado', 'Tiempo_Respuesta_ms', 'SRS_Feedback'] },
      { title: 'Configuración', headers: ['Clave', 'Valor'] },
    ];

    const newSheetsToCreate = sheetsToEnsure.filter(s => !existingSheets.includes(s.title));
    if (newSheetsToCreate.length > 0) {
      const requests = newSheetsToCreate.map(sheet => ({ addSheet: { properties: { title: sheet.title } } }));
      await sheets.spreadsheets.batchUpdate({ spreadsheetId, resource: { requests } });
    }

    if (!existingSheets.includes('Configuración')) {
      const dataToWrite = [];
      dataToWrite.push({ range: 'Configuración!A1', values: [['Clave', 'Valor'], ['Email de Usuario', email], ['Próximo ID de Mazo', 1]] });
      
      const masterWordsHeaders = sheetsToEnsure.find(s => s.title === 'Master_Palabras').headers;
      const masterWordsRows = masterWords.map(word => [
          word.id, word.english, word.spanish, word.status, 1, null, 2.5, null, 0, 0, null
      ]);
      dataToWrite.push({ range: 'Master_Palabras!A1', values: [masterWordsHeaders, ...masterWordsRows] });

      // Escribir encabezados en las nuevas hojas
      sheetsToEnsure.forEach(sheet => {
        if (sheet.title !== 'Master_Palabras' && sheet.title !== 'Configuración') {
            dataToWrite.push({ range: `${sheet.title}!A1`, values: [sheet.headers] });
        }
      });

      await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          resource: { valueInputOption: 'USER_ENTERED', data: dataToWrite },
      });
    }

    res.status(200).json({ success: true, message: 'Google Sheet configurado exitosamente.' });
  } catch (error) {
    console.error('Error al configurar Google Sheet:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al configurar la hoja de cálculo.', error: error.message });
  }
}

// ===== /api/create-deck.js =====
// Ahora crea una entrada en la nueva hoja 'Decks'.

import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ success: false, message: 'Method Not Allowed' }); }
  const { wordIds, deckSize } = req.body;
  if (!wordIds || !deckSize) { return res.status(400).json({ success: false, message: 'IDs de palabras y tamaño del mazo son requeridos.' }); }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // 1. Obtener el próximo ID de Mazo desde 'Configuración'
    const configRange = 'Configuración!B2';
    const configResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: configRange });
    const nextDeckIdNum = parseInt(configResponse.data.values[0][0], 10);
    const newDeckId = `Mazo-${nextDeckIdNum}`;

    // 2. Crear la nueva fila para la hoja 'Decks'
    const newDeckRow = [
        newDeckId,
        new Date().toISOString(),
        deckSize,
        wordIds.join(',')
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Decks!A:D',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [newDeckRow] }
    });

    // 3. Actualizar el estado de las palabras en 'Master_Palabras'
    const masterRange = 'Master_Palabras!A:D';
    const masterResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: masterRange });
    const masterRows = masterResponse.data.values || [];
    const dataToUpdate = [];
    masterRows.forEach((row, index) => {
        if (wordIds.includes(row[0])) { // Compara con ID_Palabra en columna A
            dataToUpdate.push({ range: `Master_Palabras!D${index + 1}`, values: [['Aprendiendo']] });
        }
    });

    if (dataToUpdate.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            resource: { valueInputOption: 'USER_ENTERED', data: dataToUpdate },
        });
    }

    // 4. Incrementar el 'Próximo ID de Mazo' en 'Configuración'
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: configRange,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[nextDeckIdNum + 1]] }
    });

    res.status(200).json({ success: true, message: `${newDeckId} creado con ${deckSize} palabras.` });
  } catch (error) {
    console.error('Error al crear el mazo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al crear el mazo.', error: error.message });
  }
}


// ===== /api/update.js =====
// Lógica SRS movida aquí. Ahora también guarda en Study_Sessions y Log_Estudio.

import { google } from 'googleapis';

function calculateNextReview(word, srsFeedback) {
    let interval = parseInt(word.Intervalo_SRS, 10) || 1;
    let easeFactor = parseFloat(word.Factor_Facilidad) || 2.5;
    if (srsFeedback === 'again') {
        interval = 1;
        easeFactor -= 0.2;
    } else {
        if (srsFeedback === 'hard') { interval = Math.round(interval * 1.2); easeFactor -= 0.15; }
        else if (srsFeedback === 'good') { interval = Math.round(interval * easeFactor); }
        else if (srsFeedback === 'easy') { interval = Math.round(interval * easeFactor * 1.3); easeFactor += 0.15; }
    }
    easeFactor = Math.max(1.3, easeFactor);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    return {
        newInterval: interval, newEaseFactor: easeFactor.toFixed(2),
        nextReviewDate: nextReviewDate.toISOString().split('T')[0],
    };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ success: false, message: 'Method Not Allowed' }); }
  const { results, sentiment, sessionInfo } = req.body;
  if (!results || !sessionInfo) { return res.status(400).json({ success: false, message: 'Results and session info are required.' }); }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sessionId = `Sesion-${Date.now()}`;

    // 1. Guardar la sesión en 'Study_Sessions'
    const sessionRow = [
        sessionId, sessionInfo.deckId, sessionInfo.startTime, new Date().toISOString(),
        sessionInfo.duration, sessionInfo.status, sentiment
    ];
    await sheets.spreadsheets.values.append({
        spreadsheetId, range: 'Study_Sessions!A:G', valueInputOption: 'USER_ENTERED',
        resource: { values: [sessionRow] }
    });

    // 2. Guardar cada respuesta en 'Log_Estudio'
    const logRows = results.map(r => [
        sessionId, r.wordId, r.isCorrect ? 'Correcto' : 'Incorrecto',
        r.responseTime, r.srsFeedback
    ]);
    if (logRows.length > 0) {
        await sheets.spreadsheets.values.append({
            spreadsheetId, range: 'Log_Estudio!A:E', valueInputOption: 'USER_ENTERED',
            resource: { values: logRows }
        });
    }

    // 3. Actualizar 'Master_Palabras' con SRS y estadísticas
    const masterRange = 'Master_Palabras!A:L';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: masterRange });
    const rows = response.data.values || [];
    const headers = rows[0];
    const dataToUpdate = [];
    const today = new Date().toISOString().split('T')[0];

    results.forEach(result => {
        const rowIndex = rows.findIndex(row => row[headers.indexOf('ID_Palabra')] === result.wordId);
        if (rowIndex > -1) {
            const wordData = {};
            headers.forEach((header, i) => wordData[header] = rows[rowIndex][i]);
            const { newInterval, newEaseFactor, nextReviewDate } = calculateNextReview(wordData, result.srsFeedback);
            
            dataToUpdate.push({ range: `Master_Palabras!E${rowIndex + 1}`, values: [[newInterval]] });
            dataToUpdate.push({ range: `Master_Palabras!F${rowIndex + 1}`, values: [[nextReviewDate]] });
            dataToUpdate.push({ range: `Master_Palabras!G${rowIndex + 1}`, values: [[newEaseFactor]] });
            dataToUpdate.push({ range: `Master_Palabras!H${rowIndex + 1}`, values: [[today]] });
            
            const currentAciertos = parseInt(wordData.Total_Aciertos, 10) || 0;
            const currentErrores = parseInt(wordData.Total_Errores, 10) || 0;
            if (result.isCorrect) {
                 dataToUpdate.push({ range: `Master_Palabras!I${rowIndex + 1}`, values: [[currentAciertos + 1]] });
            } else {
                 dataToUpdate.push({ range: `Master_Palabras!J${rowIndex + 1}`, values: [[currentErrores + 1]] });
            }
        }
    });

    if (dataToUpdate.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            resource: { valueInputOption: 'USER_ENTERED', data: dataToUpdate },
        });
    }

    res.status(200).json({ success: true, message: 'Resultados guardados y SRS actualizado.' });
  } catch (error) {
    console.error('Error al actualizar Google Sheet:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al guardar los resultados.', error: error.message });
  }
}
