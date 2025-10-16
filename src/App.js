// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/PaymentForm.css"; // Estilos globales necesarios
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import BookPage from "./pages/BookPage"; // El nuevo componente genérico
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
        {/* React Router v6 es lo suficientemente inteligente como para no confundir esto
            con las rutas de arriba. Probará las rutas en orden. */}
        <Route path='/:bookId' element={<BookPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
