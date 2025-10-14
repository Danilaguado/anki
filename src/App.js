// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/PaymentForm.css";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import CodigoConexion from "./pages/CodigoConexion";
import MusculoVoluntad from "./pages/MusculoVoluntad";
import HablaCorrigeConquista from "./pages/HablaCorrigeConquista";
import ElAscenso from "./pages/ElAscenso";
import PaymentPage from "./pages/PaymentPage";
import TermsAndConditions from "./pages/TermsAndConditions";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/codigo-conexion' element={<CodigoConexion />} />
        <Route path='/musculo-voluntad' element={<MusculoVoluntad />} />
        <Route
          path='/habla-corrige-conquista'
          element={<HablaCorrigeConquista />}
        />
        <Route path='/el-ascenso' element={<ElAscenso />} />
        <Route path='/payment' element={<PaymentPage />} />
        <Route path='/terms' element={<TermsAndConditions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
