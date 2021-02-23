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

//Width and height
var menuW = document.getElementById("menu").offsetWidth;
// var w = document.getElementById("content").offsetWidth + menuW;
// var h = document.getElementById("content").offsetHeight;
var w = (document.body.offsetWidth + menuW) / 2;
var h = document.body.offsetHeight;


//Original data
var dataURL = "https://raw.githubusercontent.com/marcosd3souza/marcosd3souza.github.io/main/data/"

onDataChange()

function onDataChange() {

    d3.select("svg").remove();

    var datasetName = document.querySelector('input[name="dataset"]:checked').value;
    var method = document.querySelector('input[name="method"]:checked').value;
    var cutoff = document.querySelector('input[name="cutoff"]').value;
    
    fetch(dataURL+datasetName+"/"+method+"/"+cutoff+".json")
      .then(response => response.json())
      .then(json => draw(json));
}


function draw(dataset) {

    //Create SVG element
    var svg = d3.select("#graph")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

    //Initialize a simple force layout, using the nodes and edges in dataset
    force = d3.forceSimulation(dataset.nodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(dataset.edges))
        .force("center", d3.forceCenter().x(w).y(h));
        // .force("center", d3.forceCenter().x(1000).y(500));
    
    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    
    //Create edges as lines
    var edges = svg.selectAll("line")
        .data(dataset.edges)
        .enter()
        .append("line")
        .style("stroke", "#ccc")
        .style("stroke-width", 1);
    
    //Create nodes as circles
    var nodes = svg.selectAll("circle")
        .data(dataset.nodes)
        .enter()
        .append("circle")
        .attr("r", 8)
        .style("fill", function (d, i) {
            return colors(i);
        })
        .call(d3.drag()  //Define what to do on drag events
            .on("start", dragStarted)
            .on("drag", dragging));
    
    //Add a simple tooltip
    nodes.append("title")
        .text(function (d) {
            return d.name;
        });
    
    //Every time the simulation "ticks", this will be called
    force.on("tick", function () {
    
        // edges.attr("x1", function (d) { if (d.source.x > w) { return w } else { return d.source.x }; })
        //     .attr("y1", function (d) { if (d.source.y > h) { return h } else { return d.source.y } ; })
        //     .attr("x2", function (d) { if (d.target.x > w) { return w } else { return d.target.x } ; })
        //     .attr("y2", function (d) { if (d.target.y > h) { return h } else { return d.target.y } ; });
    
        // nodes.attr("cx", function (d) { if (d.x > w) { return w } else { return d.x } ; })
        //     .attr("cy", function (d) { if (d.y > h) { return h } else { return d.y } ; });


        edges.attr("x1", function (d) { return d.source.x * (h/w) ; })
             .attr("y1", function (d) { return d.source.y * (h/w) ; })
             .attr("x2", function (d) { return d.target.x * (h/w) ; })
             .attr("y2", function (d) { return d.target.y * (h/w) ; });
    
        nodes.attr("cx", function (d) { return d.x * (h/w) ; })
             .attr("cy", function (d) { return d.y * (h/w) ; });
    
    });
}