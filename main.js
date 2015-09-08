var app = require('app'),
    ipc = require('ipc'),
    //fs = require('fs'),
    BrowserWindow = require('browser-window'),
    Menu = require('menu'),
    menuTemplate = require('./src/menu.js');

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

  //var appIcon = new Tray('resources/icon.png');
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  mainWindow = new BrowserWindow({ 
    width: 1000, 
    "min-width": 700,
    height: 600, 
    "min-height": 500,
    fullscreen: false,
    icon: "resources/icon.png",
    //"center": true,
    x: 300,
    y: 50,
    title: 'OTS Studio',
    type: "desktop"
  });

  propertiesWindow = null; 

  mainWindow.loadUrl("file://" + __dirname + "/static/index.html")
  //mainWindow.setRepresentedFilename('/etc/sim.ots');
  //mainWindow.setDocumentEdited(true);
  ipc.on('toggle-dev-tools', function(event, args) {
    mainWindow.toggleDevTools();
    event.returnValue = true
  });
  ipc.on('toggle-properties-dev-tools', function(event, args) {
    mainWindow.toggleDevTools();
    event.returnValue = true
  });
  ipc.on('quit', function(event, args) {
    app.quit();
  });
  ipc.on('show-properties-window', function(event, args) {
    propertiesWindow = new BrowserWindow({
      "width": 200,
      "height": 600,
      "resizable": false,
      "center": true,
      "x": 50,
      "y": 50,
      "title": "Properties",
      "type": "dock",
      show: false
    });
    propertiesWindow.show();
    propertiesWindow.loadUrl("file://" + __dirname + "/properties.html");
  });
  var selectedProperties = null;
  ipc.on('view-properties', function(event, args) {
    log('view props');
    log(args);
    selectedProperties = args;
    if(propertiesWindow) {
      propertiesWindow.webContents.send('display-properties', selectedProperties);
    }
  });
  mainWindow.on('closed', function() {
    mainWindow = null;
    if(propertiesWindow) propertiesWindow.close();
  });
});
