var dragStarted = function (event, d) {
    force.alphaTarget(0.7).restart();
    d.fx = d.x;
    d.fy = d.y;
}

var dragging = function (event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

var force;
// var w = document.getElementById("content").offsetWidth + menuW;
// var h = document.getElementById("content").offsetHeight;

// var w = (document.body.offsetWidth + menuW) / 2;
// var h = document.body.offsetHeight;

// var w = document.body.offsetWidth/1.2;
// var h = document.body.offsetHeight * 1.3;

var w = window.innerWidth;
var h = window.innerHeight;

var cicleRadius = 10;

var widthDrawArea = document.querySelector("#graph").offsetWidth;
var heightDrawArea = h * 0.8;
var w_min = cicleRadius; 
var w_max = widthDrawArea * 0.95;

var h_min = cicleRadius;
var h_max = heightDrawArea * 0.95;

var centerX = (w_max - cicleRadius) / 2;
var centerY = (h_max - cicleRadius) / 2;

function getBestX(currentX) {
    var bestX = currentX;

    if (bestX < w_min) {
        bestX = w_min;
    } else if (bestX > w_max) {
        bestX = w_max;
    }

    return  bestX; 
}

function getBestY(currentY) {
    var bestY = currentY;

    if (bestY < h_min) {
        bestY = h_min;
    } else if (bestY > h_max) {
        bestY = h_max;
    }

    return  bestY; 
}

//Original data
// var dataURL = "https://raw.githubusercontent.com/marcosd3souza/marcosd3souza.github.io/main/data/"
var dataURL = "https://raw.githubusercontent.com/marcosd3souza/data-visualization-project/refs/heads/main/data/"

onDataChange()

function onDataChange() {

    var datasetName = document.querySelector('input[name="dataset"]:checked').value;
    var method = document.querySelector('input[name="method"]:checked').value;
    var cutoff = document.querySelector('input[name="cutoff"]').value;
    
    fetch(dataURL+datasetName+"/"+method+"/"+cutoff+".json")
      .then(response => response.json())
      .then(json => makeVisualizations(json));
}

function makeVisualizations(json) {

    d3.select("#graph").select("*").remove();
    d3.select("#heatmap").select("*").remove();
    // d3.select("#sankey").select("*").remove();

    drawGraph(json);
    drawHeatmap(json);
    // drawSankey(json);
}

function drawGraph(data) {

    var numberOfGroups = [...new Set(data.nodes.map((n) => n.group))].length;

    //Create SVG element
    var svg = d3.select("#graph")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
    
    svg.append('text')
        .attr("x", (w_max * 0.90))
        .attr("y", h_min + cicleRadius)
        .attr('font-family', 'Arial')
        .attr('font-size', function(d) { return 12 })
        .text("number of communities: " + numberOfGroups);

    //Initialize a simple force layout, using the nodes and edges in dataset
    force = d3.forceSimulation(data.nodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(data.links))
        .force("center", d3.forceCenter().x(centerX).y(centerY));
        // .force("center", d3.forceCenter().x(1000).y(500));
    
    var colors = d3.scaleOrdinal(d3.schemeCategory10);    
    
    //Create edges as lines
    var edges = svg.selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .style("stroke", "#ccc")
        .style("stroke-width", 1);
    
    //Create nodes as circles
    var nodes = svg.selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", cicleRadius)
        .style("fill", function (d, i) {
            return colors(d.group);
        })
        .call(d3.drag()  //Define what to do on drag events
            .on("start", dragStarted)
            .on("drag", dragging));
    
    //Add a simple tooltip
    nodes.append("title")
        .text(function (d) {
            return "object: " + d.name + "\ngroup: " + (d.group + 1);
        });
    
    //Every time the simulation "ticks", this will be called
    force.on("tick", function () {
    
        // edges.attr("x1", function (d) { if (d.source.x > w) { return w } else { return d.source.x }; })
        //     .attr("y1", function (d) { if (d.source.y > h) { return h } else { return d.source.y } ; })
        //     .attr("x2", function (d) { if (d.target.x > w) { return w } else { return d.target.x } ; })
        //     .attr("y2", function (d) { if (d.target.y > h) { return h } else { return d.target.y } ; });
    
        // nodes.attr("cx", function (d) { if (d.x > w) { return w } else { return d.x } ; })
        //     .attr("cy", function (d) { if (d.y > h) { return h } else { return d.y } ; });


        edges.attr("x1", function (d) { return getBestX(d.source.x) ; })
            
            .attr("y1", function (d) { return getBestY(d.source.y) ; })
             .attr("x2", function (d) { return getBestX(d.target.x) ; })
             .attr("y2", function (d) { return getBestY(d.target.y) ; });
    
        nodes.attr("cx", function (d) { return getBestX(d.x) ; })
             .attr("cy", function (d) { return getBestY(d.y) ; });
    
    });
}

function drawHeatmap(data) {
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 0, bottom: 10, left: 30},
    width = w_max,
    height = w_max;

    var x = d3.scaleBand([0, width]),
    z = d3.scaleLinear().domain([0, 4]).clamp(true),
    c = d3.scaleOrdinal(d3.schemeCategory10);

    var matrix = [],
        nodes = data.nodes,
        n = nodes.length;
    
    //Create SVG element
    var svg = d3.select("#heatmap").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
    // Compute index per node.
    nodes.forEach(function(node, i) {
      node.index = i;
      node.count = 0;
      matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
    });
  
    // Convert links to matrix; count character occurrences.
    data.links.forEach(function(link) {
      matrix[link.source.index][link.target.index].z += link.value;
      matrix[link.target.index][link.source.index].z += link.value;
      matrix[link.source.index][link.source.index].z += link.value;
      matrix[link.target.index][link.target.index].z += link.value;
      nodes[link.source.index].count += link.value;
      nodes[link.target.index].count += link.value;
    });
  
    // Precompute the orders.
    var orders = {
      name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
      count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
      group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
    };
  
    // The default sort order.
    x.domain(orders.name);
  
    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);
  
    var row = svg.selectAll(".row")
        .data(matrix)
      .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
        .each(row);
  
    row.append("line")
        .attr("x2", width);
  
    row.append("text")
        .attr("x", -6)
        .attr("y", x.bandwidth() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .text(function(d, i) { return nodes[i].name; });
  
    var column = svg.selectAll(".column")
        .data(matrix)
      .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
  
    column.append("line")
        .attr("x1", -width);
  
    column.append("text")
        .attr("x", 6)
        .attr("y", x.bandwidth() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function(d, i) { return nodes[i].name; });
  
    function row(row) {
      var cell = d3.select(this).selectAll(".cell")
          .data(row.filter(function(d) { return d.z; }))
        .enter().append("rect")
          .attr("class", "cell")
          .attr("x", function(d) { return x(d.x); })
          .attr("width", x.bandwidth())
          .attr("height", x.bandwidth())
          .style("fill-opacity", function(d) { return z(d.z); })
          .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
          .on("mouseover", mouseover)
          .on("mouseout", mouseout);
    }
  
    function mouseover(p) {
      d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
      d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
    }
  
    function mouseout() {
      d3.selectAll("text").classed("active", false);
    }
  
    d3.select("#order").on("change", function() {
      clearTimeout(timeout);
      order(this.value);
    });
  
    function order(value) {
      x.domain(orders[value]);
  
      var t = svg.transition().duration(2500);
  
      t.selectAll(".row")
          .delay(function(d, i) { return x(i) * 4; })
          .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
        .selectAll(".cell")
          .delay(function(d) { return x(d.x) * 4; })
          .attr("x", function(d) { return x(d.x); });
  
      t.selectAll(".column")
          .delay(function(d, i) { return x(i) * 4; })
          .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
    }
  
    var timeout = setTimeout(function() {
      order("group");
    //   d3.select("#order").property("selectedIndex", 2).node().focus();
    }, 3000);
}

function drawSankey(data) {

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = d3.select("#sankey")
                  .append("svg")
                  .attr("viewBox", [0, 0, w, h]);

    svg.append("g")
        .attr("stroke", "#000")
        .selectAll("rect")
        .data(data.nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", color)
        .append("title")
        .text(d => `${d.name}\n${format(d.value)}`);

    const link = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll("g")
        .data(data.links)
        .join("g")
        .style("mix-blend-mode", "multiply");

    if (edgeColor === "path") {
        const gradient = link.append("linearGradient")
            .attr("id", d => (d.uid = DOM.uid("link")).id)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", d => d.source.x1)
            .attr("x2", d => d.target.x0);

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d => color(d.source));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d => color(d.target));
    }

    link.append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => edgeColor === "none" ? "#aaa"
            : edgeColor === "path" ? d.uid 
            : edgeColor === "input" ? color(d.source) 
            : color(d.target))
        .attr("stroke-width", d => Math.max(1, d.width));

    link.append("title")
        .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

    svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("text")
        .data(data.nodes)
        .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name);
}
