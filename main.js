var app = require('app'),
    BrowserWindow = require('browser-window'),
    Menu = require('menu');

var DEBUG = true;

var log = function(str) {
  if(DEBUG) { console.log(str); }
}

log("OTS Studio");

//console.log(Menu);

/*
var dockMenu = Menu.buildFromTemplate([
  { label: 'New Simulation', click: function() { console.log("sim"); } }
]);
app.dock.setMenu(dockMenu);
*/


app.on('window-all-closed', function() {
  log("closing app");
  app.quit();
  //if (process.platform != 'darwin') app.quit();
});

app.on('enter-full-screen', function() {
  log("full screen");
});

// just get the app ready
app.on('ready', function() {
  log("ready");
  mainWindow = new BrowserWindow({ width: 500, height: 300, title: 'OTS Studio'  });

  mainWindow.loadUrl("file://" + __dirname + "/index.html")
  //mainWindow.setRepresentedFilename('/etc/sim.ots');
  //mainWindow.setDocumentEdited(true);
  mainWindow.openDevTools();
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
