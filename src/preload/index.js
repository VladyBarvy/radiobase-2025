import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  database: {
    // Категории
    getCategories: () => ipcRenderer.invoke('database:getCategories'),
    addCategory: (name) => ipcRenderer.invoke('database:addCategory', name),
    updateCategory: (id, name) => ipcRenderer.invoke('database:updateCategory', id, name),
    deleteCategory: (id) => ipcRenderer.invoke('database:deleteCategory', id),
    
    // Компоненты
    getComponents: (categoryId) => ipcRenderer.invoke('database:getComponents', categoryId),
    getComponent: (id) => ipcRenderer.invoke('database:getComponent', id),
    addComponent: (componentData) => ipcRenderer.invoke('database:addComponent', componentData),
    updateComponent: (componentData) => ipcRenderer.invoke('database:updateComponent', componentData),
    deleteComponent: (id) => ipcRenderer.invoke('database:deleteComponent', id),
    
    // Поиск
    searchComponents: (query) => ipcRenderer.invoke('database:searchComponents', query),

    testSimpleAdd: (data) => ipcRenderer.invoke('test-simple-add', data)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}




// import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// const api = {
  
// }

// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   window.electron = electronAPI
//   window.api = api
// }
