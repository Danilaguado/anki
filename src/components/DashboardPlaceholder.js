import React from "react";

const CheckCircleIcon = () => (
  <svg
    className='w-12 h-12 text-green-500 mx-auto'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const DashboardPlaceholder = ({ email }) => (
  <div className='w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center'>
    <CheckCircleIcon />
    <h1 className='text-3xl font-bold text-gray-900 mt-4 mb-2'>
      ¡Configuración Exitosa!
    </h1>
    <p className='text-gray-600 mb-6'>
      Tu base de datos en Google Sheets ha sido creada.
    </p>
    <div className='bg-gray-50 p-4 rounded-lg'>
      <p className='text-sm text-gray-500'>Email registrado:</p>
      <p className='font-semibold text-gray-800'>{email}</p>
    </div>
    <p className='text-xs text-gray-400 mt-8'>
      Siguiente paso: Construir el panel de control y la zona de quiz.
    </p>
  </div>
);

export default DashboardPlaceholder;
