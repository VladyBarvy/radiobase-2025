import React from 'react';
import '../styles/ContextMenuComponent.css';

const ContextMenuComponent = ({ 
  x, 
  y, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}) => {
  if (!isOpen) return null;

  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div 
        className="context-menu-component" 
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="context-menu-item" onClick={handleEdit}>
          Редактировать
        </button>
        <button className="context-menu-item context-menu-item-delete" onClick={handleDelete}>
          Удалить
        </button>
      </div>
    </>
  );
};

export default ContextMenuComponent;
