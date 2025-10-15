// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/PaymentForm.css";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import DescifrandoEva from "./pages/DescifrandoEva";
import MusculoVoluntad from "./pages/MusculoVoluntad";
import HablaConquista from "./pages/HablaConquista";
import ElAscenso from "./pages/ElAscenso";
import GambitoRey from "./pages/GambitoRey";
import PaymentPage from "./pages/PaymentPage";
import TermsAndConditions from "./pages/TermsAndConditions";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/descifrando-eva' element={<DescifrandoEva />} />
        <Route path='/musculo-voluntad' element={<MusculoVoluntad />} />
        <Route path='/habla-conquista' element={<HablaConquista />} />
        <Route path='/el-ascenso' element={<ElAscenso />} />
        <Route path='/gambito-rey' element={<GambitoRey />} />
        <Route path='/payment' element={<PaymentPage />} />
        <Route path='/terms' element={<TermsAndConditions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
