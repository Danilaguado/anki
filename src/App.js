// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import BookPage from "./pages/BookPage";
import PrePaymentPage from "./pages/PrePaymentPage"; // <-- IMPORTAR
import PaymentPage from "./pages/PaymentPage";
import TermsAndConditions from "./pages/TermsAndConditions";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/start-purchase' element={<PrePaymentPage />} />{" "}
        {/* <-- AÑADIR RUTA */}
        <Route path='/payment' element={<PaymentPage />} />
        <Route path='/terms' element={<TermsAndConditions />} />
        <Route path='/:bookId' element={<BookPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
