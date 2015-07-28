const DEBUG = true;

function log(msg) {
  if(DEBUG == true) console.log(msg);
}

var remote = require('remote'),
    ipc = require('ipc'),
    fs = remote.require('fs');

var width = 960,
    height = 500,
    fill = d3.scale.category20();

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

// init svg
var outer = d3.select("#chart")
  .append("svg:svg")
    .attr("id", "map")
    .attr("width", width)
    .attr("height", height)
    .attr("pointer-events", "all");

var vis = outer
  .append('svg:g')
    .call(d3.behavior.zoom().on("zoom", rescale))
    .on("dblclick.zoom", null)
  .append('svg:g')
    .on("mousemove", mousemove)
    .on("mousedown", mousedown)
    .on("mouseup", mouseup);

vis.append('svg:rect')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'bg')
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
  log(window.innerWidth);
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
  log("MOUSEUP");
  var point = d3.mouse(this);
  if (mousedown_node) {
    log("started somewhere");
    // hide drag line
    drag_line
      .attr("class", "drag_line_hidden")

    if (!mouseup_node) {
      // add node
      var node = {x: point[0], y: point[1]},
        n = nodes.push(node);

      // select new node
      selected_node = node;
      selected_link = null;
      
      // add link to mousedown node
      links.push({source: mousedown_node, target: node});
    }

    redraw();
  } else if (nodes.length == 0) {
    log("setup a initial node at " + point[0] + ", " + point[1]);
    nodes.push({x: point[0], y: point[1]});
    log(nodeSelection());
    log("done here");
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
  log("|");
  log(link);
  log(nodeSelection());
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
  log('redrawing');
  link = link.data(links);

  link.enter().insert("line", ".node")
      .attr("class", "link")
      .on("mousedown", 
        function(d) { 
          mousedown_link = d; 
          if (mousedown_link == selected_link) selected_link = null;
          else selected_link = mousedown_link; 
          selected_node = null; 
          redraw(); 
        })

  link.exit().remove();

  link
    .classed("link_selected", function(d) { return d === selected_link; });

  console.log(nodes);
  node = node.data(nodes);

  node.enter().insert("circle")
      .attr("class", "node")
      .attr("r", 5)
      .on("mousedown", 
        function(d) { 
          console.log("DOWN");
          // disable zoom
          vis.call(d3.behavior.zoom().on("zoom"), null);

          mousedown_node = d;
          console.log(d);
          console.log("x = "+ +d.x + ", y = " + d.y);
          if (mousedown_node == selected_node) selected_node = null;
          else selected_node = mousedown_node; 
          selected_link = null; 

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
          console.log("x = "+ d.x + ", y = " + d.y);
          redraw();
        })
      .on("mouseup", 
        function(d) { 
          console.log("UP");
          if (mousedown_node) {
            mouseup_node = d; 
            if (mouseup_node == mousedown_node) { resetMouseVars(); return; }

            // add link
            var link = {source: mousedown_node, target: mouseup_node};
            links.push(link);

            // select new link
            selected_link = link;
            selected_node = null;

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

  log(nodeSelection());
  log('end redraw');

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

var image_base64 = null;
function loadImages(images) {
  for(var i = 0; f = images[i]; i++) {
    log('reading ' + f);
    fs.readFile(f, function(err, data) {
      log('busy');
      image_base64 = data.toString('base64');
      log('read ' + image_base64.length);
      //full_image = "data:image/jpg;base64,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";
      //full_image = "data:image/jpeg;base64,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";
      //image = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      //log('data:image/png;charset=UTF-8;base64,' + image);
      d3.select('#map').append('svg:image')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        //.attr('id', 'background-image')
        .attr('x', 240)
        .attr('y', 0)
        .attr('width', 915)
        .attr('height', 468)
        .attr('xlink:href', uriImage(image_base64, 'png'));
    });
//    var reader = new FileReader();
//    reader.onload = (function(file) {
//      log("returning function");
//      return function(e) {
//        log("function e");
//        log(e);
//        return null;
//      };
//    })(f);
//    reader.readAsDataURL(f);
  }
}

function loadSystem(filename) {
  fs.readFile(filename, function(err, data) {
    if(err) log('read error');
    if(err) log(err);
    json_data = JSON.parse(data);
    nodes = json_data.nodes;
    links = json_data.links;
    redraw();
  });
}

function saveSystem(filename) {
  data = {
    nodes: nodes,
    links: links
  };
  fs.writeFile(filename, JSON.stringify(data), function(err) {
    if(err) log('write failed');
    log('written');
  });
}

function keydown() {
  switch(d3.event.keyCode) {
    case 73: { loadImages(['bg.png']); break; } // i for image
    case 79: { loadSystem('file.json'); break; } // o for open
    case 83: { saveSystem('file.json'); break; } // s for save
    case 191: { ipc.sendSync('toggle-dev-tools'); break; } // ? for dev tools
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
      selected_link = null;
      selected_node = null;
      redraw();
      break;
    }
  }
}
