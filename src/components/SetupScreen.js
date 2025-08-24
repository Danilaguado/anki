// ===== /src/components/SetupScreen.js =====
// AHORA ACEPTA ARCHIVOS .CSV, .XLS Y .XLSX

import React, { useState, useRef } from "react";

const UploadIcon = () => (
  <svg
    className='upload-icon'
    aria-hidden='true'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 20 16'
  >
    <path
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
    />
  </svg>
);

const SetupScreen = ({ onSetupComplete, isLoading, error: apiError }) => {
  const [email, setEmail] = useState("");
  const [masterWords, setMasterWords] = useState([]);
  const [internalError, setInternalError] = useState("");
  const [fileName, setFileName] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef(null);

  const processDataArray = (dataArray) => {
    // Esta función procesa los datos una vez que están en formato de array de objetos
    const requiredHeaders = ["english", "correctanswer", "iscorrect"];
    const firstItemKeys =
      dataArray.length > 0
        ? Object.keys(dataArray[0]).map((k) => k.toLowerCase())
        : [];

    if (!requiredHeaders.every((rh) => firstItemKeys.includes(rh))) {
      setInternalError(
        `El archivo no tiene las columnas requeridas: english, correctAnswer, isCorrect`
      );
      return;
    }

    const parsedWords = dataArray
      .map((row, index) => {
        const wasCorrect = String(row.isCorrect).toLowerCase() === "true";
        const initialStatus = wasCorrect ? "Dominada" : "Por Aprender";

        return {
          id: index + 1,
          english: row.english,
          spanish: row.correctAnswer,
          status: initialStatus,
        };
      })
      .filter((word) => word && word.english && word.spanish);

    if (parsedWords.length > 0) {
      setMasterWords(parsedWords);
      setInternalError("");
    } else {
      setInternalError("No se pudieron extraer palabras válidas del archivo.");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsParsingFile(true);
    setInternalError("");
    setFileName(file.name);

    const reader = new FileReader();

    if (file.name.endsWith(".csv")) {
      reader.onload = (e) => {
        try {
          // Convertir CSV a array de objetos
          const text = e.target.result;
          const lines = text.trim().split("\n");
          const headers = lines[0]
            .trim()
            .toLowerCase()
            .split(",")
            .map((h) => h.replace(/"/g, ""));
          const data = lines.slice(1).map((line) => {
            const values = line.split(",");
            const obj = {};
            headers.forEach((header, i) => {
              obj[header] = values[i].replace(/"/g, "").trim();
            });
            return obj;
          });
          processDataArray(data);
        } catch (err) {
          setInternalError("Ocurrió un error al procesar el archivo CSV.");
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
      if (typeof XLSX === "undefined") {
        setInternalError(
          "La biblioteca para leer Excel no está cargada. Asegúrate de añadir el script a tu HTML."
        );
        setIsParsingFile(false);
        return;
      }
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, {
            // Renombrar cabeceras para que coincidan con el CSV
            header: ["english", "correctAnswer", "isCorrect"],
            range: 1, // Empezar a leer desde la segunda fila (saltar encabezados)
          });
          processDataArray(json);
        } catch (err) {
          setInternalError("Ocurrió un error al procesar el archivo Excel.");
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setInternalError("Por favor, sube un archivo .csv o .xls/.xlsx");
      setIsParsingFile(false);
    }
  };

  const handleSubmit = () => {
    if (!email.includes("@")) {
      setInternalError("Por favor, introduce un email válido.");
      return;
    }
    if (masterWords.length === 0) {
      setInternalError(
        "Por favor, sube el archivo con los resultados de tu quiz."
      );
      return;
    }
    onSetupComplete(email, masterWords);
  };

  return (
    <div className='screen-container'>
      <h1>Configuración de la App</h1>
      <p className='subtitle'>Importa tus resultados para empezar.</p>
      <div className='form-container'>
        <div className='form-group'>
          <label htmlFor='email'>1. Tu Correo Electrónico</label>
          <input
            type='email'
            id='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Para notificaciones y encuestas'
            className='input-field'
          />
        </div>
        <div className='form-group'>
          <label>2. Archivo de Resultados (.csv, .xls, .xlsx)</label>
          <div
            className='file-upload-area'
            onClick={() => !isParsingFile && fileInputRef.current.click()}
          >
            <div className='file-upload-content'>
              {isParsingFile ? (
                <p>Procesando...</p>
              ) : (
                <>
                  <UploadIcon />
                  <p>
                    <span className='font-semibold'>Haz clic para subir</span>
                  </p>
                </>
              )}
              {fileName && <p className='file-name'>{fileName}</p>}
              {masterWords.length > 0 && (
                <p className='words-loaded'>
                  {masterWords.length} palabras cargadas.
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='.csv,.xls,.xlsx'
              className='hidden-input'
              onChange={handleFileChange}
              disabled={isParsingFile}
            />
          </div>
        </div>
        {(internalError || apiError) && (
          <p className='error-message'>{internalError || apiError}</p>
        )}
        <button
          onClick={handleSubmit}
          className='button button-primary'
          disabled={isParsingFile || isLoading}
        >
          {isLoading ? "Configurando..." : "Finalizar Configuración"}
        </button>
      </div>
    </div>
  );
};
export default SetupScreen;
