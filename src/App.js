// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css"; // Estilos globales
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import BookPage from "./pages/BookPage";
import PaymentPage from "./pages/PaymentPage";
import TermsAndConditions from "./pages/TermsAndConditions";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Rutas principales */}
        <Route path='/' element={<Home />} />
        <Route path='/payment' element={<PaymentPage />} />
        <Route path='/terms' element={<TermsAndConditions />} />

        {/* Ruta dinámica para todos los libros */}
        <Route path='/:bookId' element={<BookPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
