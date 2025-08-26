// DeckWrapper.js - Wrapper mínimo para conectar mazos específicos con QuizScreen
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuizScreen from "./QuizScreen";

const DeckWrapper = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deckCards, setDeckCards] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = localStorage.getItem("ankiUserId");

  useEffect(() => {
    const fetchDeckCards = async () => {
      try {
        const response = await fetch(`/api/data?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          // Por ahora, usar todas las palabras "Aprendiendo"
          const learningWords = data.data.words.filter(
            (word) => word.Estado === "Aprendiendo"
          );
          setDeckCards(learningWords);
        }
      } catch (err) {
        console.error("Error:", err);
        setDeckCards([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeckCards();
  }, [deckId, userId]);

  const handleQuizComplete = async (results, voiceResults) => {
    try {
      await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          results,
          voiceResults,
          sentiment: "neutral",
          sessionInfo: {
            deckId,
            startTime: new Date().toISOString(),
            status: "Completada",
          },
        }),
      });
    } catch (err) {
      console.error("Error:", err);
    }
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className='screen-container text-center'>
        <h1>Cargando...</h1>
      </div>
    );
  }

  // Usar QuizScreen directamente
  return (
    <QuizScreen
      deck={deckCards}
      onQuizComplete={handleQuizComplete}
      onGoBack={() => navigate("/")}
    />
  );
};

export default DeckWrapper;
