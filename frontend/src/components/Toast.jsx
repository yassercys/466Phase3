import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3200);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      {message}
    </div>
  );
}
