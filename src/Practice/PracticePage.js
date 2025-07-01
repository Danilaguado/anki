// src/Practice/PracticePage.js
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import MessageDisplay from "../components/MessageDisplay"; // Sube a src/, baja a components/
// Rutas de importación directas en Practice/
import PracticeExerciseDisplay from "./PracticeExerciseDisplay";
import PracticeChatInterface from "./PracticeChatInterface";

// Importa el contexto
import AppContext from "../context/AppContext"; // Sube a src/, baja a context/

// Importar utilidades (¡CORREGIDO! normalizeText importado)
import { normalizeText } from "../utils/textUtils"; // Sube a src/, baja a utils/

const PracticePage = () => {
  // Consumir valores del contexto
  const { onPlayAudio, setAppMessage, setAppIsLoading, appIsLoading } =
    useContext(AppContext);

  const [currentExercise, setCurrentExercise] = useState(null);
  const [isLoadingExercise, setIsLoadingExercise] = useState(false); // Carga específica del ejercicio
  const [error, setError] = useState(null);

  // Estados para la interacción del ejercicio (similar a LessonCard)
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [recordedMicrophoneText, setRecordedMicrophoneText] = useState("");
  const [isAnswerVisible, setIsAnswerVisible] = useState(false); // Para traducción

  // Estado para el diálogo de chat (si el tipo es practice_chat)
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);

  useEffect(() => {
    fetchRandomExercise();
  }, []); // Carga un ejercicio al montar

  const fetchRandomExercise = async () => {
    setIsLoadingExercise(true);
    setAppIsLoading(true); // Activa la carga global
    setAppMessage("Cargando ejercicio de práctica...");
    setError(null);
    setCurrentExercise(null); // Limpia el ejercicio anterior

    // Resetear estados de interacción
    setUserTypedAnswer("");
    setMatchFeedback(null);
    setShowCorrectAnswer(false);
    setRecordedMicrophoneText("");
    setIsAnswerVisible(false);
    setCurrentDialogueIndex(0); // Resetear diálogo

    try {
      const response = await fetch("/api/practice/get-exercise");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Error HTTP: ${response.status} - ${
              response.statusText || "Error desconocido"
            }`
        );
      }
      const result = await response.json();
      if (result.success && result.exercise) {
        setCurrentExercise(result.exercise);
        setAppMessage("Ejercicio cargado.");
      } else {
        setAppMessage(
          result.message || "No se encontraron ejercicios de práctica."
        );
        setCurrentExercise(null);
      }
    } catch (err) {
      console.error("Error al cargar ejercicio de práctica:", err);
      setError(`Error al cargar ejercicio: ${err.message}.`);
      setCurrentExercise(null);
    } finally {
      setIsLoadingExercise(false);
      setAppIsLoading(false); // Desactiva la carga global
    }
  };

  // --- Lógica de verificación de respuestas (adaptada de LessonCard) ---
  const handleCheckAnswer = () => {
    if (!userTypedAnswer.trim()) {
      setAppMessage("Por favor, escribe tu respuesta.");
      setMatchFeedback(null);
      return;
    }

    const normalizedUserAnswer = normalizeText(userTypedAnswer);
    let normalizedCorrectAnswer;

    if (
      currentExercise.Type === "practice_fill_in_the_blank" ||
      currentExercise.Type === "practice_multiple_choice" ||
      currentExercise.Type === "practice_chat"
    ) {
      normalizedCorrectAnswer = normalizeText(currentExercise.AnswerEN || "");
    } else if (currentExercise.Type === "practice_listening") {
      normalizedCorrectAnswer = normalizeText(currentExercise.QuestionEN || "");
    } else {
      normalizedCorrectAnswer = normalizeText(currentExercise.AnswerES || ""); // Fallback para traducción simple
    }

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
      // Lógica específica para chat al acertar (gestionada por PracticeChatInterface)
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
    }
  };

  const handleOptionClick = (selectedOption) => {
    if (matchFeedback !== null) return;

    setUserTypedAnswer(selectedOption);

    const normalizedSelected = normalizeText(selectedOption);
    const normalizedCorrect = normalizeText(currentExercise.AnswerEN || "");

    if (normalizedSelected === normalizedCorrect) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Correcto!");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Intenta de nuevo.");
    }
  };

  const handleSpeechResultForListening = (transcript) => {
    setRecordedMicrophoneText(transcript); // Actualiza el estado del texto grabado
    // Lógica de verificación para listening (si no es chat)
    if (matchFeedback !== null) return; // No re-evaluar si ya se dio feedback

    const normalizedTranscript = normalizeText(transcript);
    const normalizedQuestionEN = normalizeText(
      currentExercise.QuestionEN || ""
    );

    if (normalizedTranscript === normalizedQuestionEN) {
      setMatchFeedback("correct");
      setShowCorrectAnswer(true);
      setAppMessage("¡Excelente! Transcripción correcta.");
    } else {
      setMatchFeedback("incorrect");
      setShowCorrectAnswer(true);
      setAppMessage("Incorrecto. Escucha de nuevo.");
    }
  };

  // Función para avanzar al siguiente ejercicio de práctica (no al siguiente paso del diálogo)
  const handleNextPracticeExercise = () => {
    fetchRandomExercise(); // Carga un nuevo ejercicio aleatorio
  };

  return (
    <div className='practice-page-wrapper app-container'>
      <Link to='/' className='button back-button top-back-button'>
        Volver a la pantalla principal
      </Link>
      <h1 className='app-title'>Sección de Práctica</h1>
      <p className='info-text'>
        Practica ejercicios aleatorios para mejorar tus habilidades.
      </p>
      <MessageDisplay message={error || ""} isLoading={isLoadingExercise} />{" "}
      {/* Muestra error local */}
      {isLoadingExercise && !currentExercise && (
        <p className='info-text'>Cargando ejercicio...</p>
      )}
      {currentExercise && (
        <div className='section-container practice-exercise-card'>
          {/* Mostrar notas si existen */}
          {currentExercise.Notes && (
            <div className='exercise-notes-display'>
              <p>{currentExercise.Notes}</p>
            </div>
          )}

          {/* Renderizado condicional del tipo de ejercicio */}
          {currentExercise.Type === "practice_chat" ? (
            <PracticeChatInterface
              dialogueSequence={currentExercise.DialogueSequence}
              currentDialogueIndex={currentDialogueIndex}
              setCurrentDialogueIndex={setCurrentDialogueIndex}
              onPlayAudio={onPlayAudio}
              appIsLoading={appIsLoading}
              userTypedAnswer={userTypedAnswer}
              setUserTypedAnswer={setUserTypedAnswer}
              matchFeedback={matchFeedback} // <-- Pasar matchFeedback
              setMatchFeedback={setMatchFeedback} // <-- Pasar setMatchFeedback
              setAppMessage={setAppMessage}
              showCorrectAnswer={showCorrectAnswer} // <-- Pasar showCorrectAnswer
              setShowCorrectAnswer={setShowCorrectAnswer} // <-- Pasar setShowCorrectAnswer
              recordedMicrophoneText={recordedMicrophoneText} // <-- Pasar recordedMicrophoneText
              handleSpeechResultForListening={handleSpeechResultForListening} // <-- Pasar handleSpeechResultForListening
              expectedAnswerEN={currentExercise.AnswerEN} // Pasar la respuesta esperada para el chat
            />
          ) : (
            <PracticeExerciseDisplay
              currentExercise={currentExercise}
              onPlayAudio={onPlayAudio}
              setAppMessage={setAppMessage}
              appIsLoading={appIsLoading}
              userTypedAnswer={userTypedAnswer}
              setUserTypedAnswer={setUserTypedAnswer}
              matchFeedback={matchFeedback} // <-- Pasar matchFeedback
              showCorrectAnswer={showCorrectAnswer} // <-- Pasar showCorrectAnswer
              recordedMicrophoneText={recordedMicrophoneText} // <-- Pasar recordedMicrophoneText
              handleCheckAnswer={handleCheckAnswer} // <-- Pasar handleCheckAnswer
              handleOptionClick={handleOptionClick} // <-- Pasar handleOptionClick
              handleSpeechResultForListening={handleSpeechResultForListening} // <-- Pasar handleSpeechResultForListening
              isAnswerVisible={isAnswerVisible}
              setIsAnswerVisible={setIsAnswerVisible}
            />
          )}

          <button
            onClick={handleNextPracticeExercise}
            className='button primary-button next-practice-button'
            disabled={isLoadingExercise}
          >
            Siguiente Ejercicio
          </button>
        </div>
      )}
      {!isLoadingExercise && !currentExercise && !error && (
        <p className='info-text'>
          Haz clic en "Siguiente Ejercicio" para empezar a practicar.
        </p>
      )}
    </div>
  );
};

export default PracticePage;
