// ===== /src/App.js - CORREGIDO para flujo de autenticación =====
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
import AnalyticsDashboard from "./components/AnalyticsDashboard"; // NUEVO

import "./index.css";

// Función para generar IDs cortos (importada de utils)
const generateShortUserId = () => {
  const timestamp = (Date.now() % 1000000).toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `u_${timestamp}${random}`;
};

// =======================
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

// =======================
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

// =======================
// App principal
const AppContent = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({ words: [], decks: [] });
  const [studyDeck, setStudyDeck] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true); // CAMBIADO: Iniciar en true
  const [error, setError] = useState("");

  // NUEVO: Estado para tracking de actividad
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [dailySessionCount, setDailySessionCount] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Generar o recuperar userId
        let localUserId = localStorage.getItem("ankiUserId");
        if (!localUserId || !localUserId.startsWith("u_")) {
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
          // Usuario existe, cargar datos
          console.log(`[APP] Usuario existe, cargando datos...`);
          setUserData(data.data);
          registerDailyActivity();
          setIsLoading(false);
        } else {
          // Usuario no existe, ir al setup
          console.log(`[APP] Usuario no existe, redirigiendo al setup...`);
          setIsLoading(false);
          navigate("/setup");
        }
      } catch (err) {
        console.error("[APP] Error al inicializar:", err);
        // En caso de error, asumir que necesita setup
        setIsLoading(false);
        navigate("/setup");
      }
    };

    initializeApp();
  }, [navigate]);

  // NUEVO: Función para registrar actividad diaria
  const registerDailyActivity = async () => {
    const today = new Date().toISOString().split("T")[0];
    const lastVisit = localStorage.getItem("lastVisit");

    if (lastVisit !== today) {
      // Primera visita del día
      localStorage.setItem("lastVisit", today);
      localStorage.setItem("dailySessionCount", "1");
      setDailySessionCount(1);

      // Registrar en la API (podrías crear un endpoint específico para esto)
      try {
        await fetch("/api/track-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "daily_checkin",
            userId: localStorage.getItem("ankiUserId"),
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("Error registrando actividad diaria:", error);
      }
    } else {
      // Incrementar contador de sesiones del día
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

      // Construcción de datos inicial más completa
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

      // Pequeña pausa para asegurar que el backend esté listo
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
    // Filtrar palabras que están "Por Aprender"
    const wordsToLearn = userData.words.filter(
      (word) => word.Estado === "Por Aprender"
    );

    if (wordsToLearn.length === 0) {
      alert(
        "¡Felicidades! Has añadido todas las palabras disponibles a mazos de estudio."
      );
      return;
    }

    // Seleccionar palabras al azar
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
        // Actualizar el estado local inmediatamente
        const updatedWords = userData.words.map((word) =>
          wordIdsToAdd.includes(word.ID_Palabra)
            ? { ...word, Estado: "Aprendiendo" }
            : word
        );

        // Crear el nuevo mazo localmente
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

        // Refrescar datos del servidor
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

  const handleStartQuiz = (isPracticeMode = false) => {
    // Registrar inicio de sesión de estudio
    setSessionStartTime(new Date().toISOString());

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
      startTime: new Date().toISOString(),
      isPracticeMode,
      originalDeckSize: shuffledDeck.length,
    });
    navigate("/quiz");
  };

  const handleQuizComplete = (results, voiceResults, finalStats) => {
    setSessionInfo((prev) => ({
      ...prev,
      results,
      voiceResults,
      finalStats,
      endTime: new Date().toISOString(),
    }));
    navigate("/results");
  };

  const handleBackToDashboard = async (sentiment) => {
    setIsLoading(true);

    try {
      // 1. Finalizar la sesión en el backend CON el sentimiento
      await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end_session",
          userId: userId, // Usar el userId del estado
          finalResults: {
            sessionId: sessionInfo.finalStats.sessionId, // Asegúrate que el sessionId esté aquí
            results: sessionInfo.results,
            sentiment: sentiment, // ¡Aquí usamos el parámetro!
          },
        }),
      });

      // 2. Refrescar los datos del usuario para actualizar el panel
      await refreshUserData();
    } catch (err) {
      console.error("Error al guardar y finalizar la sesión:", err);
    } finally {
      setIsLoading(false);
      navigate("/");
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

      {/* NUEVO: Dashboard de Analytics */}
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
            onGoBack={() => navigate("/")}
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
