import React from 'react';
import '../../App.css';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="error-alert" role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="error-close"
          aria-label="Dismiss error"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;