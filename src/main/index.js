import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import connectionDataBase from './db';

let dbClient;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ===== API КАТЕГОРИЙ =====

async function getCategories() {
  try {
    const result = await dbClient.query("SELECT * FROM categories ORDER BY name");
    return result.rows;
  } catch (error) {
    console.error('❌ Ошибка получения категорий:', error);
    return [];
  }
}

async function addCategory(name) {
  if (!name || !name.trim()) {
    return { success: false, error: "Название категории не может быть пустым" };
  }

  try {
    const result = await dbClient.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING id",
      [name.trim()]
    );

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('❌ Ошибка добавления категории:', error);

    if (error.code === '23505') { // UNIQUE violation
      return {
        success: false,
        error: "Категория с таким названием уже существует"
      };
    }

    return {
      success: false,
      error: "Ошибка добавления категории"
    };
  }
}

async function updateCategory(id, name) {
  if (!name || !name.trim()) {
    return { success: false, error: "Название категории не может быть пустым" };
  }

  try {
    const result = await dbClient.query(
      "UPDATE categories SET name = $1 WHERE id = $2",
      [name.trim(), id]
    );

    if (result.rowCount > 0) {
      return { success: true };
    }

    return {
      success: false,
      error: "Категория не найдена"
    };
  } catch (error) {
    console.error('❌ Ошибка обновления категории:', error);
    return {
      success: false,
      error: "Ошибка обновления категории"
    };
  }
}

async function deleteCategory(id) {
  try {
    const result = await dbClient.query("DELETE FROM categories WHERE id = $1", [id]);

    return {
      success: result.rowCount > 0,
      error: result.rowCount === 0 ? "Категория не найдена" : null
    };
  } catch (error) {
    console.error('❌ Ошибка удаления категории:', error);
    return {
      success: false,
      error: "Ошибка удаления категории"
    };
  }
}

// ===== API КОМПОНЕНТОВ =====

async function getComponents(categoryId = null) {
  try {
    let query, params;

    if (categoryId) {
      query = `
        SELECT c.*, cat.name as category_name 
        FROM components c 
        LEFT JOIN categories cat ON c.category_id = cat.id 
        WHERE c.category_id = $1 
        ORDER BY c.name
      `;
      params = [categoryId];
    } else {
      query = `
        SELECT c.*, cat.name as category_name 
        FROM components c 
        LEFT JOIN categories cat ON c.category_id = cat.id 
        ORDER BY c.name
      `;
      params = [];
    }

    const result = await dbClient.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Ошибка получения компонентов:', error);
    return [];
  }
}

async function getComponent(id) {
  try {
    const result = await dbClient.query(`
      SELECT c.*, cat.name as category_name 
      FROM components c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const component = result.rows[0];

    // PostgreSQL уже возвращает JSONB как объект, но на всякий случай
    if (component.parameters && typeof component.parameters === 'string') {
      try {
        component.parameters = JSON.parse(component.parameters);
      } catch (error) {
        console.error('❌ JSON parse error:', error);
        component.parameters = {};
      }
    } else if (component) {
      component.parameters = component.parameters || {};
    }

    return component;
  } catch (error) {
    console.error('❌ Ошибка получения компонента:', error);
    return null;
  }
}

// async function addComponent(componentData) {
//   if (!componentData.category_id || !componentData.name?.trim()) {
//     return { success: false, error: "Категория и название компонента обязательны" };
//   }

//   try {
//     const result = await dbClient.query(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//       RETURNING id
//     `, [
//       componentData.category_id,
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       componentData.updated_at || new Date().toISOString(),
//       componentData.parameters || {},
//       componentData.image_data || null,
//       componentData.description?.trim() || null
//     ]);

//     return { success: true, id: result.rows[0].id };
//   } catch (error) {
//     console.error('❌ Ошибка добавления компонента:', error);
//     return { success: false, error: "Ошибка добавления компонента" };
//   }
// }












// async function addComponent(componentData) {
//   console.log('🔍 DEBUG addComponent - входные данные:', JSON.stringify(componentData, null, 2));

//   if (!componentData.category_id || !componentData.name?.trim()) {
//     console.error('❌ Валидация не пройдена: category_id или name пустые');
//     return { success: false, error: "Категория и название компонента обязательны" };
//   }

//   try {
//     console.log('🔄 Подготовка параметров для SQL...');

//     const params = [
//       parseInt(componentData.category_id), // убедимся что это число
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       componentData.updated_at || new Date().toISOString(),
//       componentData.parameters || {},
//       componentData.image_data || null,
//       componentData.description?.trim() || null
//     ];

//     console.log('📋 SQL параметры:', params);

//     const query = `
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//       RETURNING id
//     `;

//     console.log('🚀 Выполнение SQL:', query);

//     const result = await dbClient.query(query, params);

//     console.log('✅ Компонент успешно добавлен, ID:', result.rows[0].id);
//     return { success: true, id: result.rows[0].id };

//   } catch (error) {
//     console.error('❌ Ошибка добавления компонента в БД:', error);
//     console.error('🔍 Детали ошибки:', {
//       message: error.message,
//       code: error.code,
//       detail: error.detail,
//       table: error.table,
//       constraint: error.constraint,
//       stack: error.stack
//     });

//     // Более информативные ошибки
//     let errorMessage = "Ошибка добавления компонента";
//     if (error.code === '23503') {
//       errorMessage = "Указанная категория не существует";
//     } else if (error.code === '23505') {
//       errorMessage = "Компонент с таким названием уже существует";
//     } else if (error.code === '22P02') {
//       errorMessage = "Неверный формат данных (возможно, проблема с JSON параметрами)";
//     }

//     return { success: false, error: errorMessage };
//   }
// }













// async function addComponent(componentData) {
//   console.log('🔍 addComponent ВЫЗВАНА с данными:', JSON.stringify(componentData, null, 2));
  
//   if (!componentData.category_id || !componentData.name?.trim()) {
//     console.error('❌ Валидация не пройдена: category_id или name пустые');
//     return { success: false, error: "Категория и название компонента обязательны" };
//   }

//   try {
//     console.log('🔄 Подготовка параметров для SQL...');
    
//     const params = [
//       parseInt(componentData.category_id),
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       componentData.updated_at || new Date().toISOString(),
//       componentData.parameters || {},
//       componentData.image_data || null,
//       componentData.description?.trim() || null
//     ];
    
//     console.log('📋 SQL параметры:', params);
    
//     const result = await dbClient.query(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//       RETURNING id
//     `, params);

//     console.log('✅ Компонент успешно добавлен, ID:', result.rows[0].id);
//     return { success: true, id: result.rows[0].id };
    
//   } catch (error) {
//     console.error('❌ Ошибка добавления компонента в БД:', error);
//     console.error('🔍 Детали ошибки:', {
//       message: error.message,
//       code: error.code,
//       detail: error.detail,
//       table: error.table,
//       constraint: error.constraint
//     });
    
//     let errorMessage = "Ошибка добавления компонента";
//     if (error.code === '23503') {
//       errorMessage = "Указанная категория не существует";
//     } else if (error.code === '23505') {
//       errorMessage = "Компонент с таким названием уже существует";
//     } else if (error.code === '22P02') {
//       errorMessage = "Неверный формат данных";
//     }
    
//     return { success: false, error: errorMessage };
//   }
// }














async function addComponent(componentData) {
  console.log('🔍 addComponent ВЫЗВАНА с данными:', JSON.stringify(componentData, null, 2));
  
  if (!componentData.category_id || !componentData.name?.trim()) {
    console.error('❌ Валидация не пройдена: category_id или name пустые');
    return { success: false, error: "Категория и название компонента обязательны" };
  }

  try {
    console.log('🔄 Подготовка параметров для SQL...');
    
    const params = [
      parseInt(componentData.category_id),
      componentData.name.trim(),
      componentData.storage_cell?.trim() || null,
      componentData.datasheet_url?.trim() || null,
      Math.max(0, parseInt(componentData.quantity) || 0),
      componentData.parameters || {},
      componentData.image_data || null,
      componentData.description?.trim() || null
    ];
    
    console.log('📋 SQL параметры:', params);
    
    const result = await dbClient.query(`
      INSERT INTO components 
      (category_id, name, storage_cell, datasheet_url, quantity, parameters, image_data, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, params);

    console.log('✅ Компонент успешно добавлен, ID:', result.rows[0].id);
    return { success: true, id: result.rows[0].id };
    
  } catch (error) {
    console.error('❌ Ошибка добавления компонента в БД:', error);
    console.error('🔍 Детали ошибки:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      constraint: error.constraint
    });
    
    let errorMessage = "Ошибка добавления компонента";
    if (error.code === '23503') {
      errorMessage = "Указанная категория не существует";
    } else if (error.code === '23505') {
      errorMessage = "Компонент с таким названием уже существует";
    } else if (error.code === '22P02') {
      errorMessage = "Неверный формат данных";
    } else if (error.code === '42703') {
      errorMessage = "Ошибка структуры БД: отсутствует колонка";
    }
    
    return { success: false, error: errorMessage };
  }
}







// async function updateComponent(componentData) {
//   if (!componentData.id) {
//     return { success: false, error: "ID компонента обязателен для обновления" };
//   }

//   try {
//     const result = await dbClient.query(`
//       UPDATE components 
//       SET category_id = $1, name = $2, storage_cell = $3, datasheet_url = $4, 
//           quantity = $5, updated_at = $6, parameters = $7, image_data = $8, description = $9
//       WHERE id = $10
//     `, [
//       componentData.category_id,
//       componentData.name,
//       componentData.storage_cell,
//       componentData.datasheet_url,
//       componentData.quantity,
//       new Date().toISOString(),
//       componentData.parameters || {},
//       componentData.image_data,
//       componentData.description,
//       componentData.id
//     ]);

//     return {
//       success: true,
//       changes: result.rowCount,
//       error: result.rowCount === 0 ? "Компонент не найден" : null
//     };
//   } catch (error) {
//     console.error('❌ Ошибка обновления компонента:', error);
//     return {
//       success: false,
//       error: "Ошибка обновления компонента"
//     };
//   }
// }



async function updateComponent(componentData) {
  if (!componentData.id) {
    return { success: false, error: "ID компонента обязателен для обновления" };
  }

  try {
    const result = await dbClient.query(`
      UPDATE components 
      SET category_id = $1, name = $2, storage_cell = $3, datasheet_url = $4, 
          quantity = $5, parameters = $6, image_data = $7, description = $8
      WHERE id = $9
    `, [
      componentData.category_id,
      componentData.name,
      componentData.storage_cell,
      componentData.datasheet_url,
      componentData.quantity,
      componentData.parameters || {},
      componentData.image_data,
      componentData.description,
      componentData.id
    ]);

    return { 
      success: true, 
      changes: result.rowCount,
      error: result.rowCount === 0 ? "Компонент не найден" : null
    };
  } catch (error) {
    console.error('❌ Ошибка обновления компонента:', error);
    return { 
      success: false, 
      error: "Ошибка обновления компонента" 
    };
  }
}







async function deleteComponent(id) {
  try {
    const result = await dbClient.query("DELETE FROM components WHERE id = $1", [id]);

    return {
      success: result.rowCount > 0,
      error: result.rowCount === 0 ? "Компонент не найдена" : null
    };
  } catch (error) {
    console.error('❌ Ошибка удаления компонента:', error);
    return {
      success: false,
      error: "Ошибка удаления компонента"
    };
  }
}

// ===== ПОИСК И ФИЛЬТРАЦИЯ =====

async function searchComponents(query) {
  if (!query?.trim()) return [];

  try {
    const searchTerm = `%${query.trim()}%`;
    const result = await dbClient.query(`
      SELECT c.*, cat.name as category_name 
      FROM components c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE c.name ILIKE $1 OR c.storage_cell ILIKE $2 OR cat.name ILIKE $3 OR c.description ILIKE $4
      ORDER BY c.name
    `, [searchTerm, searchTerm, searchTerm, searchTerm]);

    return result.rows;
  } catch (error) {
    console.error('❌ Ошибка поиска компонентов:', error);
    return [];
  }
}

// ===== РЕГИСТРАЦИЯ IPC ОБРАБОТЧИКОВ =====

// function setupDatabaseHandlers() {
//   // Категории
//   ipcMain.handle('database:getCategories', getCategories);
//   ipcMain.handle('database:addCategory', (_, name) => addCategory(name));
//   ipcMain.handle('database:updateCategory', (_, id, name) => updateCategory(id, name));
//   ipcMain.handle('database:deleteCategory', (_, id) => deleteCategory(id));

//   // Компоненты
//   ipcMain.handle('database:getComponents', (_, categoryId) => getComponents(categoryId));
//   ipcMain.handle('database:getComponent', (_, id) => getComponent(id));
//   ipcMain.handle('database:addComponent', (_, componentData) => addComponent(componentData));
//   ipcMain.handle('database:updateComponent', (_, componentData) => updateComponent(componentData));
//   ipcMain.handle('database:deleteComponent', (_, id) => deleteComponent(id));

//   // Поиск
//   ipcMain.handle('database:searchComponents', (_, query) => searchComponents(query));


//   // Простой тестовый обработчик
//   ipcMain.handle('test-simple-add', async (_, data) => {
//     console.log('🧪 TEST: Данные получены в main процессе:', data);

//     try {
//       const result = await dbClient.query(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, quantity, parameters) 
//       VALUES ($1, $2, $3, $4, $5)
//       RETURNING id
//     `, [data.category_id, data.name, data.storage_cell, data.quantity, data.parameters]);

//       console.log('🧪 TEST: Успешно добавлен, ID:', result.rows[0].id);
//       return { success: true, id: result.rows[0].id };
//     } catch (error) {
//       console.error('🧪 TEST: Ошибка:', error);
//       return { success: false, error: error.message };
//     }
//   });
// }



// function setupDatabaseHandlers() {
//   console.log('🔄 Регистрация IPC обработчиков...');
  
//   // Сначала удалим старые обработчики если есть
//   const handlers = [
//     'database:getCategories',
//     'database:addCategory',
//     'database:updateCategory', 
//     'database:deleteCategory',
//     'database:getComponents',
//     'database:getComponent',
//     'database:addComponent',
//     'database:updateComponent',
//     'database:deleteComponent',
//     'database:searchComponents'
//   ];
  
//   // Удаляем старые обработчики
//   handlers.forEach(handler => {
//     if (ipcMain.listenerCount(handler) > 0) {
//       ipcMain.removeAllListeners(handler);
//       console.log(`🗑️ Удален старый обработчик: ${handler}`);
//     }
//   });
  
//   // Регистрируем новые обработчики
//   try {
//     // Категории
//     ipcMain.handle('database:getCategories', getCategories);
//     ipcMain.handle('database:addCategory', (_, name) => addCategory(name));
//     ipcMain.handle('database:updateCategory', (_, id, name) => updateCategory(id, name));
//     ipcMain.handle('database:deleteCategory', (_, id) => deleteCategory(id));
    
//     // Компоненты
//     ipcMain.handle('database:getComponents', (_, categoryId) => getComponents(categoryId));
//     ipcMain.handle('database:getComponent', (_, id) => getComponent(id));
//     ipcMain.handle('database:addComponent', (_, componentData) => addComponent(componentData));
//     ipcMain.handle('database:updateComponent', (_, componentData) => updateComponent(componentData));
//     ipcMain.handle('database:deleteComponent', (_, id) => deleteComponent(id));
    
//     // Поиск
//     ipcMain.handle('database:searchComponents', (_, query) => searchComponents(query));
    
//     console.log('✅ Все обработчики зарегистрированы');
    
//     // Проверим что зарегистрировалось
//     const registered = ipcMain.eventNames().filter(name => name.toString().startsWith('database:'));
//     console.log(`📋 Зарегистрировано обработчиков: ${registered.length}`);
//     registered.forEach(name => console.log(`   ✅ ${name}`));
    
//   } catch (error) {
//     console.error('❌ Ошибка регистрации обработчиков:', error);
//   }
// }






function setupDatabaseHandlers() {
  console.log('🔄 Регистрация IPC обработчиков...');
  
  try {
    // Категории
    ipcMain.handle('database:getCategories', getCategories);
    ipcMain.handle('database:addCategory', (_, name) => addCategory(name));
    ipcMain.handle('database:updateCategory', (_, id, name) => updateCategory(id, name));
    ipcMain.handle('database:deleteCategory', (_, id) => deleteCategory(id));
    
    // Компоненты
    ipcMain.handle('database:getComponents', (_, categoryId) => getComponents(categoryId));
    ipcMain.handle('database:getComponent', (_, id) => getComponent(id));
    ipcMain.handle('database:addComponent', (_, componentData) => addComponent(componentData));
    ipcMain.handle('database:updateComponent', (_, componentData) => updateComponent(componentData));
    ipcMain.handle('database:deleteComponent', (_, id) => deleteComponent(id));
    
    // Поиск
    ipcMain.handle('database:searchComponents', (_, query) => searchComponents(query));
    
    console.log('✅ IPC обработчики зарегистрированы');
    
    // Простая проверка
    console.log(`📋 Зарегистрировано обработчиков database:*: ${ipcMain._eventsCount || 'unknown'}`);
    
  } catch (error) {
    console.error('❌ Ошибка регистрации обработчиков:', error);
  }
}











// Добавьте эту функцию для проверки БД
async function checkDatabaseConnection() {
  try {
    const result = await dbClient.query('SELECT NOW() as current_time');
    console.log('✅ Подключение к БД активно:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error);
    return false;
  }
}





// Добавьте эту функцию для проверки IPC
function debugIPCHandlers() {
  console.log('🔍 Проверка зарегистрированных IPC обработчиков:');

  const handlers = [
    'database:getCategories',
    'database:addCategory',
    'database:updateCategory',
    'database:deleteCategory',
    'database:getComponents',
    'database:getComponent',
    'database:addComponent',
    'database:updateComponent',
    'database:deleteComponent',
    'database:searchComponents'
  ];

  handlers.forEach(handler => {
    const isRegistered = ipcMain.eventNames().includes(handler);
    console.log(`${isRegistered ? '✅' : '❌'} ${handler}: ${isRegistered ? 'зарегистрирован' : 'НЕ зарегистрирован'}`);
  });
}



// app.whenReady().then(async () => {
//   electronApp.setAppUserModelId('com.electron')

//   // Инициализируем БД
//   dbClient = await connectionDataBase();
//   console.log('✅ PostgreSQL подключена');


//   // Проверяем подключение
//   await checkDatabaseConnection();

//   // Настраиваем обработчики
//   setupDatabaseHandlers();
//   console.log('✅ IPC обработчики зарегистрированы');

//   // Проверяем IPC обработчики
//   debugIPCHandlers();

//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   createWindow()

//   app.on('activate', function () {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })

// }
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  // Инициализируем БД
  dbClient = await connectionDataBase();
  console.log('✅ PostgreSQL подключена');

  // Добавляем предустановленные категории
  //await initializeDefaultCategories();

  // Настраиваем обработчики
  setupDatabaseHandlers();
  console.log('✅ IPC обработчики зарегистрированы');

  // Проверяем IPC обработчики
  debugIPCHandlers();

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Дополнительная проверка после создания окна
  setTimeout(() => {
    console.log('🔍 Финальная проверка обработчиков после создания окна:');
    debugIPCHandlers();
  }, 1000);
})





app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})










// import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'

// import connectionDataBase from './db';





// function createWindow() {
//   const mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false
//     }
//   })

//   // Запуск в полноэкранном режиме
//   mainWindow.maximize()

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }
// }

// app.whenReady().then(async () => {
//   electronApp.setAppUserModelId('com.electron')

//   global.dbclient = await connectionDataBase();

//   ipcMain.handle('sendSignal', foo)

//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   createWindow()

//   app.on('activate', function () {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })
