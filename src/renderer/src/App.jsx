import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ComponentList from './components/ComponentList';
import ModalAddComponent from './components/ModalAddComponent';
import SearchResults from './components/SearchResults';
import './styles/App.css';
import chipIcon from './assets/picto-chip.png';

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [componentVersion, setComponentVersion] = useState(0);

  // Функция для сброса поиска
  const handleClearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
  };

  // Обработчик выбора компонента
  const handleComponentSelect = (component) => {
    setSelectedComponent(component);
    handleClearSearch(); // Сбрасываем поиск при выборе компонента
  };

  // Обработчик выбора категории
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    handleClearSearch(); // Сбрасываем поиск при выборе категории
  };

  // Обработчик редактирования компонента
  const handleEditComponent = (component) => {
    console.log('Редактирование компонента:', component);
    setEditingComponent(component);
    setIsEditModalOpen(true);
  };

  // Обработчик сохранения компонента
  const handleSaveComponent = async (componentData) => {
    try {
      console.log('💾 Saving component:', componentData);

      const result = await window.api.database.updateComponent(componentData);

      if (result.success) {
        console.log('✅ Component updated successfully');

        // Обновляем выбранный компонент
        if (selectedComponent && selectedComponent.id === componentData.id) {
          const updatedComponent = await window.api.database.getComponent(componentData.id);
          setSelectedComponent({ ...updatedComponent });
          setComponentVersion(prev => prev + 1);

          console.log('🔄 Updated component data:', updatedComponent);
          console.log('🔄 Previous component data:', selectedComponent);

          //setSelectedComponent(updatedComponent);
          //setSelectedComponent(componentData);
        }

        return { success: true };
      } else {
        console.error('❌ Failed to update component:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error saving component:', error);
      throw error;
    }
  };

  // Закрытие модального окна редактирования
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingComponent(null);
  };

  // Обработчик обновления компонента
  const handleComponentUpdated = (updatedComponent) => {
    if (selectedComponent && selectedComponent.id === updatedComponent.id) {
      setSelectedComponent(updatedComponent);
    }
  };

  // Функция для обработки поиска
  const handleSearch = async (query) => {
    if (!query.trim()) {
      handleClearSearch();
      return;
    }

    try {
      console.log('🔍 Searching for:', query);
      const results = await window.api.database.searchComponents(query);
      console.log('🔍 Search results:', results);
      
      setSearchResults(results);
      setSearchQuery(query);
      setSelectedComponent(null); // Сбрасываем выбранный компонент
    } catch (error) {
      console.error('❌ Search error:', error);
      alert('Ошибка при выполнении поиска');
    }
  };

  // Функция для получения категорий
  const getCategories = () => {
    // TODO: Заменить на реальное получение категорий из базы данных
    return [
      { id: 1, name: 'Транзисторы' },
      { id: 2, name: 'Резисторы' },
      { id: 3, name: 'Конденсаторы' },
      { id: 4, name: 'Микросхемы' },
      { id: 5, name: 'Диоды' }
    ];
  };

  return (
    <div className="app">
      <Sidebar
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        onComponentSelect={handleComponentSelect}
        onComponentUpdated={handleComponentUpdated}
        onSearch={handleSearch}
      />

      <main className="main-content">
        <div className="content-wrapper">
          {searchResults ? (
            <SearchResults
              searchResults={searchResults}
              searchQuery={searchQuery}
              onComponentSelect={handleComponentSelect}
              onEdit={handleEditComponent}
              onClearSearch={handleClearSearch}
            />
          ) : selectedComponent ? (
            <ComponentList
              category={selectedCategory}
              component={selectedComponent}
              onEdit={handleEditComponent}
              version={componentVersion}
            />
          ) : selectedCategory ? (
            <div className="welcome-message">
              <img src={chipIcon} alt="Микросхема" className="welcome-icon" />
              <h1>Выберите компонент из категории "{selectedCategory.name}"</h1>
              <p>или создайте новый компонент</p>
              <div className="divider"></div>
            </div>
          ) : (
            <div className="welcome-message">
              <img src={chipIcon} alt="Микросхема" className="welcome-icon" />
              <h1>Выберите компонент для просмотра</h1>
              <p>или создайте новый компонент</p>
              <div className="divider"></div>
            </div>
          )}
        </div>
      </main>



    


      
      {/* Модальное окно редактирования компонента */}
      <ModalAddComponent
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveComponent}
        categories={getCategories()}
        editMode={true}
        componentData={editingComponent}
      />
    </div>
  );
}

export default App;

// import { useEffect } from 'react'
// import electronLogo from './assets/electron.svg'

// function App() {
//   useEffect(() => {
//     (async (data="test") => await window.api.foo(data))()
//   }, [])


//   return (
//     <>
//       <img alt="logo" className="logo" src={electronLogo} />
//       <h1>Hello, world!</h1>
//     </>
//   )
// }

// export default App

