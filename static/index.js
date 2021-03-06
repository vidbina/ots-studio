console.log('Open Trafic Sim Studio');

const DEBUG = true;

function log(msg) {
  console.log('DEBUG ' + DEBUG);
  if(DEBUG == true) console.log(msg);
}

var remote = require('remote'),
    dialog = remote.require('dialog'),
    ipc = require('ipc'),
    fs = remote.require('fs'),
    Menu = remote.require('menu');

var configuration = {};

var width = 960,
    height = 500,
    fill = d3.scale.category20();

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function setSelectedNode(node) {
  selected_node = node;
  selected_link = null;
  if(selected_node) {
    ipc.send('view-properties', selected_node);
  }
}

function setSelectedLink(link) {
  selected_node = null;
  selected_link = link;
  if(selected_link) {
    ipc.send('view-properties', selected_link);
  }
}

// init svg
var outer = d3.select("#chart")
  .append("svg:svg")
    .attr("id", "map")
    .attr("width", width)
    .attr("height", height)
    .attr("pointer-events", "all");

outer
  .call(d3.behavior.zoom().on("zoom", rescale))
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight);

var composition = outer.append('svg:g');
    //.call(d3.behavior.zoom().on("zoom", rescale))
    //.on("dblclick.zoom", null)
var vis = composition.append('svg:g')
  .on("mousemove", mousemove)
  .on("mousedown", mousedown)
  .on("mouseup", mouseup);

var background = vis.append('svg:g')
  .attr('id', 'bg');

background.append('svg:rect')
    .attr('width', width)
    .attr('height', height)
    //.attr('id', 'bg')
    .attr('fill', 'green');

// init force layout
//var force = d3.layout.force()
//    .size([width, height])
//    .nodes([{}]) // initialize with a single node
//    .linkDistance(50)
//    .charge(-200)
//    .on("tick", tick);


// line displayed when dragging new nodes
var drag_line = vis.append("line")
    .attr("class", "drag_line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 0);

// get layout properties
var nodes = [],
    links = [];
//var nodes = force.nodes(),
//    links = force.links(),
var node = vis.selectAll(".node"),
    link = vis.selectAll(".link");

function nodeSelection() { return vis.selectAll(".node"); }
function linkSelection() { return vis.selectAll(".link"); }

function resize() {
  // adapterd from http://bl.ocks.org/mbostock/3355967
  outer.attr("width", window.innerWidth).attr("height", window.innerHeight);
}

// add keyboard callback
d3.select(window)
    .on("keydown", keydown)
    .on("resize", resize);

redraw();

// focus on svg
vis.node().focus();

function update() {
  redraw();
}

function mousedown() {
  if (!mousedown_node && !mousedown_link) {
    // allow panning if nothing is selected
    vis.call(d3.behavior.zoom().on("zoom"), rescale);
    // update();
    return;
  }
}

function mousemove() {
  if (!mousedown_node) return;

  // update drag line
  drag_line
      .attr("x1", mousedown_node.x)
      .attr("y1", mousedown_node.y)
      .attr("x2", d3.svg.mouse(this)[0])
      .attr("y2", d3.svg.mouse(this)[1]);
  update();

}

function mouseup() {
  var point = d3.mouse(this);
  if (mousedown_node) {
    // hide drag line
    drag_line
      .attr("class", "drag_line_hidden")

    if (!mouseup_node) {
      // add node
      var node = {x: point[0], y: point[1]},
        n = nodes.push(node);

      // select new node
      setSelectedNode(node);
      
      // add link to mousedown node
      links.push({source: mousedown_node, target: node});
    }

    redraw();
  } else if (nodes.length == 0) {
    nodes.push({x: point[0], y: point[1]});
    redraw();
  }
  // clear mouse event vars
  resetMouseVars();
}

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

// rescale g
function rescale() {
  trans=d3.event.translate;
  scale=d3.event.scale;

  vis.attr("transform",
      "translate(" + trans + ")"
      + " scale(" + scale + ")");
}

// redraw force layout
function redraw() {
  tick();
  link = link.data(links);

  link.enter().insert("line", ".node")
      .attr("class", "link")
      .on("mousedown", 
        function(d) { 
          mousedown_link = d; 
          if (mousedown_link == selected_link) setSelectedLink(null);
          else setSelectedLink(mousedown_link); 
          redraw(); 
        })

  link.exit().remove();

  link
    .classed("link_selected", function(d) { return d === selected_link; });

  node = node.data(nodes);

  node.enter().insert("circle")
      .attr("class", "node")
      .attr("r", 5)
      .on("mousedown", 
        function(d) { 
          // disable zoom
          vis.call(d3.behavior.zoom().on("zoom"), null);

          mousedown_node = d;
          if (mousedown_node == selected_node) setSelectedNode(null);
          else setSelectedNode(mousedown_node); 

          // reposition drag line
          drag_line
              .attr("class", "link")
              .attr("x1", mousedown_node.x)
              .attr("y1", mousedown_node.y)
              .attr("x2", mousedown_node.x)
              .attr("y2", mousedown_node.y);

          redraw(); 
        })
      .on("mousedrag",
        function(d) {
          redraw();
        })
      .on("mouseup", 
        function(d) { 
          if (mousedown_node) {
            mouseup_node = d; 
            if (mouseup_node == mousedown_node) { resetMouseVars(); return; }

            // add link
            var link = {source: mousedown_node, target: mouseup_node};
            links.push(link);

            // select new link
            setSelectedLink(link);

            // enable zoom
            vis.call(d3.behavior.zoom().on("zoom"), rescale);
            redraw();
          } 
        })
    .transition()
      .duration(750)
      .ease("elastic")
      .attr("r", 6.5);

  node.exit().transition()
      .attr("r", 0)
    .remove();

  node
    .classed("node_selected", function(d) { return d === selected_node; });

  if (d3.event) {
    // prevent browser's default behavior
    d3.event.preventDefault();
  }

  //force.start();
  tick();
}

function spliceLinksForNode(node) {
  toSplice = links.filter(
    function(l) { 
      return (l.source === node) || (l.target === node); });
  toSplice.map(
    function(l) {
      links.splice(links.indexOf(l), 1); });
}

function uriImage(data, type) {
  return("data:image/" + type + ";base64," + data);
}

// TODO: change ./png.js to ./images.js
var graphic = require('../src/png.js');
function loadImages(images) {
  for(var i = 0; f = images[i]; i++) {
    fs.readFile(__dirname + "/" + f, function(err, data) {
      if(data) {
      var image = graphic.PngImage(data);
      background.append('svg:image')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        //.attr('id', 'background-image')
        .attr('x', 240)
        .attr('y', 0)
        .attr('width', image.width)
        .attr('height', image.height)
        .attr('xlink:href', image.uri);
      }
    });
  }
}

var currentFilename = null;
function loadSystem(filename) {
  dialog.showOpenDialog({
    properties: [ 'openFile' ],
    filters: [ { name: 'JSON', extensions: ['json'] } ]
  }, function(filenames) {
    currentFilename = filenames[0];
    if(currentFilename) {
      fs.readFile(currentFilename, function(err, data) {
        if(err) log('read error');
        if(err) log(err);
        json_data = JSON.parse(data);
        nodes = json_data.nodes;
        links = json_data.links;
        redraw();
      });
    }
  });
}

function saveSystem(filename) {
  data = {
    nodes: nodes,
    links: links
  };
  fs.writeFile(currentFilename, JSON.stringify(data), function(err) {
    if(err) log('write failed');
    log('written');
  });
}

var ret = null;
function keydown() {
  switch(d3.event.keyCode) {
    case 73: { loadImages(['bg.png']); break; } // i for image
    case 79: { loadSystem('file.json'); break; } // o for open
    case 80: { ipc.sendSync('show-properties-window'); break; } // p show properties window
    case 83: { saveSystem('file.json'); break; } // s for save
    case 191: { ret = ipc.sendSync('toggle-dev-tools'); break; } // ? for dev tools
    default: { console.log(d3.event.keyCode); }
  }

  if (!selected_node && !selected_link) return;
  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: { // delete
      if (selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
      }
      else if (selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      setSelectedLink(null);
      redraw();
      break;
    }
  }
}

var actions = {
  openFile: function(args) { 
    loadSystem('file.json'); 
  },
  saveFile: function(args) { 
    //saveSystem('file.json'); 
  },
  showLayers: function(args) { loadImages(['bg.png']); },
  showProperties: function(args) { ipc.sendSync('show-properties-window'); },
  startSimulation: function(args) { console.log('sim'); }
}
