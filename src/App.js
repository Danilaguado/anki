// src/App.js
import React, { useState, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/PaymentForm.css";
import Landing from "./pages/Landing";
import PaymentPage from "./pages/PaymentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/payment' element={<PaymentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
