// /src/components/DebugPanel.js - Panel de debugging para desarrollo
import React, { useState, useEffect } from "react";

const DebugPanel = ({ userId }) => {
  const [debugData, setDebugData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runDebugCheck = async (action = "full_check") => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/debug-sheets?userId=${userId}&action=${action}`
      );
      const data = await response.json();

      if (data.success) {
        setDebugData(data.debug);
      } else {
        console.error("Debug check failed:", data.message);
      }
    } catch (error) {
      console.error("Error running debug check:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testManualUpdate = async () => {
    setIsLoading(true);
    try {
      // Simular una práctica con datos de prueba
      const testCardData = {
        wordId: "test_word_1",
        isCorrect: true,
      };

      console.log("🧪 Ejecutando prueba de actualización manual...");

      // Llamar a la API de tracking
      const response = await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "check_answer",
          cardData: testCardData,
        }),
      });

      const result = await response.json();

      setTestResults({
        type: "manual_update",
        timestamp: new Date().toISOString(),
        success: result.success,
        message: result.message,
        details: result,
      });

      console.log("🧪 Resultado de prueba:", result);

      // Refrescar datos después de la prueba
      setTimeout(() => runDebugCheck(), 2000);
    } catch (error) {
      setTestResults({
        type: "manual_update",
        success: false,
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateFullPractice = async () => {
    setIsLoading(true);
    try {
      console.log("🧪 Simulando sesión completa de práctica...");

      // 1. Iniciar sesión
      const startResponse = await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "start_session",
          sessionData: { deckId: "test_deck" },
        }),
      });

      const sessionResult = await startResponse.json();
      console.log("📝 Sesión iniciada:", sessionResult);

      if (!sessionResult.success) {
        throw new Error("Failed to start session");
      }

      const sessionId = sessionResult.sessionId;

      // 2. Simular respuestas
      const testWords = ["word_1", "word_2", "word_3"];
      const results = [];

      for (let i = 0; i < testWords.length; i++) {
        const wordId = testWords[i];
        const isCorrect = Math.random() > 0.3; // 70% de aciertos

        // Respuesta
        await fetch("/api/track-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            action: "check_answer",
            sessionId,
            cardData: { wordId, isCorrect },
          }),
        });

        // Evaluación SRS
        const difficulty = isCorrect
          ? Math.random() > 0.5
            ? "good"
            : "easy"
          : Math.random() > 0.5
          ? "hard"
          : "again";

        await fetch("/api/track-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            action: "rate_memory",
            sessionId,
            cardData: { wordId, difficulty },
          }),
        });

        results.push({ wordId, isCorrect, difficulty });
        console.log(
          `📝 Procesada palabra ${i + 1}/${testWords.length}: ${wordId}`
        );
      }

      // 3. Finalizar sesión
      const correctAnswers = results.filter((r) => r.isCorrect).length;
      const accuracy = ((correctAnswers / results.length) * 100).toFixed(1);

      await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "end_session",
          finalResults: {
            sessionId,
            sentiment: "normal",
            sessionDuration: 120000, // 2 minutos
            correctAnswers,
            totalAnswers: results.length,
            accuracy,
          },
        }),
      });

      setTestResults({
        type: "full_practice",
        timestamp: new Date().toISOString(),
        success: true,
        message: `Simulación completa: ${correctAnswers}/${results.length} (${accuracy}%)`,
        details: { sessionId, results, correctAnswers, accuracy },
      });

      console.log("🎉 Simulación completada exitosamente");

      // Refrescar datos
      setTimeout(() => runDebugCheck(), 3000);
    } catch (error) {
      setTestResults({
        type: "full_practice",
        success: false,
        error: error.message,
      });
      console.error("❌ Error en simulación:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh cada 30 segundos si está habilitado
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        runDebugCheck();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, userId]);

  // Cargar datos iniciales
  useEffect(() => {
    if (userId) {
      runDebugCheck();
    }
  }, [userId]);

  const getStatusColor = (status) => {
    if (status.includes("✅")) return "text-green-600";
    if (status.includes("❌")) return "text-red-600";
    if (status.includes("⚠️")) return "text-yellow-600";
    return "text-gray-600";
  };

  if (!userId) {
    return (
      <div className='debug-panel'>
        <p>Usuario no disponible para debugging</p>
      </div>
    );
  }

  return (
    <div
      className='debug-panel'
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        width: "400px",
        maxHeight: "80vh",
        overflow: "auto",
        background: "white",
        border: "2px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontSize: "12px",
        zIndex: 1000,
      }}
    >
      <div className='debug-header' style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
          🔧 Panel de Debug
        </h3>
        <p style={{ margin: "0", color: "#666" }}>
          Usuario: <strong>{userId}</strong>
        </p>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button
            onClick={() => runDebugCheck()}
            disabled={isLoading}
            style={{
              padding: "6px 12px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            {isLoading ? "⏳" : "🔍"} Verificar
          </button>

          <button
            onClick={testManualUpdate}
            disabled={isLoading}
            style={{
              padding: "6px 12px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            🧪 Test Simple
          </button>

          <button
            onClick={simulateFullPractice}
            disabled={isLoading}
            style={{
              padding: "6px 12px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            🎯 Simular Sesión
          </button>

          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type='checkbox'
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto
          </label>
        </div>
      </div>

      {testResults && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: testResults.success ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${testResults.success ? "#10b981" : "#dc2626"}`,
            borderRadius: "6px",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
            {testResults.success ? "✅" : "❌"} Resultado de Prueba
          </h4>
          <p style={{ margin: "0 0 4px 0" }}>
            <strong>Tipo:</strong> {testResults.type}
          </p>
          <p style={{ margin: "0 0 4px 0" }}>
            <strong>Mensaje:</strong> {testResults.message}
          </p>
          {testResults.error && (
            <p style={{ margin: "0", color: "#dc2626" }}>
              <strong>Error:</strong> {testResults.error}
            </p>
          )}
          <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#666" }}>
            {new Date(testResults.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {debugData && (
        <div className='debug-content'>
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0" }}>📊 Resumen</h4>
            <p style={{ margin: "0 0 4px 0" }}>
              {debugData.summary?.overallHealth}
            </p>
            <p
              style={{
                margin: "0",
                color: debugData.summary?.readyForPractice
                  ? "#10b981"
                  : "#dc2626",
              }}
            >
              {debugData.summary?.readyForPractice
                ? "✅ Listo para practicar"
                : "❌ Requiere configuración"}
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0" }}>🗂 Estado de Hojas</h4>
            {Object.entries(debugData.checks).map(([sheet, check]) => (
              <div
                key={sheet}
                style={{
                  padding: "6px 8px",
                  margin: "4px 0",
                  background: "#f8f9fa",
                  borderRadius: "4px",
                  borderLeft: `3px solid ${
                    check.status?.includes("✅")
                      ? "#10b981"
                      : check.status?.includes("❌")
                      ? "#dc2626"
                      : "#f59e0b"
                  }`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: "11px" }}>{sheet}</strong>
                  <span
                    className={getStatusColor(check.status)}
                    style={{ fontSize: "10px" }}
                  >
                    {check.status}
                  </span>
                </div>
                {check.totalRecords !== undefined && (
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "10px",
                      color: "#666",
                    }}
                  >
                    Registros: {check.userRecords || 0} del usuario /{" "}
                    {check.totalRecords} total
                  </p>
                )}
                {check.error && (
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "10px",
                      color: "#dc2626",
                    }}
                  >
                    Error: {check.error}
                  </p>
                )}
              </div>
            ))}
          </div>

          {debugData.recommendations?.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 8px 0" }}>💡 Recomendaciones</h4>
              {debugData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  style={{
                    padding: "6px 8px",
                    margin: "4px 0",
                    background: rec.includes("🚨") ? "#fef2f2" : "#fffbeb",
                    border: `1px solid ${
                      rec.includes("🚨") ? "#dc2626" : "#f59e0b"
                    }`,
                    borderRadius: "4px",
                    fontSize: "11px",
                  }}
                >
                  {rec}
                </div>
              ))}
            </div>
          )}

          {debugData.checks.userSheet?.sampleData && (
            <div>
              <h4 style={{ margin: "0 0 8px 0" }}>
                🔍 Datos de Muestra (Hoja Usuario)
              </h4>
              <div
                style={{
                  background: "#f1f5f9",
                  padding: "8px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  maxHeight: "120px",
                  overflow: "auto",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  Headers: {debugData.checks.userSheet.headers?.join(" | ")}
                </div>
                {debugData.checks.userSheet.sampleData.map((row, index) => (
                  <div key={index} style={{ marginBottom: "2px" }}>
                    {row?.join(" | ")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <div>Ejecutando...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
