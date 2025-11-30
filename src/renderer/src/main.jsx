import './assets/main.css'

import { StrictMode } from 'react'
import { Routes, Route, HashRouter } from 'react-router'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <HashRouter>
  //   <StrictMode>
  //     <Routes>
  //       <Route path='/' element={<App/>}/>
  //     </Routes>
  //   </StrictMode>
  // </HashRouter>

  <StrictMode>
    <App />
  </StrictMode>
)
