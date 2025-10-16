import React, { useEffect } from "react"; // Importa useEffect
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import BookPage from "./pages/BookPage";
import PrePaymentPage from "./pages/PrePaymentPage";
import PaymentPage from "./pages/PaymentPage";
import TermsAndConditions from "./pages/TermsAndConditions";
import FloatingWhatsAppButton from "./components/FloatingWhatsAppButton";
import TopBanner from "./components/TopBanner";

function App() {
  // 👇 INICIA LA NUEVA LÓGICA 👇
  useEffect(() => {
    const handleFocus = (event) => {
      // Se activa cuando el usuario toca un input, textarea, etc.
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        document.body.classList.add("keyboard-visible");
      }
    };

    const handleBlur = () => {
      // Se activa cuando el usuario sale del input
      document.body.classList.remove("keyboard-visible");
    };

    // Usamos 'focusin' y 'focusout' porque se propagan (burbujean)
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    // Limpieza al desmontar el componente
    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, []);
  // ☝️ FINALIZA LA NUEVA LÓGICA ☝️

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
      <FloatingWhatsAppButton />
    </BrowserRouter>
  );
}

export default App;
