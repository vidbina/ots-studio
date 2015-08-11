var app = require('app'),
    ipc = require('ipc'),
    //fs = require('fs'),
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
  mainWindow = new BrowserWindow({ width: 1000, height: 600, title: 'OTS Studio'  });

  mainWindow.loadUrl("file://" + __dirname + "/index.html")
  //mainWindow.setRepresentedFilename('/etc/sim.ots');
  //mainWindow.setDocumentEdited(true);
  ipc.on('toggle-dev-tools', function(event, args) {
    mainWindow.toggleDevTools();
    event.returnValue = true
  });
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
