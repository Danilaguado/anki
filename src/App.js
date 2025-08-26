// ===== /src/App.js =====
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
import "./index.css";

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
const CardsActivity = () => {
  const { deckId } = useParams();
  return <ComingSoon activityName='Cartas' deckId={deckId} />;
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

// =======================
// App principal
const AppContent = () => {
  const navigate = useNavigate();
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
          navigate("/setup");
          return;
        }
        const data = await response.json();
        if (data.success && data.userExists) {
          setUserData(data.data);
          navigate("/");
        } else {
          navigate("/setup");
        }
      } catch (err) {
        navigate("/setup");
      }
    };
    fetchData();
  }, [userId, navigate]);

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
          Total_Voz_Aciertos: 0,
          Total_Voz_Errores: 0,
        })),
      };
      setUserData(initialUserData);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeck = async (amount = 10) => {
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
    navigate("/quiz");
  };

  const handleQuizComplete = (results, voiceResults) => {
    setSessionInfo((prev) => ({ ...prev, results, voiceResults }));
    navigate("/results");
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
          voiceResults: sessionInfo.voiceResults,
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
      navigate("/");
    }
  };

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
          />
        }
      />

      {/* Dashboard */}
      <Route
        path='/'
        element={
          <Dashboard
            userData={userData}
            onStartQuiz={handleStartQuiz}
            onCreateDeck={handleCreateDeck}
          />
        }
      />

      {/* Rutas nuevas para actividades de mazo */}
      <Route path='/deck/:deckId/cards' element={<CardsActivity />} />
      <Route path='/deck/:deckId/history' element={<HistoryActivity />} />
      <Route path='/deck/:deckId/learn' element={<LearnActivity />} />
      <Route path='/deck/:deckId/quiz' element={<QuizActivity />} />

      {/* Quiz y resultados */}
      <Route
        path='/quiz'
        element={
          <QuizScreen
            deck={studyDeck}
            onQuizComplete={handleQuizComplete}
            onGoBack={() => navigate("/")}
          />
        }
      />
      <Route
        path='/results'
        element={
          <ResultsScreen
            results={sessionInfo.results || []}
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
