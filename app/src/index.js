import React from 'react';
import ReactDOM from 'react-dom';
import './assets/css/index.css';
import Scene from './components/Scene.js'
import Interface from './components/Interface.js'

ReactDOM.render(<Scene />, document.getElementById('container'));
ReactDOM.render(<Interface />, document.getElementById('interface'))