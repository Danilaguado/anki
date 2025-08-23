import React, { useState, useRef } from "react";

const UploadIcon = () => (
  <svg
    className='w-8 h-8 mb-4 text-gray-500'
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
    // ... (código de parseo de CSV, sin cambios)
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
        const wasCorrect = data[resultIndex] === "true";
        const initialStatus = wasCorrect ? "Por Aprender" : "Aprendiendo";
        return {
          id: index + 1,
          english: data[englishIndex],
          spanish: data[spanishIndex],
          status: initialStatus,
          srsInterval: 1,
          srsNextReview: wasCorrect
            ? null
            : new Date().toISOString().split("T")[0],
          srsEaseFactor: 2.5,
          lastReviewDate: null,
          totalCorrect: wasCorrect ? 1 : 0,
          totalIncorrect: wasCorrect ? 0 : 1,
          avgResponseTime: null,
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
    <div className='w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8'>
      <h1 className='text-3xl font-bold text-center text-gray-900 mb-2'>
        Configuración de la App
      </h1>
      <p className='text-center text-gray-500 mb-8'>
        Importa tus resultados para empezar.
      </p>
      <div className='space-y-6'>
        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            1. Tu Correo Electrónico
          </label>
          <input
            type='email'
            id='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Para notificaciones y encuestas'
            className='w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            2. Archivo de Resultados (.csv)
          </label>
          <div
            className='flex justify-center items-center w-full p-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'
            onClick={() => !isParsingFile && fileInputRef.current.click()}
          >
            <div className='text-center'>
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
              {fileName && (
                <p className='text-blue-600 font-semibold mt-2 text-xs'>
                  {fileName}
                </p>
              )}
              {masterWords.length > 0 && (
                <p className='text-green-600 font-semibold mt-2'>
                  {masterWords.length} palabras cargadas.
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='.csv'
              className='hidden'
              onChange={handleFileChange}
              disabled={isParsingFile}
            />
          </div>
        </div>
        {(internalError || apiError) && (
          <p className='text-red-500 text-sm text-center'>
            {internalError || apiError}
          </p>
        )}
        <button
          onClick={handleSubmit}
          className='w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400'
          disabled={isParsingFile || isLoading}
        >
          {isLoading ? "Configurando..." : "Finalizar Configuración"}
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;
