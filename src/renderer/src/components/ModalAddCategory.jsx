import React, { useState, useEffect } from 'react';
import '../styles/ModalAddCategory.css';

const ModalAddCategory = ({ isOpen, onClose, onSave, editMode = false, initialName = '' }) => {
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');

  // Сбрасываем состояние при открытии/закрытии модального окна
  useEffect(() => {
    if (isOpen) {
      setCategoryName(initialName);
      setError('');
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setError('Введите название категории');
      return;
    }

    onSave(categoryName.trim());
    setCategoryName('');
    setError('');
  };

  const handleClose = () => {
    setCategoryName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editMode ? 'Переименовать категорию' : 'Добавить категорию'}
          </h2>
          <button 
            type="button" 
            className="modal-close-btn"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="categoryName" className="form-label">
                Название категории
              </label>
              <input
                type="text"
                className={`form-control ${error ? 'form-control-error' : ''}`}
                id="categoryName"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setError('');
                }}
                placeholder="Введите название категории"
                autoFocus
              />
              {error && <div className="form-error">{error}</div>}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editMode ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAddCategory;
