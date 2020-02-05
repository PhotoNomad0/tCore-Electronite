import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './js/pages/root';
import * as serviceWorker from './serviceWorker';
import {createElectronHandler, registerLogHandler} from './logger';
import fs from "fs-extra";
import path from "path-extra";

// forward logs to electron's main thread
registerLogHandler(createElectronHandler('log-event'));

// log versions
console.log('Electron', process.versions.electron);
console.log('Chrome', process.versions.chrome);
console.log('Node', process.versions.node);

// const currentPath = path.join('.');
// const files = fs.readdirSync(currentPath);
// console.log('files: ' + JSON.stringify(files));
const srcPath = path.join('./src');
const files2 = fs.readdirSync(srcPath);
console.log(srcPath + ': ' + JSON.stringify(files2));


ReactDOM.render(<App/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
