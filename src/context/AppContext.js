// src/context/AppContext.js
import React from "react";

// Crear el contexto con valores iniciales por defecto (útil para autocompletado en el IDE)
const AppContext = React.createContext({
  appGlobalMessage: "",
  appIsLoading: false,
  onPlayAudio: () => {}, // Función de reproducción de audio
  setAppMessage: () => {}, // Función para establecer el mensaje global
  setAppIsLoading: () => {}, // Función para establecer el estado de carga global
});

export default AppContext;
