// ===== /src/App.js =====
// Lógica principal actualizada para la nueva estructura de datos.

import React, { useState, useEffect } from "react";
import SetupScreen from "./components/SetupScreen";
import Dashboard from "./components/Dashboard";
import QuizScreen from "./components/QuizScreen";
import ResultsScreen from "./components/ResultsScreen";
import "./index.css";

function App() {
  const [appState, setAppState] = useState("loading");
  const [userEmail, setUserEmail] = useState("");
  const [masterWords, setMasterWords] = useState([]);
  const [studyDeck, setStudyDeck] = useState([]);
  const [lastResults, setLastResults] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({});
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
        if (data.success && data.words.length > 0) {
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
        body: JSON.stringify({
          wordIds: wordIdsToAdd,
          deckSize: wordsToAdd.length,
        }),
      });
      if (!response.ok)
        throw new Error("No se pudo crear el mazo en el servidor.");
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

  const handleStartQuiz = (isPracticeMode = false) => {
    const today = new Date().toISOString().split("T")[0];
    let deckForQuiz;

    if (isPracticeMode) {
      // Modo Práctica: Todas las palabras en estudio, sin importar la fecha de repaso.
      deckForQuiz = masterWords.filter((word) => word.Estado === "Aprendiendo");
    } else {
      // Modo Repaso Diario: Solo las que tocan hoy.
      deckForQuiz = masterWords.filter(
        (word) =>
          word.Estado === "Aprendiendo" &&
          (!word.Fecha_Proximo_Repaso || word.Fecha_Proximo_Repaso <= today)
      );
    }

    if (deckForQuiz.length === 0) {
      alert(
        isPracticeMode
          ? "No tienes palabras en estudio para practicar."
          : "No tienes palabras para repasar hoy."
      );
      return;
    }
    const shuffledDeck = [...deckForQuiz].sort(() => Math.random() - 0.5);
    setStudyDeck(shuffledDeck);
    setSessionInfo({
      deckId: "Custom", // En un futuro, se podría asociar a un ID de mazo específico
      startTime: new Date().toISOString(),
    });
    setAppState("quiz");
  };

  const handleQuizComplete = (results) => {
    setLastResults(results);
    setAppState("results");
  };

  const handleBackToDashboard = async (results, sentiment) => {
    setIsLoading(true);
    const finalSessionInfo = {
      ...sessionInfo,
      status: "Completada", // Asumimos que se completa
      duration: Date.now() - new Date(sessionInfo.startTime).getTime(),
    };
    try {
      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results,
          sentiment,
          sessionInfo: finalSessionInfo,
        }),
      });
      const response = await fetch("/api/data");
      const data = await response.json();
      if (data.success) {
        setMasterWords(data.words);
      }
    } catch (err) {
      console.error("Error al guardar los resultados:", err);
    } finally {
      setIsLoading(false);
      setAppState("dashboard");
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
