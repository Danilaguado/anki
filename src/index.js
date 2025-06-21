// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Esto importa tu CSS
import App from "./App"; // Esto importa tu componente App

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App /> {/* Aquí es donde se renderiza tu App.js */}
  </React.StrictMode>
);
