// ===== /src/App.js - CORREGIDO para enviar datos completos =====
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import SetupScreen from "./components/SetupScreen";
import Dashboard from "./components/Dashboard";
import QuizScreen from "./components/QuizScreen";
import ResultsScreen from "./components/ResultsScreen";
import DeckWrapper from "./components/DeckWrapper";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

import "./index.css";

// CORRECCIÓN: Función para generar IDs con prefijo user_
const generateShortUserId = () => {
  const timestamp = (Date.now() % 1000000).toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `user_${timestamp}${random}`;
};

// Componente temporal para las rutas en desarrollo
const ComingSoon = ({ activityName, deckId }) => {
  const navigate = useNavigate();
  return (
    <div className='screen-container'>
      <h1>{activityName}</h1>
      <p className='subtitle'>Mazo: {deckId}</p>
      <p>Esta sección está en desarrollo...</p>
      <button onClick={() => navigate("/")} className='button button-secondary'>
        Volver al Panel
      </button>
    </div>
  );
};

// Rutas placeholder para cada actividad de mazo
const HistoryActivity = () => {
  const { deckId } = useParams();
  return <ComingSoon activityName='Historia' deckId={deckId} />;
};

const LearnActivity = () => {
  const { deckId } = useParams();
  return <ComingSoon activityName='Aprender' deckId={deckId} />;
};

const QuizActivity = () => {
  const { deckId } = useParams();
  return <ComingSoon activityName='Quiz' deckId={deckId} />;
};

// App principal
const AppContent = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({ words: [], decks: [] });
  const [studyDeck, setStudyDeck] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // NUEVO: Estado para tracking de actividad
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [dailySessionCount, setDailySessionCount] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Generar o recuperar userId
        let localUserId = localStorage.getItem("ankiUserId");
        if (!localUserId || !localUserId.startsWith("user_")) {
          localUserId = generateShortUserId();
          localStorage.setItem("ankiUserId", localUserId);
          console.log(`[APP] Nuevo userId generado: ${localUserId}`);
        } else {
          console.log(`[APP] userId recuperado: ${localUserId}`);
        }
        setUserId(localUserId);

        // 2. Verificar si el usuario existe en el backend
        console.log(`[APP] Verificando existencia del usuario...`);
        const response = await fetch(`/api/data?userId=${localUserId}`);
        const data = await response.json();

        console.log(`[APP] Respuesta del backend:`, data);

        if (response.ok && data.success && data.userExists) {
          console.log(`[APP] Usuario existe, cargando datos...`);
          setUserData(data.data);
          registerDailyActivity();
          setIsLoading(false);
        } else {
          console.log(`[APP] Usuario no existe, redirigiendo al setup...`);
          setIsLoading(false);
          navigate("/setup");
        }
      } catch (err) {
        console.error("[APP] Error al inicializar:", err);
        setIsLoading(false);
        navigate("/setup");
      }
    };

    initializeApp();
  }, [navigate]);

  // CORRECCIÓN: Función para registrar actividad diaria mejorada
  const registerDailyActivity = async () => {
    const today = new Date().toISOString().split("T")[0];
    const lastVisit = localStorage.getItem("lastVisit");

    if (lastVisit !== today) {
      localStorage.setItem("lastVisit", today);
      localStorage.setItem("dailySessionCount", "1");
      setDailySessionCount(1);

      // CORRECCIÓN: Usar la estructura correcta de datos
      try {
        await fetch("/api/track-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: localStorage.getItem("ankiUserId"),
            action: "daily_checkin",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("Error registrando actividad diaria:", error);
      }
    } else {
      const currentCount = parseInt(
        localStorage.getItem("dailySessionCount") || "0"
      );
      const newCount = currentCount + 1;
      localStorage.setItem("dailySessionCount", newCount.toString());
      setDailySessionCount(newCount);
    }
  };

  // Función para refrescar los datos del usuario
  const refreshUserData = async () => {
    if (!userId) return;
    try {
      console.log(`[APP] Refrescando datos para userId: ${userId}`);
      const response = await fetch(`/api/data?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.userExists) {
          console.log(`[APP] Datos refrescados exitosamente`);
          setUserData(data.data);
        }
      }
    } catch (err) {
      console.error("Error al refrescar datos:", err);
    }
  };

  const handleSetupComplete = async (email, words) => {
    setIsLoading(true);
    setError("");

    console.log(`[APP] Iniciando setup para userId: ${userId}`);
    console.log(`[APP] Email: ${email}, Palabras: ${words.length}`);

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          masterWords: words,
          userId,
        }),
      });

      const data = await response.json();
      console.log(`[APP] Respuesta del setup:`, data);

      if (!response.ok) {
        throw new Error(data.message || "Error en la configuración.");
      }

      const initialUserData = {
        words: words.map((w) => ({
          ID_Palabra: w.id,
          Inglés: w.english,
          Español: w.spanish,
          UserID: userId,
          Estado: w.status || "Por Aprender",
          Intervalo_SRS: 1,
          Fecha_Proximo_Repaso: null,
          Factor_Facilidad: 2.5,
          Total_Aciertos: 0,
          Total_Errores: 0,
          Total_Voz_Aciertos: 0,
          Total_Voz_Errores: 0,
        })),
        decks: [],
      };

      console.log(`[APP] Setup completado, estableciendo datos iniciales`);
      setUserData(initialUserData);

      setTimeout(() => {
        setIsLoading(false);
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error("[APP] Error en handleSetupComplete:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleCreateDeck = async (amount = 10) => {
    const wordsToLearn = userData.words.filter(
      (word) => word.Estado === "Por Aprender"
    );

    if (wordsToLearn.length === 0) {
      alert(
        "¡Felicidades! Has añadido todas las palabras disponibles a mazos de estudio."
      );
      return;
    }

    const shuffledWords = [...wordsToLearn].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(
      0,
      Math.min(amount, shuffledWords.length)
    );
    const wordIdsToAdd = selectedWords.map((w) => w.ID_Palabra);

    setIsLoading(true);
    try {
      const response = await fetch("/api/create-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, wordIds: wordIdsToAdd }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedWords = userData.words.map((word) =>
          wordIdsToAdd.includes(word.ID_Palabra)
            ? { ...word, Estado: "Aprendiendo" }
            : word
        );

        const newDeck = {
          ID_Mazo: result.deckId,
          UserID: userId,
          Fecha_Creacion: new Date().toISOString(),
          Cantidad_Palabras: selectedWords.length,
          Estado: "Activo",
        };

        setUserData((prev) => ({
          ...prev,
          words: updatedWords,
          decks: [...(prev.decks || []), newDeck],
        }));

        alert(
          `¡Éxito! Se creó "${result.deckId}" con ${selectedWords.length} palabras nuevas.`
        );

        setTimeout(() => {
          refreshUserData();
        }, 500);
      } else {
        throw new Error(result.message || "Error al crear el mazo");
      }
    } catch (err) {
      console.error("Error al crear el mazo:", err);
      alert(`Error al crear el mazo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async (isPracticeMode = false) => {
    // CORRECCIÓN: Registrar inicio de sesión CORRECTAMENTE
    setSessionStartTime(new Date().toISOString());

    try {
      const response = await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          action: "start_session",
          sessionData: {
            deckId: isPracticeMode ? "practice-mode" : "review-mode",
            startTime: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error("Error iniciando sesión:", result.message);
        alert("Error al iniciar la sesión de estudio.");
        return;
      }

      console.log(`[APP] Sesión iniciada con ID: ${result.sessionId}`);

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
        // Si no hay palabras, abandonar la sesión inmediatamente
        await fetch("/api/track-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            action: "abandon_session",
            sessionData: { sessionId: result.sessionId },
          }),
        });

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
        sessionId: result.sessionId, // IMPORTANTE: Guardar el sessionId
        startTime: new Date().toISOString(),
        isPracticeMode,
        originalDeckSize: shuffledDeck.length,
      });
      navigate("/quiz");
    } catch (error) {
      console.error("Error al iniciar quiz:", error);
      alert("Error al iniciar la sesión de estudio.");
    }
  };

  const handleQuizComplete = (results, voiceResults, finalStats) => {
    // CORRECCIÓN: Asegurar que el sessionId se preserve
    setSessionInfo((prev) => ({
      ...prev,
      results,
      voiceResults,
      finalStats: {
        ...finalStats,
        sessionId: prev.sessionId, // Preservar sessionId del inicio
      },
      endTime: new Date().toISOString(),
    }));
    navigate("/results");
  };

  const handleBackToDashboard = async (sentiment) => {
    setIsLoading(true);

    try {
      console.log("[APP] Finalizando sesión con datos:", {
        sessionId: sessionInfo.sessionId,
        sentiment: sentiment,
        sessionDuration: sessionInfo.finalStats?.sessionDuration,
        correctAnswers: sessionInfo.finalStats?.correctAnswers,
        totalAnswers: sessionInfo.finalStats?.totalAnswers,
        accuracy: sessionInfo.finalStats?.accuracy,
      });

      // CORRECCIÓN: Enviar datos completos y estructurados correctamente
      const response = await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          action: "end_session",
          finalResults: {
            sessionId: sessionInfo.sessionId, // Usar sessionId del estado
            sentiment: sentiment, // ESTE es el sentimiento del usuario sobre la sesión
            sessionDuration: sessionInfo.finalStats?.sessionDuration || 0,
            correctAnswers: sessionInfo.finalStats?.correctAnswers || 0,
            totalAnswers: sessionInfo.finalStats?.totalAnswers || 0,
            accuracy: sessionInfo.finalStats?.accuracy || "0",
          },
        }),
      });

      const result = await response.json();
      console.log("[APP] Respuesta de finalización:", result);

      if (!response.ok) {
        throw new Error(result.message || "Error al finalizar la sesión");
      }

      // Refrescar los datos del usuario para actualizar el panel
      await refreshUserData();
    } catch (err) {
      console.error("Error al guardar y finalizar la sesión:", err);
      alert("Error al guardar la sesión. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
      navigate("/");
    }
  };

  // NUEVA: Función para manejar abandono de sesión desde cualquier parte
  const handleAbandonSession = async () => {
    if (sessionInfo.sessionId) {
      try {
        await fetch("/api/track-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            action: "abandon_session",
            sessionData: { sessionId: sessionInfo.sessionId },
          }),
        });
      } catch (error) {
        console.error("Error registrando abandono de sesión:", error);
      }
    }
  };

  // Loading inicial
  if (isLoading && !userId) {
    return (
      <div className='loading-container'>
        <div className='loading-content'>
          <h2>Cargando aplicación...</h2>
          <p>Inicializando sistema de aprendizaje</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Setup */}
      <Route
        path='/setup'
        element={
          <SetupScreen
            onSetupComplete={handleSetupComplete}
            isLoading={isLoading}
            error={error}
            userId={userId}
          />
        }
      />

      {/* Dashboard principal */}
      <Route
        path='/'
        element={
          <Dashboard
            userData={userData}
            onStartQuiz={handleStartQuiz}
            onCreateDeck={handleCreateDeck}
            userId={userId}
            dailySessionCount={dailySessionCount}
          />
        }
      />

      {/* Dashboard de Analytics */}
      <Route
        path='/analytics'
        element={<AnalyticsDashboard userId={userId} />}
      />

      {/* Rutas de actividades de mazo */}
      <Route path='/deck/:deckId/history' element={<HistoryActivity />} />
      <Route path='/deck/:deckId/learn' element={<LearnActivity />} />
      <Route path='/deck/:deckId/quiz' element={<QuizActivity />} />
      <Route path='/deck/:deckId/cards' element={<DeckWrapper />} />

      {/* Quiz y resultados */}
      <Route
        path='/quiz'
        element={
          <QuizScreen
            deck={studyDeck}
            onQuizComplete={handleQuizComplete}
            onGoBack={() => {
              handleAbandonSession();
              navigate("/");
            }}
            sessionInfo={sessionInfo}
          />
        }
      />
      <Route
        path='/results'
        element={
          <ResultsScreen
            results={sessionInfo.results || []}
            voiceResults={sessionInfo.voiceResults || []}
            finalStats={sessionInfo.finalStats || {}}
            onBackToDashboard={handleBackToDashboard}
          />
        }
      />

      <Route path='*' element={<div>Cargando...</div>} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <div className='app-container'>
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
