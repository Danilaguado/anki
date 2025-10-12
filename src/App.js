// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/PaymentForm.css";
import CodigoConexion from "./pages/CodigoConexion";
import MusculoVoluntad from "./pages/MusculoVoluntad";
import PaymentPage from "./pages/PaymentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/codigo-conexion' element={<CodigoConexion />} />
        <Route path='/musculo-voluntad' element={<MusculoVoluntad />} />
        <Route path='/payment' element={<PaymentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
