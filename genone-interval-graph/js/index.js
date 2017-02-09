// The configuration parameters
var totalWidth = $('#plot-container').width(), totalHeight = 300;//Math.round(totalWidth / 1.618);
var margins = {top: 20, bottom: 50, left: 30, right: 10, gap: 10, bar: 10};
var width = totalWidth - margins.left - margins.right;
var height = totalHeight - margins.top - margins.bottom;
// define the line
var line = d3.line().curve(d3.curveBasis).x(function(d) { return d[0]; }).y(function(d) { return d[1]; });

// The proposed data format
var json = {
  intervals: [
    {id:1, chromosome: 16, startPoint: 13108, endPoint: 19607, jabba: 6, strand: '+'},
    {id:2, chromosome: 16, startPoint: 19808, endPoint: 21400, jabba: 4, strand: '*'},
    {id:3, chromosome: 17, startPoint: 30108, endPoint: 31607, jabba: 6, strand: '+'},
    {id:4, chromosome: 17, startPoint: 31808, endPoint: 32900, jabba: 8, strand: '*'},
    {id:5, chromosome: 18, startPoint: 43000, endPoint: 43489, jabba: 6, strand: '+'},
    {id:6, chromosome: 18, startPoint: 43590, endPoint: 43901, jabba: 4, strand: '*'}
  ],
  connections: [
    {id: 1, source: -1, sink: 2, type: 'local'},
    {id: 2, source: -2, sink: -3, type: 'local'},
    {id: 3, source: 3, sink: -4, type: 'junction'},
    {id: 4, source: 4, sink: 5, type: 'junction'},
    {id: 5, source: -6, sink: 6, type: 'junction'},
  ]
}

// The Data Processing part
var bins = d3.map([], function(d) { return d.chromosome; });;
json.intervals.forEach(function(d,i) { 
  if (!bins.has(d.chromosome)) {
      bins.set(d.chromosome, {minPoint: undefined, maxPoint: undefined, minJabba: undefined, maxJabba: undefined, intervals: []});
    }
    var bin = bins.get(d.chromosome);
    bin.chromosome = d.chromosome;
    bin.minPoint = d3.min([d.startPoint, bin.minPoint]);
    bin.maxPoint = d3.max([d.endPoint, bin.maxPoint]);
    bin.minJabba = d3.min([d.jabba, bin.minJabba]);
    bin.maxJabba = d3.max([d.jabba, bin.maxJabba]);
    bin.intervals.push(d);
    bins.set(d.chromosome, bin);
});
var regionWidth = (width - (bins.keys().length - 1) * margins.gap) / bins.keys().length;
var currentSum = 0;
//var sizeScale = d3.scaleLinear().domain().range();
var domainSize = d3.sum(bins.values().map(function(d,i) { return d.maxPoint - d.minPoint; }));
var sizeScale = d3.scaleLinear().domain([0,domainSize]).range([0, width - (bins.keys().length - 1) * margins.gap]);
var domains = flatten(bins.values().map(function(d,i) { return [d.minPoint, d.maxPoint] }));
var ranges = flatten(bins.values().map(function(d,i) { 
  var range = [currentSum, currentSum + regionWidth];  
  currentSum += (regionWidth + margins.gap);
  return range; }));
var xScale = d3.scaleLinear().domain(domains).range(ranges);
var yScale = d3.scaleLinear().domain([0, d3.max(flatten(bins.values().map(function(d,i) { return d.maxJabba;})))]).range([height, 0]).nice();

bins.values().forEach(function(d,i) { 
  d.scale = d3.scaleLinear().domain([d.minPoint, d.maxPoint]).range([xScale(d.minPoint), xScale(d.maxPoint)]).nice();
  d.axis = d3.axisBottom(d.scale).ticks(7);
});

// The SVG hosting the visualisation
var svg = d3.select('#plot-container').append('svg').attr('class', 'plot').attr('width', totalWidth).attr('height', totalHeight);

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

function flatten(ary) {
  return ary.reduce(function(a, b) {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}