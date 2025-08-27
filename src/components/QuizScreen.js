import React, { useState, useEffect, useRef } from "react";
import SpeechToTextButton from "./SpeechToTextButton";

const PlayIcon = () => (
  <svg
    className='icon-play'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
    />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className='icon-close'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={2}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M6 18L18 6M6 6l12 12'
    />
  </svg>
);

const QuizScreen = ({ deck, onQuizComplete, onGoBack, sessionInfo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [voiceResults, setVoiceResults] = useState([]);
  const [isAnswerBlurred, setIsAnswerBlurred] = useState(true);

  // Estados para repetición espaciada
  const [cardsToRepeat, setCardsToRepeat] = useState([]);
  const [isInRepeatPhase, setIsInRepeatPhase] = useState(false);
  const [originalDeckLength, setOriginalDeckLength] = useState(0);

  // Referencias para tracking de tiempo
  const cardStartTime = useRef(Date.now());
  const sessionStartTime = useRef(Date.now());
  const inputRef = useRef(null);
  const tempResultRef = useRef(null);

  // CORRECCIÓN: Extraer sessionId del sessionInfo
  const sessionId = sessionInfo?.sessionId;
  const userId = localStorage.getItem("ankiUserId");

  if (!deck || deck.length === 0) {
    return (
      <div className='quiz-container'>
        <div className='quiz-error'>
          <h1>Error</h1>
          <p>No hay tarjetas disponibles en este mazo para estudiar.</p>
          <button onClick={onGoBack} className='quiz-button secondary'>
            Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    setOriginalDeckLength(deck.length);
    sessionStartTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    cardStartTime.current = Date.now();
    setIsAnswerBlurred(true);
  }, [currentIndex]);

  const getCurrentDeck = () => {
    return isInRepeatPhase ? cardsToRepeat : deck;
  };

  const currentCard = getCurrentDeck()[currentIndex];
  const currentDeck = getCurrentDeck();
  const progress = ((currentIndex + 1) / currentDeck.length) * 100;

  const playAudio = (text, lang = "en-US") => {
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeechResult = async (transcript) => {
    const spokenText = transcript.trim().toLowerCase();
    const correctText = currentCard.Inglés.trim().toLowerCase();
    const isCorrect = spokenText === correctText;

    // CORRECCIÓN: Registrar interacción de voz con estructura correcta
    try {
      await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          action: "voice_interaction",
          voiceData: {
            sessionId: sessionId,
            wordId: currentCard.ID_Palabra,
            detectedText: transcript,
            expectedText: currentCard.Inglés,
            isVoiceCorrect: isCorrect,
          },
        }),
      });

      console.log(
        `[QUIZ] Interacción de voz registrada: ${currentCard.ID_Palabra} = ${isCorrect}`
      );
    } catch (error) {
      console.error("Error registrando interacción de voz:", error);
    }

    setVoiceResults((prev) => [
      ...prev,
      { wordId: currentCard.ID_Palabra, isCorrect },
    ]);

    if (isCorrect) {
      alert(`¡Coincidencia exacta! Dijiste: "${transcript}"`);
      // Reproducir sonido de éxito
      const audio = new Audio("/correct-6033.mp3");
      audio
        .play()
        .catch((e) => console.error("Error reproduciendo sonido:", e));
    } else {
      alert(
        `Casi... Dijiste: "${transcript}". La palabra correcta es: "${currentCard.Inglés}"`
      );
    }
  };

  const handleCheckAnswer = async () => {
    const responseTime = Date.now() - cardStartTime.current;
    const userCleanAnswer = userAnswer.trim().toLowerCase();
    const correctAnswers = currentCard.Español.split("/").map((ans) =>
      ans.trim().toLowerCase()
    );
    const isCorrect = correctAnswers.includes(userCleanAnswer);

    setFeedback(isCorrect ? "correct" : "incorrect");

    // CORRECCIÓN: Registrar respuesta inmediatamente con estructura correcta
    try {
      await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          action: "check_answer",
          cardData: {
            wordId: currentCard.ID_Palabra,
            isCorrect: isCorrect,
          },
        }),
      });

      console.log(
        `[QUIZ] Respuesta registrada: ${currentCard.ID_Palabra} = ${isCorrect}`
      );
    } catch (error) {
      console.error("Error registrando el resultado de la respuesta:", error);
    }

    // Guardamos el resto de los datos temporalmente para el feedback de SRS
    tempResultRef.current = {
      wordId: currentCard.ID_Palabra,
      english: currentCard.Inglés,
      spanish: currentCard.Español,
      isCorrect: isCorrect,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      userAnswer: userAnswer,
      srsFeedback: null,
    };
  };

  const handleSrsFeedback = async (srsLevel) => {
    const finalResult = { ...tempResultRef.current, srsFeedback: srsLevel };

    // CORRECCIÓN: Registrar la dificultad (memoria) con estructura correcta
    try {
      await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          action: "rate_memory",
          cardData: {
            sessionId: sessionId,
            wordId: currentCard.ID_Palabra,
            difficulty: srsLevel,
          },
        }),
      });

      console.log(
        `[QUIZ] Memoria evaluada: ${currentCard.ID_Palabra} = ${srsLevel}`
      );
    } catch (error) {
      console.error("Error registrando la evaluación de memoria:", error);
    }

    // Lógica de repetición espaciada: si es 'again' o 'hard', programar repetición
    if (srsLevel === "again" || srsLevel === "hard") {
      const alreadyInRepeat = cardsToRepeat.some(
        (card) => card.ID_Palabra === currentCard.ID_Palabra
      );

      if (!alreadyInRepeat) {
        setCardsToRepeat((prev) => [
          ...prev,
          { ...currentCard, repeatCount: 1 },
        ]);
      } else {
        setCardsToRepeat((prev) =>
          prev.map((card) =>
            card.ID_Palabra === currentCard.ID_Palabra
              ? { ...card, repeatCount: (card.repeatCount || 0) + 1 }
              : card
          )
        );
      }
    }

    const updatedResults = [...sessionResults, finalResult];
    setSessionResults(updatedResults);

    // Avanzar a la siguiente carta
    if (currentIndex < currentDeck.length - 1) {
      setFeedback(null);
      setUserAnswer("");
      setCurrentIndex(currentIndex + 1);
    } else {
      // Si terminamos el mazo original y hay cartas para repetir
      if (!isInRepeatPhase && cardsToRepeat.length > 0) {
        // Cambiar a fase de repetición
        setIsInRepeatPhase(true);
        setCurrentIndex(0);
        setFeedback(null);
        setUserAnswer("");

        // Mostrar mensaje de transición
        alert(
          `¡Excelente! Ahora vamos a repasar ${cardsToRepeat.length} palabra(s) que necesitan más práctica.`
        );
      } else {
        // Finalizar quiz completamente
        endSession(updatedResults);
      }
    }
  };

  const endSession = (results) => {
    // CORRECCIÓN: Calcular estadísticas finales más completas y precisas
    const sessionDuration = Date.now() - sessionStartTime.current;
    const totalCards = originalDeckLength + cardsToRepeat.length;
    const correctAnswers = results.filter((r) => r.isCorrect).length;
    const totalAnswers = results.length;

    const finalStats = {
      sessionId: sessionId, // IMPORTANTE: Preservar sessionId
      sessionDuration: sessionDuration,
      totalOriginalCards: originalDeckLength,
      totalRepeatedCards: cardsToRepeat.length,
      totalSessionCards: totalCards,
      correctAnswers: correctAnswers,
      totalAnswers: totalAnswers,
      accuracy:
        totalAnswers > 0
          ? ((correctAnswers / totalAnswers) * 100).toFixed(2)
          : "0",
      startTime: sessionStartTime.current,
      endTime: Date.now(),
    };

    console.log("[QUIZ] Estadísticas finales calculadas:", finalStats);

    onQuizComplete(results, voiceResults, finalStats);
  };

  const handleAbandonSession = async () => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres abandonar esta sesión? Tu progreso no se guardará."
      )
    ) {
      // CORRECCIÓN: Usar la estructura correcta para abandonar sesión
      try {
        await fetch("/api/track-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            action: "abandon_session",
            sessionData: { sessionId: sessionId },
          }),
        });

        console.log(`[QUIZ] Sesión abandonada: ${sessionId}`);
      } catch (error) {
        console.error("Error registrando abandono de sesión:", error);
      }

      onGoBack();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !feedback) {
      handleCheckAnswer();
    }
  };

  return (
    <div className='quiz-container'>
      {/* Barra de progreso mejorada */}
      <div className='quiz-progress-section'>
        <div className='quiz-progress-bar'>
          <div
            className='quiz-progress-fill'
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Indicadores de fase */}
        <div className='quiz-phase-indicators'>
          <span
            className={`phase-indicator ${
              !isInRepeatPhase ? "active" : "completed"
            }`}
          >
            Mazo Principal ({originalDeckLength})
          </span>
          {cardsToRepeat.length > 0 && (
            <span
              className={`phase-indicator ${
                isInRepeatPhase ? "active" : "pending"
              }`}
            >
              Repaso ({cardsToRepeat.length})
            </span>
          )}
        </div>
      </div>

      {/* Botón de cerrar */}
      <button onClick={handleAbandonSession} className='quiz-close-button'>
        <CloseIcon />
      </button>

      {/* Header del quiz con información extendida */}
      <div className='quiz-header'>
        <h2>
          {isInRepeatPhase ? "Fase de Repaso" : "Mazo Principal"} - Pregunta{" "}
          {currentIndex + 1} de {currentDeck.length}
        </h2>
        {currentCard.repeatCount && (
          <p className='repeat-info'>
            Esta palabra ha sido repetida {currentCard.repeatCount} vez(es)
          </p>
        )}
        {sessionId && <p className='session-info'>Sesión: {sessionId}</p>}
      </div>

      {/* Tarjeta principal */}
      <div
        className={`quiz-card ${
          feedback === "correct"
            ? "correct"
            : feedback === "incorrect"
            ? "incorrect"
            : ""
        }`}
      >
        <div className='quiz-word'>
          <h3>{currentCard.Inglés}</h3>
          {isInRepeatPhase && <div className='repeat-badge'>🔄 Repaso</div>}
        </div>

        <div className='quiz-answer-section'>
          <p
            className={`quiz-blurred-answer ${
              !isAnswerBlurred ? "revealed" : ""
            }`}
            onClick={() => setIsAnswerBlurred(false)}
          >
            {currentCard.Español}
          </p>

          <div className='quiz-audio-controls'>
            <button
              onClick={() => playAudio(currentCard.Inglés)}
              className='quiz-play-button'
              title='Reproducir pronunciación'
            >
              <PlayIcon />
            </button>
            <SpeechToTextButton onResult={handleSpeechResult} lang='en-US' />
          </div>
        </div>
      </div>

      {/* Sección de interacción */}
      <div className='quiz-interaction'>
        {!feedback ? (
          <div className='quiz-input-section'>
            <input
              ref={inputRef}
              type='text'
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Escribe la traducción aquí...'
              className='quiz-input-field'
            />
            <button
              onClick={handleCheckAnswer}
              className='quiz-button primary'
              disabled={!userAnswer.trim()}
            >
              Revisar Respuesta
            </button>
          </div>
        ) : (
          <div className='quiz-feedback-section'>
            <div className='quiz-feedback-result'>
              {feedback === "correct" ? (
                <div className='quiz-feedback correct'>
                  <span className='feedback-icon'>✅</span>
                  <span className='feedback-text'>¡Correcto!</span>
                </div>
              ) : (
                <div className='quiz-feedback incorrect'>
                  <span className='feedback-icon'>❌</span>
                  <div className='feedback-content'>
                    <span className='feedback-text'>Respuesta correcta:</span>
                    <strong className='correct-answer'>
                      {currentCard.Español}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div className='quiz-srs-section'>
              <p className='srs-prompt'>
                ¿Qué tan bien recordaste esta palabra?
              </p>
              <div className='quiz-srs-buttons'>
                <button
                  onClick={() => handleSrsFeedback("easy")}
                  className='quiz-srs-button easy'
                >
                  <span className='srs-emoji'>😎</span>
                  <span className='srs-text'>Fácil</span>
                </button>
                <button
                  onClick={() => handleSrsFeedback("good")}
                  className='quiz-srs-button good'
                >
                  <span className='srs-emoji'>🙂</span>
                  <span className='srs-text'>Bien</span>
                </button>
                <button
                  onClick={() => handleSrsFeedback("hard")}
                  className='quiz-srs-button hard'
                >
                  <span className='srs-emoji'>🤔</span>
                  <span className='srs-text'>Difícil</span>
                </button>
                <button
                  onClick={() => handleSrsFeedback("again")}
                  className='quiz-srs-button again'
                >
                  <span className='srs-emoji'>😭</span>
                  <span className='srs-text'>Mal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel de estadísticas en tiempo real */}
      <div className='quiz-stats-panel'>
        <div className='stat-item'>
          <span className='stat-label'>Sesión:</span>
          <span className='stat-value'>
            {Math.round((Date.now() - sessionStartTime.current) / 1000 / 60)}min
          </span>
        </div>
        <div className='stat-item'>
          <span className='stat-label'>Aciertos:</span>
          <span className='stat-value'>
            {sessionResults.filter((r) => r.isCorrect).length}/
            {sessionResults.length}
          </span>
        </div>
        {cardsToRepeat.length > 0 && (
          <div className='stat-item'>
            <span className='stat-label'>Para Repasar:</span>
            <span className='stat-value'>{cardsToRepeat.length}</span>
          </div>
        )}
        {voiceResults.length > 0 && (
          <div className='stat-item'>
            <span className='stat-label'>Voz:</span>
            <span className='stat-value'>
              {voiceResults.filter((v) => v.isCorrect).length}/
              {voiceResults.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
