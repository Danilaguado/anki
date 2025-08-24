// ===== /src/App.js =====
// Lógica principal completamente reescrita para la nueva estructura.

import React, { useState, useEffect } from "react";
import SetupScreen from "./components/SetupScreen";
import Dashboard from "./components/Dashboard";
import QuizScreen from "./components/QuizScreen";
import ResultsScreen from "./components/ResultsScreen";
import "./index.css";

function App() {
  const [appState, setAppState] = useState("loading");
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({
    words: [],
    decks: [],
    sessions: [],
  });
  const [studyDeck, setStudyDeck] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Comprobar si hay un UserID guardado localmente
    let localUserId = localStorage.getItem("ankiUserId");
    if (!localUserId) {
      localUserId = `user-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("ankiUserId", localUserId);
    }
    setUserId(localUserId);

    // 2. Cargar los datos del usuario desde el backend
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/data?userId=${localUserId}`);
        if (!response.ok) {
          setAppState("setup");
          return;
        }
        const data = await response.json();
        if (data.success && data.userExists) {
          setUserData(data.data);
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
        body: JSON.stringify({ email, masterWords: words, userId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Error en la configuración.");
      setUserData({ words, decks: [], sessions: [] });
      setAppState("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeck = async (amount) => {
    const wordsToLearn = userData.words.filter(
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
          userId,
          wordIds: wordIdsToAdd,
          deckSize: wordsToAdd.length,
        }),
      });
      if (!response.ok)
        throw new Error("No se pudo crear el mazo en el servidor.");

      // Recargar datos para ver el nuevo mazo y los estados actualizados
      const dataRes = await fetch(`/api/data?userId=${userId}`);
      const data = await dataRes.json();
      if (data.success) setUserData(data.data);
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
      deckForQuiz = userData.words.filter(
        (word) => word.Estado === "Aprendiendo"
      );
    } else {
      deckForQuiz = userData.words.filter(
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
      deckId: "Custom",
      startTime: new Date().toISOString(),
    });
    setAppState("quiz");
  };

  const handleQuizComplete = (results) => {
    setSessionInfo((prev) => ({ ...prev, results }));
    setAppState("results");
  };

  const handleBackToDashboard = async (sentiment) => {
    setIsLoading(true);
    const finalSessionInfo = {
      ...sessionInfo,
      status: "Completada",
      duration: Date.now() - new Date(sessionInfo.startTime).getTime(),
    };
    try {
      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          results: sessionInfo.results,
          sentiment,
          sessionInfo: finalSessionInfo,
        }),
      });
      const response = await fetch(`/api/data?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setUserData(data.data);
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
            userData={userData}
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
            results={sessionInfo.results || []}
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
