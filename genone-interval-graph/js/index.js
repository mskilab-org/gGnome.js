// The configuration parameters
// The Golden Ratio
var phi = 1.618;
var deviation = 2;
var offset = 2;
var slope = 0.25;
var throttleTimer; //used for redrawing upon resize
var totalWidth, totalHeight, width, height, plotsHeight;
var margins = {top: 20, bottom: 50, left: 30, right: 30, gap: 20, bar: 10, legendFontSize: 14, legendHeight: 150, chromosomeContainerHeight: 30, chromobuttonsHeight: 30, chromoAxis: 38, legendGap: 10};
var colorScale = d3.scaleOrdinal(d3.schemeCategory10.concat(d3.schemeCategory20b));
// define the line
var line = d3.line().curve(d3.curveBasis).x(function(d) { return d[0]; }).y(function(d) { return d[1]; });

var metadata = data.metadata.reduce(function(hash, elem){ hash[elem.chromosome] = elem; return hash }, {});
var intervalBins = data.intervals.reduce(function(hash, elem){ hash[elem.iid] = elem; return hash }, {});
var connectionBins = data.connections.reduce(function(hash, elem){ 
  hash[elem.cid] = {
    connection: elem,
    source: intervalBins[Math.abs(elem.source)],
    sink: intervalBins[Math.abs(elem.sink)]
  }; 
  return hash; }, {});
var localConnectionChromosomeBins = data.connections.reduce(function(hash, elem){
  var source = connectionBins[elem.cid].source;
  var sink = connectionBins[elem.cid].sink;
  if (source.chromosome === sink.chromosome) {
    if (!hash[source.chromosome]) {
      hash[source.chromosome] = [];
    }
    hash[source.chromosome].push(elem);
  }
  return hash; }, {});

// The actual drawing
draw();

d3.select(window).on('resize', throttle);

function draw() {
  // Clear any existing svg
  d3.select('#plot-container svg').remove();

  totalWidth = $('#plot-container').width();
  totalHeight = $(window).height();
  width = totalWidth - margins.left - margins.right;
  height = totalHeight - margins.top - margins.bottom;
  plotsHeight = height - margins.legendHeight - margins.gap;

  // The SVG hosting the visualisation
  var svg = d3.select('#plot-container').append('svg').attr('class', 'plot').attr('width', totalWidth).attr('height', totalHeight);

  var panels = data.metadata.slice(0,3).map(function(d,i) { var elem = Object.assign({}, d); elem.column = i; return elem;});

  var panelContainerWidth = (width - (panels.length - 1) * margins.gap) / panels.length;

  drawFilters();

  var yScale = d3.scaleLinear().domain([0, 10]).range([plotsHeight, 0]).nice();
  var yAxis = d3.axisLeft(yScale).ticks(10, 's');

  // Controls container
  drawControls();

  // Add the panels
  var panelsContainer = svg.append('g')
    .attr('class', 'panels-container')
    .attr('transform', 'translate(' + [margins.left, height - plotsHeight] + ')');
  
  panelsContainer.append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', 'translate(' + [0, 0] + ')')
    .call(yAxis);

  updatePanels(panels);

  // Add the legend
  var legendContainer = svg.append('g')
    .attr('class', 'legend-container')
    .attr('transform', 'translate(' + [margins.left, margins.top] + ')');

  updateLegend(panels);

  function drawFilters() {
    var defs = svg.append('defs');

    defs.append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', panelContainerWidth)
      .attr('height', plotsHeight);

    // create filter and assign provided id
    var filter = defs.append('filter')
      .attr('height', '125%') // adjust this if shadow is clipped
      .attr('id', 'md-shadow');

    // ambient shadow into ambientBlur
    //   may be able to offset and reuse this for cast, unless modified
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', deviation)
      .attr('result', 'ambientBlur');

    // cast shadow into castBlur
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', deviation)
      .attr('result', 'castBlur');

    // offsetting cast shadow into offsetBlur
    filter.append('feOffset')
      .attr('in', 'castBlur')
      .attr('dx', offset - 1)
      .attr('dy', offset)
      .attr('result', 'offsetBlur');

    // combining ambient and cast shadows
    filter.append('feComposite')
      .attr('in', 'ambientBlur')
      .attr('in2', 'offsetBlur')
      .attr('result', 'compositeShadow');

    // applying alpha and transferring shadow
    filter.append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', slope);

    // merging and outputting results
    var feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');
  }

  function drawControls() {

    var controlsContainer = svg.append('g')
      .attr('class', 'controls-container')
      .attr('transform', 'translate(' + [margins.left, margins.top] + ')');

    var chromoControls = controlsContainer.selectAll('g.control-container')
      .data(d3.range(panels.length).map(function(d,i) { return {column: i}}), function(d,i) { return d.column })
      .enter()
      .append('g')
      .attr('class', function(d,i) { return 'control-container column-' + i })
      .attr('transform', function(d,i) { return 'translate(' + [i * (panelContainerWidth + margins.gap), 0] + ')'; })

    var chromoButtonContainer = chromoControls
      .append('g')
      .attr('class', 'chromo-buttons-group')
      .selectAll('g.chromo-button-container')
      .data(data.metadata, function(d,i) { return 'column-' + d.column + 'chromo-' + d.chromosome})
      .enter()
      .append('g')
      .attr('class', 'chromo-button-container')
      .attr('transform', function(d,i) { return 'translate(' + [i * (panelContainerWidth -  margins.chromobuttonsHeight)/ (data.metadata.length - 1), ((i + 1) % 2) * margins.chromobuttonsHeight] + ')' });

    chromoButtonContainer.append('circle')
      .attr('class', 'chromo-circle')
      .classed('selected', function(d,i) { 
        var column = d3.select(d3.select(d3.select(this.parentNode).node().parentNode).node().parentNode).datum().column;
        return  panels[column].chromosome === d.chromosome;
      })
      .attr('cx', 0.5 * margins.chromobuttonsHeight)
      .attr('cy', 0.5 * margins.chromobuttonsHeight)
      .attr('r', 0.5 * margins.chromobuttonsHeight)
      .attr('fill', function(d,i) { return d.color})
      .on('mouseover', function(d,i) {
        d3.select(this).classed('highlight', true);
      })
      .on('mouseout', function(d,i) {
        d3.select(this).classed('highlight', false);
      }).on('click', function(d,i) {
        d3.select(d3.select(this.parentNode).node().parentNode).selectAll('circle').classed('selected', false);
        d3.select(this).classed('selected', true);
        var panelData = d3.select(d3.select(d3.select(this.parentNode).node().parentNode).node().parentNode).datum();
        panels[panelData.column] = Object.assign({}, metadata[d3.select(this).datum().chromosome], {column: panelData.column});
        updatePanels(panels);
        updateLegend(panels);
      });

    chromoButtonContainer.append('text')
      .attr('class', 'button-text')
      .attr('transform', 'translate(' + [0.5 * margins.chromobuttonsHeight, 0.5 * margins.chromobuttonsHeight] + ')')
      .attr('text-anchor', 'middle')
      .attr('dy', 0.33 * margins.legendFontSize)
      .text(function(d,i) { return d.chromosome; });
  }

  function updatePanels(newPanels) {

    var panelContainer = panelsContainer.selectAll('g.panel-container').data(newPanels, function(d,i) { return 'column-' + d.column + ' chromo-' + d.chromosome });

    panelContainer.exit().remove();

    var container = panelContainer
      .enter()
      .append('g')
      .attr('class', function(d,i) { return 'panel-container column-' + d.column + ' chromo-' + d.chromosome })
      .attr('transform', function(d,i) { return 'translate(' + [i * (panelContainerWidth + margins.gap), 0] + ')'; })

    container.append('g')
      .attr('class', 'background-container')
      .attr('transform', 'translate(' + [0, 0] + ')')
      .append('rect')
      .attr('class', 'background')
      .attr('width', panelContainerWidth)
      .attr('height', plotsHeight)
      .style('fill', function(d,i) { return metadata[d.chromosome]; });

    container
      .each(function(d,i) {
        d.scale = d3.scaleLinear().domain([metadata[d.chromosome].startPoint, metadata[d.chromosome].endPoint]).range([0, panelContainerWidth]).nice();
        d.axis = d3.axisBottom(d.scale).tickSize(-plotsHeight).ticks(10, 's');
        d.zoom = d3.zoom().scaleExtent([1, Infinity]).translateExtent([[0, 0], [panelContainerWidth, plotsHeight]]).extent([[0, 0], [panelContainerWidth, plotsHeight]]).on('zoom', function() { return zoomed(d)});
        d3.select(this).append('g')
          .attr('class', 'axis axis--x')
          .attr('transform', 'translate(' + [0, plotsHeight] + ')')
          .call(d.axis)
        .selectAll('text')
          .attr('transform', 'rotate(45)')
        .style('text-anchor', 'start');
      });
    
    container.append('rect')
      .attr('class', 'zoom')
      .attr('width', panelContainerWidth)
      .attr('height', plotsHeight)
      .each(function(d,i) {
         d3.select(this).call(d.zoom);
       });

    container.append('g').attr('class', 'shapes-container');

    container.append('g').attr('class', 'local-connections-container');

  }

  function updateLegend(newPanels) {

    var chromosomeContainer = legendContainer.selectAll('g.chromosome-container').data(newPanels, function(d,i) { return 'column-' + d.column + ' chromo-' + d.chromosome});

    chromosomeContainer.exit().remove();

    var container = chromosomeContainer
      .enter()
      .each(function(d,i) {
        d.scale2 = d3.scaleLinear().domain([metadata[d.chromosome].startPoint, metadata[d.chromosome].endPoint]).range([0, panelContainerWidth]).nice();
        d.axis2 = d3.axisBottom(d.scale2).ticks(10, 's');
      })
      .append('g')
      .attr('class', function(d,i) { return 'chromosome-container column-' + d.column + ' chromosome-' + d.chromosome })
      .attr('transform', function(d,i) { return 'translate(' + [i * (panelContainerWidth + margins.gap), 0] + ')'; })

    container
      .append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(' + [0, margins.legendHeight - margins.chromoAxis - 2] + ')')
      .each(function(d,i) { d3.select(this).call(d.axis2).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start'); })

    container
      .append('g')
      .attr('transform', 'translate(' + [0, margins.legendHeight - margins.chromoAxis - margins.chromosomeContainerHeight - margins.legendGap] + ')')
      .append('rect')
      .attr('class', 'chromosome')
      .attr('width', panelContainerWidth)
      .attr('height', margins.chromosomeContainerHeight)
      .style('opacity', function(d,i) { return 0.8; })
      .style('fill', function(d,i) { return d.color; })
      .style('stroke', function(d,i) { return d3.rgb(d.color).darker(1); });
  
    container
      .append('g')
      .attr('transform', 'translate(' + [0, margins.legendHeight - margins.chromoAxis - margins.chromosomeContainerHeight - margins.legendGap] + ')')
      .attr('class', function(d,i) { return 'brush brush-' + d.chromosome; })
      .each(function(d,i) {
        d.brush = d3.brushX().extent([[0, 0], [panelContainerWidth, margins.chromosomeContainerHeight]]).on('brush end', brushed);
        d3.select(this).call(d.brush).call(d.brush.move, d.scale2.range());
      });
  }

  function drawIntervals(panel, scale, dataArray) {

    var shapes = panel.selectAll('rect.shape').data(dataArray, function(d,i) {return d.iid});

    shapes.enter().append('rect')
      .attr('class', 'popovered shape')
      .attr('id', function(d,i) { return 'shape' + d.iid; })
      .style('clip-path','url(#clip)')
      .each(function(d,i) {
        d.startX = scale(d.startPoint);
        d.startY = yScale(d.y);
        d.endX = scale(d.endPoint);
        d.endY = yScale(d.y);
        d.intervalLength = d.endPoint - d.startPoint;
        d.popoverTitle = popoverIntervalTitle(d,i);
        d.popoverContent = popoverIntervalContent(d,i);
      })
      .attr('x', function(d,i) { return scale(d.startPoint); })
      .attr('y', function(d,i) { return yScale(d.y) - 0.5 * margins.bar; })
      .attr('width', function(d,i) { return scale(d.endPoint) - scale(d.startPoint); })
      .attr('height', margins.bar);

    shapes
      .attr('x', function(d,i) { return scale(d.startPoint); })
      .attr('y', function(d,i) { return yScale(d.y) - 0.5 * margins.bar; })
      .attr('width', function(d,i) { return scale(d.endPoint) - scale(d.startPoint); })
      .attr('height', margins.bar)
      .style('fill', function(d,i) { return metadata[d.chromosome].color; })
      .style('stroke', function(d,i) { return d3.rgb(metadata[d.chromosome].color).darker(1); })
      .on('mouseover', function(d,i) {
        d3.select(this).classed('highlighted', true);
      })
      .on('mouseout', function(d,i) {
        d3.select(this).classed('highlighted', false);
      })
      .on('mousemove', function(d,i) {
        var popover = d3.select('.popover');
        popover.select('.popover-title').html(d.popoverTitle);
        popover.select('.popover-content').html(d.popoverContent);
        popover.select('.popover-content span').style('color', d.color)
        popover
          .style('left', (d3.event.pageX - 0.91 *  popover.node().getBoundingClientRect().width / 2) + 'px')
          .style('top', (d3.event.pageY - popover.node().getBoundingClientRect().height - 3) + 'px')
          .classed('hidden', false)
          .style('display', 'block')
          .transition()
          .duration(5)
          .style('opacity', 1);
      });

    shapes.exit().remove();
  }

  function drawLocalConnections(container) {

    var connections = container.selectAll('path.connection').data(function(d,i) { return (localConnectionChromosomeBins[d.chromosome] || []); }, function(d,i) { return d.cid});

    connections.exit().remove();

    connections.attr('d', function(d,i) { return line(calculateConnectorEndpoints(d, connectionBins[d.cid], d3.select(this.parentNode).datum())); });

    connections
      .enter()
      .append('path')
      .attr('class', function(d,i) { return 'popovered connection local ' + d.type; })
      .style('clip-path','url(#clip)')
      .attr('d', function(d,i) { return line(calculateConnectorEndpoints(d, connectionBins[d.cid], d3.select(this.parentNode).datum())); })
      .each(function(d,i) {
        d.popoverTitle = popoverConnectionTitle(d,i);
        d.popoverContent = popoverConnectionContent(d,i);
      })
      .on('mouseover', function(d,i) {
        d3.select(this).classed('highlighted', true);
      })
      .on('mouseout', function(d,i) {
        d3.select(this).classed('highlighted', false);
      })
      .on('mousemove', function(d,i) {
        var popover = d3.select('.popover');
        popover.select('.popover-title').html(d.popoverTitle);
        popover.select('.popover-content').html(d.popoverContent);
        popover.select('.popover-content span').style('color', d.color)
        popover
          .style('left', (d3.event.pageX - 0.91 *  popover.node().getBoundingClientRect().width / 2) + 'px')
          .style('top', (d3.event.pageY - popover.node().getBoundingClientRect().height - 3) + 'px')
          .classed('hidden', false)
          .style('display', 'block')
          .transition()
          .duration(5)
          .style('opacity', 1);
      });
  }

  function calculateConnectorEndpoints(record, connector, chromosome) {
    record.sourceJabba = connector.source.y;
    record.sinkJabba = connector.sink.y;
    if ((connector.connection.source > 0) && (connector.connection.sink < 0)) {
      record.sourcePoint = connector.source.endPoint;
      record.sinkPoint = connector.sink.startPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [chromosome.scale(connector.source.endPoint), yScale(connector.source.y)],
       // [1.01 * chromosome.scale(connector.source.endPoint), yScale(connector.source.y)],
        [chromosome.scale(connector.source.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
       // [0.99 * chromosome.scale(connector.sink.startPoint), yScale(connector.sink.y)],
        [chromosome.scale(connector.sink.startPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source > 0) && (connector.connection.sink > 0)) {
      record.sourcePoint = connector.source.endPoint;
      record.sinkPoint = connector.sink.endPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [chromosome.scale(connector.source.endPoint), yScale(connector.source.y)],
        [chromosome.scale(connector.source.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.endPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source < 0) && (connector.connection.sink < 0)) {
      record.sourcePoint = connector.source.startPoint;
      record.sinkPoint = connector.sink.startPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [chromosome.scale(connector.source.startPoint), yScale(connector.source.y)],
        [chromosome.scale(connector.source.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.startPoint), yScale(connector.sink.y)]];
    } else if ((connector.connection.source < 0) && (connector.connection.sink > 0)) {
      record.sourcePoint = connector.source.startPoint;
      record.sinkPoint = connector.sink.endPoint;
      record.distance = Math.abs(record.sinkPoint - record.sourcePoint);
      return [
        [chromosome.scale(connector.source.startPoint), yScale(connector.source.y)],
        [chromosome.scale(connector.source.startPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.endPoint), 0.5 * (yScale(connector.source.y) + yScale(connector.sink.y))],
        [chromosome.scale(connector.sink.endPoint), yScale(connector.sink.y)]];
    }
  }


  // Callback when brushing is finished
  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
    var s = d3.event.selection || [0, panelContainerWidth];
    var brushData = d3.select(this).datum();
    var domain = s.map(brushData.scale2.invert, brushData.scale2);
    brushData.scale.domain(domain);
    var panel = d3.selectAll('.panel-container').filter(function(d,i) { return d.column === brushData.column && d.chromosome === brushData.chromosome });
    panel.select('.axis--x').call(brushData.axis).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start');
    panel.select('.zoom').call(brushData.zoom.transform, d3.zoomIdentity.scale(panelContainerWidth / (s[1] - s[0])).translate(-s[0], 0));
    var intervals = data.intervals.filter(function(d,i) { return (d.chromosome === brushData.chromosome)});
    drawIntervals(panel.select('g.shapes-container'), brushData.scale, intervals);
    drawLocalConnections(panel.select('g.local-connections-container'));
  }

  // Callback when the panel is zoomed
  function zoomed(panelData) {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
    var t = d3.event.transform;
    var panel = d3.selectAll('.panel-container').filter(function(d,i) { return d.column === panelData.column && d.chromosome === panelData.chromosome });
    var chromo = d3.selectAll('.chromosome-container').filter(function(d,i) { return d.column === panelData.column && d.chromosome === panelData.chromosome });
    var domain = t.rescaleX(panelData.scale2).domain();
    panelData.scale.domain(domain);
    panel.select('.axis--x').call(panelData.axis).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start');
    chromo.select('.brush').call(panelData.brush.move, panelData.scale.range().map(t.invertX, t));
    var intervals = data.intervals.filter(function(d,i) { return (d.chromosome === panelData.chromosome)});
    drawIntervals(panel.select('g.shapes-container'), panelData.scale, intervals);
    drawLocalConnections(panel.select('g.local-connections-container'));
  }
}

// Act upon window resize
function throttle() {
  window.clearTimeout(throttleTimer);
  throttleTimer = window.setTimeout(function() {
    draw();
  }, 200);
}

// Remove any other open popovers
$(document).on('mousemove', function(event) {
  if (!$(event.target).is('.popovered')) {
    d3.select('.popover').transition().duration(5)
      .style('opacity', 0);
  }
});
/*

// Add the X axis
var xAxisContainer = svg.append('g').attr('transform', 'translate(' + [margins.left, margins.top + height] + ')');
xAxisContainer.selectAll('g.axis').data(bins.values()).enter().append('g').attr('class', 'axis').each(function(d,i) { d3.select(this).call(d.axis).selectAll('text').style('text-anchor', 'end').attr('dx', '-.8em').attr('dy', '.15em').attr('transform', 'rotate(-65)'); });

// Add the Y axis
svg.append('g').attr('class', 'y axis').attr('transform', 'translate(' + [margins.left - 0 * margins.gap, margins.top] + ')').call(d3.axisLeft(yScale));

// Add the horizontal grid lines
var gridContainer = svg.append('g').attr('transform', 'translate(' + [margins.left, margins.top + height] + ')')
.selectAll('g.grid').data(domains.filter(function(d,i) { return i % 2 === 0 })).enter().append('g').attr('class', 'grid').attr('transform', function(d,i) { return 'translate(' + [xScale(d) + 0.5, 0] +')'});

gridContainer.selectAll('line.gridline').data(d3.range(yScale.domain()[1])).enter().append('line').attr('class', 'gridline').attr('transform', function(d,i) { return 'translate(' + [0, -yScale(d)] + ')'; }).attr('x2', regionWidth)

var plot = svg.append('g').attr('transform', 'translate(' + [margins.left, margins.top] + ')');
plot.selectAll('line.border').data(domains).enter().append('line').attr('class', 'border')
  .attr('transform', function(d,i) { return 'translate(' + [xScale(d) + 0.5, 0] +')'}).attr('y2', height);

plot.selectAll('rect.shape').data(json.intervals, function(d,i) {return d.id}).enter().append('rect').attr('class', 'shape')
  .attr('id', function(d,i) { return 'shape' + d.id; })
  .each(function(d,i) {
    d.startX = bins.get(d.chromosome).scale(d.startPoint);
    d.startY = yScale(d.jabba);
    d.endX = bins.get(d.chromosome).scale(d.endPoint);
    d.endY = yScale(d.jabba);
  })
  .attr('x', function(d,i) { return bins.get(d.chromosome).scale(d.startPoint); }).attr('y', function(d,i) { return yScale(d.jabba) - 0.5 * margins.bar; })
  .attr('width', function(d,i) { return bins.get(d.chromosome).scale(d.endPoint) - bins.get(d.chromosome).scale(d.startPoint); }).attr('height', margins.bar);

var connectionsContainer = svg.append('g').attr('class', 'connections-container').attr('transform', 'translate(' + [margins.left, margins.top] + ')');
connectionsContainer.selectAll('path.connection').data(json.connections.sort(function(a,b) { return d3.ascending(d3.select('#shape' + Math.abs(a.source)).datum().startX,d3.select('#shape' + Math.abs(b.sink)).datum().startX)}), function(d,i) { return d.id}).enter().append('path').attr('class', function(d,i) { return 'connection ' + d.type; })
  .each(function(d,i) {
    var startInterval = d3.select('#shape' + Math.abs(d.source)).datum();
    var endInterval = d3.select('#shape' + Math.abs(d.sink)).datum();
    var offsetY = Math.sign(startInterval.endY - endInterval.endY) * margins.bar / 1;
    if (Math.abs(d.source) === Math.abs(d.sink)) {
      d.points = [[startInterval.endX,startInterval.endY], 
            [1.05 * startInterval.endX, startInterval.endY],
            [0.5 * (startInterval.endX + endInterval.startX) + 0.25 * (endInterval.startY - startInterval.endY),
            0.5 * (endInterval.startY + startInterval.endY) - 0.25 * (endInterval.startX - startInterval.endX) ],
            [0.95 * endInterval.startX, endInterval.startY],
            [endInterval.startX, endInterval.startY]];
    } else {
      if ((d.source < 0) && (d.sink > 0)) {
        d.points = [[startInterval.endX,startInterval.endY], 
                    [1.05 * startInterval.endX, startInterval.endY - offsetY],
                    [0.95 * endInterval.startX, endInterval.startY + offsetY],
                    [endInterval.startX, endInterval.startY]];
      }
      if ((d.source < 0) && (d.sink < 0)) {
        d.points = [[startInterval.endX,startInterval.endY], 
                    [1.05 * startInterval.endX, startInterval.endY - offsetY],
                    [1.05 * endInterval.endX, endInterval.endY + offsetY],
                    [endInterval.endX, endInterval.endY]];
      }
      if ((d.source > 0) && (d.sink > 0)) {
        d.points = [[startInterval.startX,startInterval.startY], 
                    [0.95 * startInterval.startX, startInterval.startY - offsetY],
                    [0.95 * endInterval.startX, endInterval.startY + offsetY],
                    [endInterval.startX, endInterval.startY]];
      }
      if ((d.source > 0) && (d.sink < 0)) {
        d.points = [[startInterval.startX,startInterval.startY], 
                    [0.95 * startInterval.startX, startInterval.startY - offsetY],
                    [1.05 * endInterval.endX, endInterval.endY + offsetY],
                    [endInterval.endX, endInterval.endY]];
      }
    }
  })
  .attr('d', function(d,i) { return line(d.points); })
*/
