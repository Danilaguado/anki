// ===== /src/App.js - VERSIÓN FINAL CORREGIDA =====
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
// En tu App.js, agrega temporalmente para testing:
import DebugPanel from "./components/DebugPanel";

// Dentro del componente, agrega:
{
  process.env.NODE_ENV === "development" && <DebugPanel userId={userId} />;
}
const generateShortUserId = () => {
  const timestamp = (Date.now() % 1000000).toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `user_${timestamp}${random}`;
};

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
  const [dailySessionCount, setDailySessionCount] = useState(0);

  // FUNCIÓN CENTRALIZADA PARA REGISTRAR TODA LA ACTIVIDAD
  const trackActivity = async (action, payload = {}) => {
    const sessionIdToSend = sessionInfo.sessionId || payload.sessionId;

    // Prevenimos logs innecesarios si no hay datos clave
    if (!userId) {
      console.warn(
        `[TRACKING] Se intentó registrar '${action}' pero falta el userId.`
      );
      return { success: false, message: "UserID no disponible." };
    }

    try {
      const requestBody = {
        action,
        userId,
        sessionId: sessionIdToSend,
        ...payload,
      };

      const response = await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!result.success) {
        console.error(
          `[APP TRACKING] La API devolvió un error para '${action}':`,
          result.message
        );
      } else {
        console.log(`[APP TRACKING] Éxito para '${action}':`, result);
      }

      return result; // Siempre devolvemos el resultado para poder usarlo (ej. obtener sessionId)
    } catch (err) {
      console.error(`[APP TRACKING] Fallo de red para '${action}':`, err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        let localUserId = localStorage.getItem("ankiUserId");
        if (!localUserId || !localUserId.startsWith("user_")) {
          localUserId = generateShortUserId();
          localStorage.setItem("ankiUserId", localUserId);
        }
        setUserId(localUserId);

        const response = await fetch(`/api/data?userId=${localUserId}`);
        const data = await response.json();

        if (response.ok && data.success && data.userExists) {
          setUserData(data.data);
          registerDailyActivity(localUserId); // Pasamos el userId para el checkin
        } else {
          navigate("/setup");
        }
      } catch (err) {
        console.error("[APP] Error al inicializar:", err);
        navigate("/setup");
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, [navigate]);

  const registerDailyActivity = async (currentUserId) => {
    const today = new Date().toISOString().split("T")[0];
    const lastVisit = localStorage.getItem("lastVisit");
    if (lastVisit !== today) {
      localStorage.setItem("lastVisit", today);
      // Usamos una versión especial de trackActivity porque sessionInfo aún no existe
      try {
        await fetch("/api/track-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "daily_checkin",
            userId: currentUserId,
          }),
        });
      } catch (error) {
        console.error("Error en el check-in diario:", error);
      }
    }
  };

  const refreshUserData = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/data?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.userExists) setUserData(data.data);
      }
    } catch (err) {
      console.error("Error al refrescar datos:", err);
    }
  };

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
      await refreshUserData();
      setIsLoading(false);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleCreateDeck = async (amount = 10) => {
    const wordsToLearn = userData.words.filter(
      (w) => w.Estado === "Por Aprender"
    );
    if (wordsToLearn.length === 0) {
      alert("¡Felicidades! Has añadido todas las palabras disponibles.");
      return;
    }
    const selectedWords = wordsToLearn.slice(
      0,
      Math.min(amount, wordsToLearn.length)
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
        alert(
          `¡Éxito! Se creó "${result.deckId}" con ${selectedWords.length} palabras.`
        );
        await refreshUserData();
      } else {
        throw new Error(result.message || "Error al crear el mazo");
      }
    } catch (err) {
      alert(`Error al crear el mazo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async (isPracticeMode = false) => {
    const result = await trackActivity("start_session", {
      sessionData: { deckId: isPracticeMode ? "practice-mode" : "review-mode" },
    });

    if (!result || !result.success || !result.sessionId) {
      alert("Error al iniciar la sesión de estudio desde el backend.");
      return;
    }

    const { sessionId } = result;
    const today = new Date().toISOString().split("T")[0];
    const deckForQuiz = userData.words.filter(
      (word) =>
        word.Estado === "Aprendiendo" &&
        (!isPracticeMode
          ? !word.Fecha_Proximo_Repaso || word.Fecha_Proximo_Repaso <= today
          : true)
    );

    if (deckForQuiz.length === 0) {
      await trackActivity("abandon_session", { sessionId }); // Pasamos el sessionId para abandonarlo
      alert(
        isPracticeMode
          ? "No tienes palabras en estudio para practicar."
          : "No tienes palabras para repasar hoy."
      );
      return;
    }

    const shuffledDeck = [...deckForQuiz].sort(() => Math.random() - 0.5);
    setStudyDeck(shuffledDeck);
    // Guardamos toda la info de la sesión en el estado
    setSessionInfo({
      sessionId: sessionId,
      startTime: new Date().toISOString(),
      isPracticeMode,
      originalDeckSize: shuffledDeck.length,
    });
    navigate("/quiz");
  };

  const handleQuizComplete = (results, voiceResults, finalStats) => {
    setSessionInfo((prev) => ({ ...prev, results, voiceResults, finalStats }));
    navigate("/results");
  };

  const handleBackToDashboard = async (sentiment) => {
    setIsLoading(true);
    await trackActivity("end_session", {
      finalResults: { ...sessionInfo.finalStats, sentiment: sentiment },
    });
    setSessionInfo({}); // Limpiar la sesión actual
    await refreshUserData();
    setIsLoading(false);
    navigate("/");
  };

  const handleAbandonSession = async () => {
    if (sessionInfo.sessionId) {
      await trackActivity("abandon_session");
    }
    setSessionInfo({}); // Limpiar la sesión actual
  };

  if (isLoading) {
    return (
      <div className='loading-container'>
        <h2>Cargando aplicación...</h2>
      </div>
    );
  }

  return (
    <Routes>
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
      <Route
        path='/analytics'
        element={<AnalyticsDashboard userId={userId} />}
      />
      <Route path='/deck/:deckId/history' element={<HistoryActivity />} />
      <Route path='/deck/:deckId/learn' element={<LearnActivity />} />
      <Route path='/deck/:deckId/quiz' element={<QuizActivity />} />
      <Route path='/deck/:deckId/cards' element={<DeckWrapper />} />
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
            trackActivity={trackActivity}
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
      <Route path='*' element={<div>Página no encontrada</div>} />
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
