// ===== /src/App.js =====
// Lógica principal actualizada para manejar el estado y las llamadas a la API correctamente.

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/data");
        if (!response.ok) {
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
      setMasterWords(words);
      setAppState("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeck = async (amount) => {
    // CORRECCIÓN: Ahora filtramos por las palabras que están listas para aprender
    const wordsToLearn = masterWords.filter(
      (word) => word.Estado === "Por Aprender"
    );
    if (wordsToLearn.length === 0) {
      alert(
        "¡Felicidades! Has añadido todas las palabras a tu mazo de estudio."
      );
      return;
    }

    const wordsToAdd = wordsToLearn.slice(0, amount);
    const wordIdsToAdd = wordsToAdd.map((w) => w.ID_Palabra);

    setIsLoading(true);
    try {
      const response = await fetch("/api/create-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordIds: wordIdsToAdd }),
      });
      if (!response.ok)
        throw new Error("No se pudo crear el mazo en el servidor.");

      // Actualizar el estado local para reflejar el cambio inmediatamente
      const updatedMasterWords = masterWords.map((word) =>
        wordIdsToAdd.includes(word.ID_Palabra)
          ? { ...word, Estado: "Aprendiendo" }
          : word
      );
      setMasterWords(updatedMasterWords);
      alert(`${wordsToAdd.length} nuevas palabras añadidas a tu estudio.`);
    } catch (err) {
      alert(`Error al crear el mazo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
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
    setLastResults(results);
    try {
      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, sentiment }),
      });
      // Volver a cargar los datos para reflejar las actualizaciones del SRS
      const response = await fetch("/api/data");
      const data = await response.json();
      if (data.success) {
        setMasterWords(data.words);
      }
    } catch (err) {
      console.error("Error al guardar los resultados:", err);
    } finally {
      setIsLoading(false);
      setAppState("results");
    }
  };

  const handleBackToDashboard = () => {
    setAppState("dashboard");
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
            onBackToDashboard={handleBackToDashboard}
          />
        );
      case "loading":
      default:
        return <div className='loading-spinner'>Cargando...</div>;
    }
  };

  return <div className='app-container'>{renderCurrentState()}</div>;
}

export default App;
