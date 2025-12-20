const { app, BrowserWindow } = require("electron");

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    frame: true,            // keep title bar & close/minimize buttons
    maximizable: true,
    resizable: true,        // optional, can set false if you don’t want resizing
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.maximize();     // immediately fills the screen
  mainWindow.loadFile("index.html");
});