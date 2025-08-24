// ===== /src/components/SetupScreen.js =====
// Lógica corregida para interpretar el CSV inicial y asignar el estado correcto.

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

  const parseQuizResultsCSV = (csvText) => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      setInternalError("El archivo CSV está vacío o no tiene datos.");
      return;
    }
    const headers = lines[0]
      .trim()
      .toLowerCase()
      .split(",")
      .map((h) => h.replace(/"/g, ""));
    const requiredHeaders = ["english", "correctanswer", "iscorrect"];
    if (!requiredHeaders.every((rh) => headers.includes(rh))) {
      setInternalError(
        `El archivo CSV no tiene las columnas requeridas: english, correctAnswer, isCorrect`
      );
      return;
    }
    const englishIndex = headers.indexOf("english");
    const spanishIndex = headers.indexOf("correctanswer");
    const resultIndex = headers.indexOf("iscorrect");
    const parsedWords = lines
      .slice(1)
      .map((line, index) => {
        const data = line.split(",").map((d) => d.replace(/"/g, "").trim());
        const wasCorrect = data[resultIndex].toLowerCase() === "true";

        // CORRECCIÓN CLAVE:
        // Las palabras que fallaste ('isCorrect' es false) son las que están 'Por Aprender'.
        // Las que acertaste ya se consideran 'Dominadas' y no se usarán para crear mazos.
        const initialStatus = wasCorrect ? "Dominada" : "Por Aprender";

        return {
          id: index + 1,
          english: data[englishIndex],
          spanish: data[spanishIndex],
          status: initialStatus,
        };
      })
      .filter((word) => word && word.english && word.spanish);

    if (parsedWords.length > 0) {
      setMasterWords(parsedWords);
      setInternalError("");
    } else {
      setInternalError(
        "No se pudieron extraer palabras válidas del archivo CSV."
      );
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsParsingFile(true);
    setInternalError("");
    setFileName(file.name);
    if (file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          parseQuizResultsCSV(e.target.result);
        } catch (err) {
          setInternalError("Ocurrió un error al procesar el archivo.");
          console.error(err);
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.readAsText(file);
    } else {
      setInternalError("Por favor, sube un archivo .csv generado por el quiz.");
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
        "Por favor, sube el archivo CSV con los resultados de tu quiz."
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
          <label>2. Archivo de Resultados (.csv)</label>
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
              accept='.csv'
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
