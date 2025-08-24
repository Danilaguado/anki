import React, { useState, useEffect } from "react";
import SetupScreen from "./components/SetupScreen";
import Dashboard from "./components/Dashboard";
import QuizScreen from "./components/QuizScreen";
import ResultsScreen from "./components/ResultsScreen";

function App() {
  const [appState, setAppState] = useState("loading"); // loading, setup, dashboard, quiz, results
  const [userEmail, setUserEmail] = useState("");
  const [masterWords, setMasterWords] = useState([]);
  const [studyDeck, setStudyDeck] = useState([]);
  const [lastResults, setLastResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Al cargar la app, intenta obtener los datos de Google Sheets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/data");
        if (response.status === 404 || response.status === 500) {
          // Asume que no está configurado si hay un error al obtener datos
          setAppState("setup");
          return;
        }
        const data = await response.json();
        if (data.success) {
          setUserEmail(data.config["Email de Usuario"]);
          setMasterWords(data.words);
          setAppState("dashboard");
        } else {
          setAppState("setup");
        }
      } catch (err) {
        setAppState("setup");
      }
    };
    fetchData();
  }, []);

  const handleSetupComplete = async (email, words) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, masterWords: words }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Error en la configuración.");
      setUserEmail(email);
      setMasterWords(words); // Usamos las palabras procesadas localmente
      setAppState("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeck = (amount) => {
    // Lógica para registrar esta decisión (futuro)
    const newWords = masterWords
      .filter((word) => word.Estado === "Por Aprender")
      .slice(0, amount);
    if (newWords.length === 0) {
      alert("¡Felicidades! No hay palabras nuevas por aprender.");
      return;
    }
    const updatedMasterWords = masterWords.map((word) =>
      newWords.find((nw) => nw.ID_Palabra === word.ID_Palabra)
        ? { ...word, Estado: "Aprendiendo" }
        : word
    );
    setMasterWords(updatedMasterWords);
    // TODO: Enviar esta actualización a Google Sheets
    alert(`${newWords.length} nuevas palabras añadidas a tu estudio.`);
  };

  const handleStartQuiz = () => {
    const today = new Date().toISOString().split("T")[0];
    const deckForQuiz = masterWords.filter(
      (word) =>
        word.Estado === "Aprendiendo" &&
        (!word.Fecha_Proximo_Repaso || word.Fecha_Proximo_Repaso <= today)
    );
    if (deckForQuiz.length === 0) {
      alert(
        "No tienes palabras para repasar hoy. ¡Crea un nuevo mazo o espera a mañana!"
      );
      return;
    }
    const shuffledDeck = [...deckForQuiz].sort(() => Math.random() - 0.5);
    setStudyDeck(shuffledDeck);
    setAppState("quiz");
  };

  const handleQuizComplete = async (results, sentiment) => {
    setIsLoading(true);
    // TODO: Actualizar el estado local de masterWords con los resultados del SRS
    setLastResults(results);
    try {
      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, sentiment }),
      });
    } catch (err) {
      console.error("Error al guardar los resultados:", err);
    } finally {
      setIsLoading(false);
      setAppState("results");
    }
  };

  const renderCurrentState = () => {
    switch (appState) {
      case "setup":
        return (
          <SetupScreen
            onSetupComplete={handleSetupComplete}
            isLoading={isLoading}
            error={error}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            masterWords={masterWords}
            onStartQuiz={handleStartQuiz}
            onCreateDeck={handleCreateDeck}
          />
        );
      case "quiz":
        return (
          <QuizScreen deck={studyDeck} onQuizComplete={handleQuizComplete} />
        );
      case "results":
        return (
          <ResultsScreen
            results={lastResults}
            onBackToDashboard={() => setAppState("dashboard")}
          />
        );
      case "loading":
      default:
        return <div>Cargando...</div>;
    }
  };

  return (
    <div className='bg-gray-100 min-h-screen flex items-center justify-center p-4 font-sans'>
      {renderCurrentState()}
    </div>
  );
}

export default App;
