import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import reportWebVitals from './reportWebVitals'

// import './game.css'
import { NavTree } from 'react-navtree'
import App from './App'
import './game.sass'
// At the bootstrap phase (before rendering the app):

const navTree = new NavTree()
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <HashRouter>
    <App tree={navTree}/>
  </HashRouter> // Switch to BrowserRouter if deploying somewhere other than github pages
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()