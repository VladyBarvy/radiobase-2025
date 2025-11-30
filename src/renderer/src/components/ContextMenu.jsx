import React from 'react';
import '../styles/ContextMenu.css';

const ContextMenu = ({ x, y, isOpen, onClose, onRename, onDelete }) => {
  if (!isOpen) return null;

  const handleRename = () => {
    onRename();
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
        className="context-menu" 
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="context-menu-item" onClick={handleRename}>
          Переименовать
        </button>
        <button className="context-menu-item context-menu-item-delete" onClick={handleDelete}>
          Удалить
        </button>
      </div>
    </>
  );
};

export default ContextMenu;

