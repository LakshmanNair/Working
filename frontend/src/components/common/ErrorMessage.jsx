const ErrorMessage = ({ message, onDismiss }) => {
  return (
    <div
      style={{
        padding: '1rem',
        margin: '1rem 0',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        color: '#c33',
      }}
    >
      {message}
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

