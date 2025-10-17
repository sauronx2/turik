const { app, BrowserWindow, Tray, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow = null;
let tray = null;
let backendProcess = null;
let frontendProcess = null;
let isFrontendRunning = false;

const isDev = process.env.NODE_ENV === 'development';

// Get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Check if port is available
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();

        server.once('error', () => {
            resolve(false);
        });

        server.once('listening', () => {
            server.close();
            resolve(true);
        });

        server.listen(port);
    });
}

// Start backend server
function startBackend() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting backend server...');

        const appPath = app.getAppPath();
        const serverPath = isDev
            ? path.join(__dirname, '..', 'server', 'index.js')
            : path.join(appPath, 'server', 'index.js');

        console.log('🔍 App path:', appPath);
        console.log('🔍 Server path:', serverPath);
        console.log('🔍 Node version:', process.version);

        // In production, use Electron's built-in Node
        if (!isDev) {
            try {
                const serverModule = require(serverPath);
                console.log('✅ Backend server loaded via require');
                resolve();
                return;
            } catch (error) {
                console.error('❌ Failed to load backend:', error);
                reject(error);
                return;
            }
        }

        // In dev mode, spawn node process
        backendProcess = spawn('node', [serverPath], {
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'development' },
            shell: false
        });

        backendProcess.stdout.on('data', (data) => {
            console.log(`[Backend] ${data.toString()}`);
            if (data.toString().includes('Server running')) {
                resolve();
            }
        });

        backendProcess.stderr.on('data', (data) => {
            console.error(`[Backend Error] ${data.toString()}`);
        });

        backendProcess.on('close', (code) => {
            console.log(`Backend process exited with code ${code}`);
        });

        setTimeout(resolve, 2000);
    });
}

// Start frontend server for network access
function startFrontendServer() {
    return new Promise(async (resolve, reject) => {
        if (isFrontendRunning) {
            console.log('⚠️ Frontend server already running');
            return resolve({ success: true, message: 'Вже запущено' });
        }

        // Check if port 5173 is available
        const portAvailable = await isPortAvailable(5173);
        if (!portAvailable) {
            console.error('❌ Port 5173 is already in use');
            return reject({
                success: false,
                message: 'Порт 5173 зайнятий',
                details: 'Закрийте інші програми що використовують порт 5173'
            });
        }

        console.log('🚀 Starting frontend server...');

        if (isDev) {
            // In dev mode, use Vite dev server
            const clientPath = path.join(__dirname, '..', 'client');
            const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

            frontendProcess = spawn(npmCmd, ['run', 'dev'], {
                cwd: clientPath,
                stdio: 'pipe',
                shell: true,
                env: { ...process.env, NODE_ENV: 'development' }
            });

            frontendProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[Frontend] ${output}`);

                if (output.includes('Local:') || output.includes('ready in')) {
                    isFrontendRunning = true;
                    const localIP = getLocalIPAddress();
                    console.log(`✅ Frontend server ready at http://${localIP}:5173`);
                    resolve({
                        success: true,
                        message: `Сервер запущений`,
                        url: `http://${localIP}:5173`
                    });
                }
            });

            frontendProcess.stderr.on('data', (data) => {
                const output = data.toString();
                console.error(`[Frontend Error] ${output}`);
            });

            frontendProcess.on('close', (code) => {
                console.log(`Frontend process exited with code ${code}`);
                isFrontendRunning = false;
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!isFrontendRunning) {
                    reject({
                        success: false,
                        message: 'Timeout: сервер не запустився',
                        details: 'Vite dev server не відповідає'
                    });
                }
            }, 10000);
        } else {
            // In production, use simple Express static server
            try {
                const express = require('express');
                const staticApp = express();
                const distPath = path.join(app.getAppPath(), 'client', 'dist');

                console.log('📁 Serving static files from:', distPath);

                // Serve static files
                staticApp.use(express.static(distPath));

                // SPA fallback - always serve index.html
                staticApp.get('*', (req, res) => {
                    res.sendFile(path.join(distPath, 'index.html'));
                });

                const staticServer = staticApp.listen(5173, '0.0.0.0', () => {
                    isFrontendRunning = true;
                    const localIP = getLocalIPAddress();
                    console.log(`✅ Static server running at http://${localIP}:5173`);
                    resolve({
                        success: true,
                        message: 'Сервер запущений',
                        url: `http://${localIP}:5173`
                    });
                });

                staticServer.on('error', (error) => {
                    console.error('❌ Static server error:', error);
                    reject({
                        success: false,
                        message: 'Помилка запуску сервера',
                        details: error.message
                    });
                });

                // Store server reference for cleanup
                frontendProcess = { server: staticServer };
            } catch (error) {
                console.error('❌ Failed to start static server:', error);
                reject({
                    success: false,
                    message: 'Помилка запуску',
                    details: error.message
                });
            }
        }
    });
}

// Stop frontend server
function stopFrontendServer() {
    return new Promise((resolve) => {
        if (!frontendProcess || !isFrontendRunning) {
            console.log('⚠️ Frontend server not running');
            return resolve({ success: true, message: 'Сервер не запущений' });
        }

        console.log('🛑 Stopping frontend server...');

        if (isDev && frontendProcess.kill) {
            // Dev mode: kill process
            frontendProcess.kill();
        } else if (frontendProcess.server && frontendProcess.server.close) {
            // Production: close Express server
            frontendProcess.server.close(() => {
                console.log('✅ Static server closed');
            });
        }

        isFrontendRunning = false;
        resolve({ success: true, message: 'Сервер зупинений' });
    });
}

// Create main window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        backgroundColor: '#f9fafb',
        titleBarStyle: 'default',
        title: 'Турнір'
    });

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        const distPath = path.join(app.getAppPath(), 'client', 'dist');
        const htmlPath = path.join(distPath, 'index.html');

        console.log('📄 App path:', app.getAppPath());
        console.log('📄 Dist path:', distPath);
        console.log('📄 Loading HTML from:', htmlPath);

        // Use loadURL with file:// protocol to properly handle assets
        mainWindow.loadURL(`file://${htmlPath}`);

        // Don't open DevTools by default in production
        // User can open with F12 or from menu
    }

    // F12 to toggle DevTools
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools();
            }
        }
    });

    // Log any loading errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ Failed to load:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('✅ Page loaded successfully');
    });

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[WebContents] ${message}`);
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Don't close on window close, minimize to tray instead
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

// Create tray icon
function createTray() {
    const trayIconPath = path.join(__dirname, 'icon.png');
    tray = new Tray(trayIconPath);

    const localIP = getLocalIPAddress();

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '🏆 Турнір',
            enabled: false
        },
        { type: 'separator' },
        {
            label: '📡 Адреса для підключення',
            submenu: [
                {
                    label: `http://${localIP}:5173`,
                    click: () => {
                        const { clipboard } = require('electron');
                        clipboard.writeText(`http://${localIP}:5173`);
                    }
                },
                {
                    label: 'Копіювати адресу',
                    click: () => {
                        const { clipboard } = require('electron');
                        clipboard.writeText(`http://${localIP}:5173`);
                    }
                }
            ]
        },
        { type: 'separator' },
        {
            label: 'Показати вікно',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: 'Відкрити в браузері',
            click: () => {
                shell.openExternal('http://localhost:5173');
            }
        },
        { type: 'separator' },
        {
            label: 'Вийти',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Турнір');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
        } else {
            createWindow();
        }
    });
}

// App ready
app.whenReady().then(async () => {
    console.log('🚀 Electron app starting...');

    // Start backend
    await startBackend();

    // In dev mode, wait for Vite to be ready
    if (isDev) {
        console.log('⏳ Waiting for Vite dev server...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Create window and tray
    createWindow();
    createTray();

    console.log('✅ App ready!');

    // Show IP address in console
    const localIP = getLocalIPAddress();
    console.log(`\n📡 Адреса для підключення: http://${localIP}:5173\n`);
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    // On macOS, keep app running in tray
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Cleanup on quit
app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('will-quit', () => {
    // Kill backend process
    if (backendProcess) {
        backendProcess.kill();
    }
    // Kill frontend process (dev or prod)
    if (frontendProcess) {
        if (frontendProcess.kill) {
            // Dev mode: kill spawned process
            frontendProcess.kill();
        } else if (frontendProcess.server && frontendProcess.server.close) {
            // Production: close Express server
            frontendProcess.server.close(() => {
                console.log('✅ Static server closed on quit');
            });
        }
    }
});

// Handle IPC messages
ipcMain.handle('get-local-ip', () => {
    return getLocalIPAddress();
});

ipcMain.handle('start-dev-server', async () => {
    try {
        const result = await startFrontendServer();
        return result;
    } catch (error) {
        return error;
    }
});

ipcMain.handle('stop-dev-server', async () => {
    try {
        const result = await stopFrontendServer();
        return result;
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('get-server-status', () => {
    return {
        isRunning: isFrontendRunning,
        url: isFrontendRunning ? `http://${getLocalIPAddress()}:5173` : null
    };
});
