// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import BookPage from "./pages/BookPage";
import PrePaymentPage from "./pages/PrePaymentPage";
import PaymentPage from "./pages/PaymentPage";
import TermsAndConditions from "./pages/TermsAndConditions";
import FloatingWhatsAppButton from "./components/FloatingWhatsAppButton"; // <-- 1. Importar
import TopBanner from "./components/TopBanner";

function App() {
  return (
    <BrowserRouter>
      <TopBanner />
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/start-purchase' element={<PrePaymentPage />} />
        <Route path='/payment' element={<PaymentPage />} />
        <Route path='/terms' element={<TermsAndConditions />} />
        <Route path='/:bookId' element={<BookPage />} />
      </Routes>
      <FloatingWhatsAppButton /> {/* <-- 2. Añadir el componente aquí */}
    </BrowserRouter>
  );
}

export default App;
