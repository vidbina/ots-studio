const DEBUG = true;

function log(msg) {
  if(DEBUG == true) console.log(msg);
}

var remote = require('remote'),
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
    .attr('fill', 'red');

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

// add keyboard callback
d3.select(window)
    .on("keydown", keydown);

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

function keydown() {
  switch(d3.event.keyCode) {
    case 79: {
      // TODO: move this logic to main process
      log('reading');
      fs.readFile('file.json', function(err, data) {
        if(err) log('read error');
        if(err) log(err);
        json_data = JSON.parse(data);
        nodes = json_data.nodes;
        links = json_data.links;
        redraw();
      });
      break;
    }
    case 83: { // s for save
      // TODO: move this logic to main process
      log("writing");
      data = {
        nodes: nodes,
        links: links
      };
      fs.writeFile('file.json', JSON.stringify(data), function(err) {
        if(err) log('write failed');
        log('written');
      });
      break;
    }
    default: {
      console.log(d3.event.keyCode);
    }
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
