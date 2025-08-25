// ===== /src/App.js =====
// Ahora envía los resultados de voz al backend al finalizar la sesión.

import React, { useState, useEffect } from "react";
import SetupScreen from "./components/SetupScreen";
import Dashboard from "./components/Dashboard";
import QuizScreen from "./components/QuizScreen";
import ResultsScreen from "./components/ResultsScreen";
import "./index.css";

function App() {
  const [appState, setAppState] = useState("loading");
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({ words: [] });
  const [studyDeck, setStudyDeck] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let localUserId = localStorage.getItem("ankiUserId");
    if (!localUserId) {
      const timestampPart = (Date.now() % 1000000).toString(36);
      const randomPart = Math.random().toString(36).substr(2, 5);
      localUserId = `user-${timestampPart}${randomPart}`;
      localStorage.setItem("ankiUserId", localUserId);
    }
    setUserId(localUserId);

    const fetchData = async () => {
      if (!localUserId) return;
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
  }, [userId]);

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

      const initialUserData = {
        words: words.map((w) => ({
          ...w,
          UserID: userId,
          Estado: w.status,
          Intervalo_SRS: 1,
          Fecha_Proximo_Repaso: null,
          Factor_Facilidad: 2.5,
          Total_Aciertos: 0,
          Total_Errores: 0,
          Total_Voz_Aciertos: 0, // Añadido para consistencia
          Total_Voz_Errores: 0, // Añadido para consistencia
        })),
      };
      setUserData(initialUserData);
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
      await fetch("/api/create-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, wordIds: wordIdsToAdd }),
      });

      const updatedWords = userData.words.map((word) =>
        wordIdsToAdd.includes(word.ID_Palabra)
          ? { ...word, Estado: "Aprendiendo" }
          : word
      );
      setUserData((prev) => ({ ...prev, words: updatedWords }));
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
    setSessionInfo({ startTime: new Date().toISOString() });
    setAppState("quiz");
  };

  // --- CORRECCIÓN: Ahora recibe voiceResults del QuizScreen ---
  const handleQuizComplete = (results, voiceResults) => {
    setSessionInfo((prev) => ({ ...prev, results, voiceResults }));
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
        // --- CORRECCIÓN: Se envían los resultados de voz al backend ---
        body: JSON.stringify({
          userId,
          results: sessionInfo.results,
          voiceResults: sessionInfo.voiceResults, // Nuevo
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
