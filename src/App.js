import React, { useState } from "react";
import SetupScreen from "./components/SetupScreen";
import DashboardPlaceholder from "./components/DashboardPlaceholder"; // Usaremos un placeholder por ahora

function App() {
  const [appState, setAppState] = useState("setup");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetupComplete = async (email, words) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, masterWords: words }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en la configuración.");
      }

      setUserEmail(email);
      setAppState("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
        return <DashboardPlaceholder email={userEmail} />;
      default:
        return (
          <SetupScreen
            onSetupComplete={handleSetupComplete}
            isLoading={isLoading}
            error={error}
          />
        );
    }
  };

  return (
    <div className='bg-gray-100 min-h-screen flex items-center justify-center p-4 font-sans'>
      {renderCurrentState()}
    </div>
  );
}

export default App;
