// src/components/BottomNavigationBar.js
import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext"; // Importa el contexto
import "./BottomNavigationBar.css"; // Importa los estilos

// Iconos de ejemplo (reemplaza con tus SVGs)
const VocabIcon = () => <svg>...</svg>; // Ícono para Vocabulario
const LessonsIcon = () => <svg>...</svg>; // Ícono para Lecciones

const NavItem = ({ to, icon, label }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { onVibrate } = useContext(AppContext); // Consume la función de vibración

  // Lógica para determinar si el ítem está activo.
  // El ítem de Lecciones (to="/") está activo si la ruta es "/" o empieza con "/lessons".
  const isActive =
    to === "/"
      ? location.pathname === "/" || location.pathname.startsWith("/lessons")
      : location.pathname.startsWith(to);

  const handleClick = (e) => {
    e.preventDefault();
    onVibrate(); // ¡Vibra al hacer clic!
    navigate(to); // Navega a la nueva ruta
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`nav-item ${isActive ? "active" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
};

const BottomNavigationBar = () => {
  return (
    <nav className='bottom-navigation-bar'>
      {/* CAMBIO: Se elimina el NavItem de "Inicio" */}
      <NavItem to='/vocab-trainer' icon={<VocabIcon />} label='Vocabulario' />
      <NavItem to='/' icon={<LessonsIcon />} label='Lecciones' />
    </nav>
  );
};

export default BottomNavigationBar;
