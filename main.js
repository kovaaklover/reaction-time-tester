const { app, BrowserWindow } = require("electron");

let mainWindow;
app.commandLine.appendSwitch('disable-gpu'); // Forces CPU rendering for potentially lower latency in simple apps

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    frame: true,            // Keeps title bar & close/minimize buttons
    maximizable: true,
    resizable: true,        // Optional: Set to false if you don’t want resizing
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false // Prevents throttling for consistent performance
    }
  });

  // Option 1: Maximize to fill screen while keeping frame (recommended for usability)
  mainWindow.maximize();
  mainWindow.loadFile("index.html");   // <<< you need this
});