// src/components/DebugPanel.js - VERSIÓN SEGURA PARA BUILD
import React, { useState, useEffect } from "react";

const DebugPanel = ({ userId }) => {
  const [debugData, setDebugData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const runDebugCheck = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // ✅ SOLO usar fetch - NO imports de googleapis
      const response = await fetch(`/api/debug-sheets?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setDebugData(data.debug);
      }
    } catch (error) {
      console.error("Debug check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdate = async () => {
    setIsLoading(true);
    try {
      // ✅ SOLO fetch a APIs - NO importar googleapis
      const response = await fetch("/api/track-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "check_answer",
          cardData: { wordId: "test_word", isCorrect: true },
        }),
      });

      const result = await response.json();
      setTestResults(result);

      // Refrescar después de la prueba
      setTimeout(runDebugCheck, 2000);
    } catch (error) {
      setTestResults({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDebugCheck();
  }, [userId]);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!userId) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        width: "300px",
        background: "white",
        border: "2px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontSize: "12px",
        zIndex: 1000,
        maxHeight: "400px",
        overflow: "auto",
      }}
    >
      <h3>🔧 Debug Panel</h3>
      <p>
        Usuario: <strong>{userId}</strong>
      </p>

      <div style={{ marginTop: "12px" }}>
        <button
          onClick={runDebugCheck}
          disabled={isLoading}
          style={{
            padding: "6px 12px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            marginRight: "8px",
          }}
        >
          {isLoading ? "Verificando..." : "Verificar Hojas"}
        </button>

        <button
          onClick={testUpdate}
          disabled={isLoading}
          style={{
            padding: "6px 12px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Probar Update
        </button>
      </div>

      {testResults && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px",
            background: testResults.success ? "#ecfdf5" : "#fef2f2",
            borderRadius: "4px",
          }}
        >
          <strong>{testResults.success ? "✅" : "❌"} Test:</strong>
          <p>{testResults.message || testResults.error}</p>
        </div>
      )}

      {debugData && (
        <div style={{ marginTop: "12px" }}>
          <h4>Estado de Hojas:</h4>
          {Object.entries(debugData.checks || {}).map(([sheet, check]) => (
            <div
              key={sheet}
              style={{
                padding: "4px",
                margin: "2px 0",
                background: "#f8f9fa",
                borderRadius: "3px",
              }}
            >
              <strong>{sheet}:</strong> {check.status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
