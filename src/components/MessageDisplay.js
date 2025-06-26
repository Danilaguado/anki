// src/components/MessageDisplay.js
import React from "react";
import "./MessageDisplay.css";

const MessageDisplay = ({ message, isLoading }) => {
  return (
    <>
      {message && (
        <div className='message-box' role='alert'>
          <span className='message-text'>{message}</span>
        </div>
      )}

      {isLoading && (
        <div className='loading-box'>
          <span className='loading-text'>Cargando o procesando...</span>
        </div>
      )}
    </>
  );
};

export default MessageDisplay;
