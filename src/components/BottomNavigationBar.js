// src/components/BottomNavigationBar.js
import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import "./BottomNavigationBar.css";

// CAMBIO: Iconos SVG reales añadidos
const LessonsIcon = ({ isActive }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className='h-6 w-6'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={isActive ? 2.5 : 2}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    />
  </svg>
);

const VocabIcon = ({ isActive }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className='h-6 w-6'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={isActive ? 2.5 : 2}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    />
  </svg>
);

const NavItem = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { onVibrate } = useContext(AppContext);

  const isActive =
    to === "/"
      ? location.pathname === "/" || location.pathname.startsWith("/lessons")
      : location.pathname.startsWith(to);

  const handleClick = (e) => {
    e.preventDefault();
    onVibrate();
    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`nav-item ${isActive ? "active" : ""}`}
    >
      <Icon isActive={isActive} />
      <span>{label}</span>
    </a>
  );
};

const BottomNavigationBar = () => {
  return (
    <nav className='bottom-navigation-bar'>
      <NavItem to='/' icon={LessonsIcon} label='Lecciones' />
      <NavItem to='/vocab-trainer' icon={VocabIcon} label='Vocabulario' />
    </nav>
  );
};

export default BottomNavigationBar;
