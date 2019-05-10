'use strict';

(function () {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope

  // load data and make scatter plot after window loads
  window.onload = function () {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 800)
      .attr('height', 500);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    // d3.csv("./data/Seasons (SimpsonsData).csv")
    //   .then((csvData) => {
    //     data = csvData;
    //     makeBarChart(data);
    //   })

    d3.json("./data/Seasons.json")
      .then((jsonData) => {
        data = jsonData;
        makeBarChart(data);
      })
  }

  // make scatter plot with trend line
  function makeBarChart(data) {

    // get arrays of year data and Avg. Viewers (mil) data
    let years = data.map((row) => row["Year"]);
    let avgView = data.map((row) => parseFloat(row["Avg. Viewers (mil)"]));
    console.log(years);
    // find data limits
    let axesLimits = findMinMax(years, avgView);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, years, avgView);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // plot trend line
    plotAveLine(years, avgView, axesLimits, mapFunctions)

    // draw title and axes labels
    makeLabels();

    // make legend
    makeLegend();
  }

  function makeLegend() {
    svgContainer.append("rect")
      .attr("x", 600)
      .attr("y", 35)
      .attr("width", 150)
      .attr("height", 60)
      .style("stroke", "black")
      .style("fill", "none")
      .style("stroke-width", 1);

    svgContainer.append("text")
      .attr("x", 605)
      .attr("y", 50)
      .text("Viewership Data");

    svgContainer.append("rect")
      .attr("x", 605)
      .attr("y", 60)
      .attr("width", 10)
      .attr("height", 10)
      .style("stroke", "black")
      .style("fill", "blue")
      .style("stroke-width", 1);

    svgContainer.append("rect")
      .attr("x", 605)
      .attr("y", 80)
      .attr("width", 10)
      .attr("height", 10)
      .style("stroke", "black")
      .style("fill", "grey")
      .style("stroke-width", 1);

    svgContainer.append("text")
      .attr("x", 620)
      .attr("y", 70)
      .text("Acutal");

    svgContainer.append("text")
      .attr("x", 620)
      .attr("y", 90)
      .text("Estimated");
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    let colorSelect = function (d) {
      if (d["Data"] == "Actual") {
        return "blue";
      } else {
        return "grey";
      }
    }

    svgContainer.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr('x', function (d) {
        return xMap(d);
      })
      .attr('y', function (d) {
        return yMap(d);
      })
      .attr("width", map.xScale.bandwidth())
      .attr("height", function (d) {
        return 450 - yMap(d);
      })
      .style("fill", function (d) { return colorSelect(d) })
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html("Season #" + d["Year"] +
          "<br/>Year: " + d["Year"] +
          "<br/>Episodes: " + d["Episodes"] +
          "<br/>Avg. Viewers (mil): " + d["Avg. Viewers (mil)"] +
          "<br/>Most watched episode: " + d["Most watched episode"] +
          "<br/>Viewers (mil): " + d["Viewers (mil)"])
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px")
          .style("width", "200px")
          .style("height", "100px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    svgContainer.selectAll(".text")
      .data(data)
      .enter().append("text")
      .attr("class", "bar")
      .attr("text-anchor", "middle")
      .attr("x", function (d) { return xMap(d) + map.xScale.bandwidth() / 2; })
      .attr("y", function (d) { return yMap(d) - 10; })
      .text(function (d) { return d["Avg. Viewers (mil)"]; });
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    let xValue = function (d) { return d["Year"]; }

    // function to scale x value
    let xScale = d3.scaleBand()
      .range([50, 750])
      .padding(0.2);
    xScale.domain(x);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    let xAxis = d3.axisBottom().scale(xScale);
    // plot x-axis at bottom of SVG
    svgContainer.append("g")
      .attr("transform", "translate(0," + 450 + ")")
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d["Avg. Viewers (mil)"] };

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 4, 0]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Average Viewership By Season");

    svgContainer.append('text')
      .attr('x', 250)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Avg. Viewers (mil)');
  }

  function plotAveLine(years, avgView, limits, scale) {

    let ave = avgView.reduce((total, amount) => total + amount) / avgView.length;
    ave = ave.toFixed(1);
    console.log(ave);

    let yScale = scale.yScale;
    // console.log(scale);

    svgContainer.selectAll('.aveLine')
      .data(ave)
      .enter()
      .append('line')
      .attr('x1', 50)
      .attr("y1", function (d) { return yScale(ave); })
      .attr("x2", 750)
      .attr("y2", function (d) { return yScale(ave); })
      .attr('stroke', '#CDCDCD')
      .attr('stroke-width', 1.5)
      .style("stroke-dasharray", ("3, 3"));

    let yPosition = yScale(ave);

    svgContainer.append("rect")
      .attr("x", 60)
      .attr("y", yPosition - 20)
      .attr("width", 30)
      .attr("height", 20)
      .attr("fill-opacity", "0.8")
      .style("fill", 'white');

    svgContainer.append("text")
      .attr("x", 60)
      .attr("y", yPosition - 5)
      .text(ave);
  }

})();
