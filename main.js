var app = require('app');
var BrowserWindow = require('browser-window')

console.log("OTS Studio");

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({ width: 500, height: 300, title: 'OTS Studio'  });

  mainWindow.openDevTools();
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
