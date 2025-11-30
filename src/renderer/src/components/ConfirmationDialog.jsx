import React from 'react';
import '../styles/ConfirmationDialog.css';

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Подтверждение", 
  message = "Вы уверены?" 
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirmation-overlay" onClick={onClose}>
      <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-header">
          <h3 className="confirmation-title">{title}</h3>
        </div>
        <div className="confirmation-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-footer">
          <button 
            className="confirmation-btn confirmation-btn-cancel" 
            onClick={onClose}
          >
            Отмена
          </button>
          <button 
            className="confirmation-btn confirmation-btn-confirm" 
            onClick={handleConfirm}
          >
            Да, удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;




