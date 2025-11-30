import React from 'react';
import { FaEdit } from 'react-icons/fa';
import '../styles/SearchResults.css';

const PencilIcon = ({ size = 16, color = 'currentColor', className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
  );
};

const SearchResults = ({ searchResults, searchQuery, onComponentSelect, onEdit }) => {
  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="search-results">
        <div className="search-results-header">
          <h2>Результаты поиска</h2>
          <p className="search-query">По запросу: "{searchQuery}"</p>
        </div>
        <div className="no-results">
          <i className="fas fa-search fa-3x mb-3"></i>
          <h4>Ничего не найдено</h4>
          <p>Попробуйте изменить поисковый запрос</p>
        </div>
      </div>
    );
  }

  const handleComponentClick = (component) => {
    if (onComponentSelect) {
      onComponentSelect(component);
    }
  };

  const handleEditClick = (component, e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(component);
    }
  };

  return (
    <div className="search-results">
      <div className="search-results-header">
        <h2>Результаты поиска</h2>
        <p className="search-query">По запросу: "{searchQuery}"</p>
        <p className="results-count">Найдено: {searchResults.length} компонентов</p>
      </div>

      <div className="search-results-list">
        {searchResults.map((component) => (
          <div
            key={component.id}
            className="search-result-item"
            onClick={() => handleComponentClick(component)}
          >
            <div className="result-item-content">
              <div className="result-item-main">
                <h3 className="result-item-name">{component.name}</h3>
                <p className="result-item-category">{component.category_name}</p>
                {component.storage_cell && (
                  <p className="result-item-storage">Ячейка: {component.storage_cell}</p>
                )}
                {component.description && (
                  <p className="result-item-description">{component.description}</p>
                )}
              </div>
              <div className="result-item-meta">
                <span className="result-item-quantity">Количество: {component.quantity || 0}</span>
                <button
                  className="btn-edit-result"
                  onClick={(e) => handleEditClick(component, e)}
                  title="Редактировать компонент"
                >
                  {/* <PencilIcon size={14} color="white" /> */}
                  <FaEdit size={14} />
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
