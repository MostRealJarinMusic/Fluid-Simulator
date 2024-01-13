//Back end

import * as path from 'path';
import { app, BrowserWindow, Menu } from 'electron';

const isMac: boolean = process.platform === 'darwin';
const isDev: boolean = process.env.NODE_ENV !== 'production';

// Standard boilerplate - main window
function createMainWindow(): void {
    const mainWindow = new BrowserWindow({
        title: 'Fluid Simulator',
        width: isDev ? 1500 : 1000,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    // Dev tools
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile('./index.html');
}

// App is ready to run
app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Boilerplate - closing the application
app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});

// Menu template
const menu: Electron.MenuItemConstructorOptions[] = [
    /*{
        role: 'fileMenu',
    },*/
];