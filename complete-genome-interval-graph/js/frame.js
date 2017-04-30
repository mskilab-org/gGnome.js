class Frame {

  constructor(plotContainerId, totalWidth, totalHeight) {
    // Frame drawing variables
    this.margins = {top: 30, bottom: 50, left: 30, right: 30, legend: {bar: 30, upperGap: 30, lowerGap: 20}};
    this.colorScale = d3.scaleOrdinal(d3.schemeCategory10.concat(d3.schemeCategory20b));
    this.updateDimensions(totalWidth, totalHeight);

    // Frame DOM elements
    this.plotContainer = d3.select('#' + plotContainerId);
    this.svg = null;
    this.svgFilter = null;

    // Frame data variables
    this.dataInput = null;
    this.genomeLength = null;
    this.genomeScale = null;
    this.chromoBins = null;
    this.axis = null;
  }

  updateDimensions(totalWidth, totalHeight) {
    this.totalWidth = totalWidth;
    this.totalHeight = totalHeight;
    this.width = this.totalWidth - this.margins.left - this.margins.right;
    this.height = this.totalHeight - this.margins.top - this.margins.bottom;
  }

  updateData() {
    if (this.dataInput === null) return;
    this.genomeLength = this.dataInput.metadata.reduce((acc, elem) => (acc + elem.endPoint - elem.startPoint + 1), 0);
    this.genomeScale = d3.scaleLinear().domain([0, this.genomeLength]).range([0, this.width])//.nice();
    this.axis = d3.axisBottom(this.genomeScale).ticks(10, 's');
    let boundary = 0
    this.chromoBins = this.dataInput.metadata.reduce((hash, element) => {
      let chromo = new Chromo(element);
      chromo.scale = d3.scaleLinear().domain([0, chromo.endPoint]).range([this.genomeScale(boundary), this.genomeScale(boundary + chromo.length - 1)])//.nice();
      chromo.innerScale = d3.scaleLinear().domain([0, chromo.endPoint]).range([this.genomeScale(chromo.startPoint), this.genomeScale(chromo.endPoint)])//.nice();
      chromo.axis = d3.axisBottom(chromo.innerScale).ticks(5, 's');
      hash[element.chromosome] = chromo; 
      boundary += chromo.length;
      return hash; 
    }, {});
  }

  render() {
    console.log('redrawing...')
    // Clear any existing svg
    this.plotContainer.selectAll('svg').remove();
    // Add the svg container
    this.svg = this.plotContainer.append('svg')
      .attr('class', 'plot')
      .attr('width', this.totalWidth)
      .attr('height', this.totalHeight);

    this.svgFilter = new SvgFilter(this.svg);
    this.svgFilter.drawShadow();
    
    this.updateData();
    
    this.drawLegend();

  }
  
  drawLegend() {
    this.controlsContainer = this.svg.append('g')
      .attr('class', 'legend-container')
      .attr('transform', 'translate(' + [this.margins.left, this.margins.top] + ')');

    this.controlsContainer.append('rect')
      .attr('class', 'legend-bar')
      .attr('transform', 'translate(' + [0, this.margins.legend.upperGap] + ')')
      .attr('width', this.width)
      .attr('height', this.margins.legend.bar)
      .style('opacity', 0.8)
      .style('fill', 'steelblue')
      .style('stroke', 'black');

    let frameAxisContainer = this.controlsContainer
      .append('g')
      .attr('class', 'frame-axis axis axis--x')
      .call(this.axis); 
/*
    let chromoLegendContainer = this.controlsContainer.selectAll('g.chromo-legend-container')
      .data(Object.values(this.chromoBins), (d, i) => d.chromosome)
      .enter()
      .append('g')
      .attr('class', 'chromo-legend-container')
      .attr('transform', (d, i) => ('translate(' + [d.chromoStartPosition, this.margins.legend.upperGap] + ')'))

    chromoLegendContainer
      .append('rect')
      .attr('class', 'chromo-box')
      .attr('width', (d, i) => d.chromoWidth)
      .attr('height', this.margins.legend.bar)
      .style('opacity', 0.8)
      .style('fill', (d, i) => d.color)
      .style('stroke', (d,i) => d3.rgb(d.color).darker(1));
 
    chromoLegendContainer
      .append('g')
      .attr('class', 'chromo-axis axis axis--x')
      .attr('transform', 'translate(' + [0, this.margins.legend.bar + this.margins.legend.lowerGap] + ')')
      .each(function(d,i) { 
        d3.select(this).call(d.axis).selectAll('text').attr('transform', 'rotate(45)').style('text-anchor', 'start'); 
      });
*/
    this.drawBrushes();
  }

  drawBrushes() {
    //brushes container
    var gBrushes = this.controlsContainer.append('g')
    .attr('class', 'brushes')
    .attr('transform', 'translate(' + [0, this.margins.legend.upperGap] + ')');

    var width = this.width;
    var activeId = null;
    var originalSelection;

    //keep track of existing brushes
    var brushes = [];

    /* CREATE NEW BRUSH
     *
     * This creates a new brush. A brush is both a function (in our array) and a set of predefined DOM elements
     * Brushes also have selections. While the selection are empty (i.e. a suer hasn't yet dragged)
     * the brushes are invisible. We will add an initial brush when this viz starts. (see end of file)
     * Now imagine the user clicked, moved the mouse, and let go. They just gave a selection to the initial brush.
     * We now want to create a new brush.
     * However, imagine the user had simply dragged an existing brush--in that case we would not want to create a new one.
     * We will use the selection of a brush in brushend() to differentiate these cases.
     */
    function newBrush() {

      var brush = d3.brushX()
        .extent([[0, 0], [width, 30]])
        .on('start', brushStart)
        .on('brush', brushing)
        .on('end', brushEnd);

      brushes.push({id: Misc.guid, brush: brush, selection: null });

      function brushStart() {
        // your stuff here
        console.log('start...')
        //originalSelection =  d3.event.selection;
      };

      function brushing() {
        if (!d3.event || !d3.event.sourceEvent || (d3.event.sourceEvent.type === "brush")) return; // Only transition after input.

        // your stuff here
        //console.log('brushing...', d3.event.selection)
      }

      function brushEnd() {
        if (!d3.event.sourceEvent) return; // Only transition after input.
        if (!d3.event.selection) return; // Ignore empty selections.

        // Figure out if our latest brush has a selection
        var lastBrushID = brushes[brushes.length - 1].id;
        //var lastBrush = document.getElementById('brush-' + lastBrushID);
        var lastBrush = d3.select('#brush-' + lastBrushID).node();
        var selection = d3.brushSelection(lastBrush);

        // If it does, that means we need another one
        if (selection && selection[0] !== selection[1]) {
          newBrush();
        }

        activeId = d3.select(this).datum().id;
        let currentSelection = d3.event.selection;
        let lowerBound = currentSelection[0], upperBound = currentSelection[1];
        console.log('brushed...', activeId, currentSelection, originalSelection)

/*
        var low  = d3.max(brushes.filter((d, i) => (d.selection !== null) && (d.id !== activeId) && (lowerBound <= d.selection[1]) && (d.selection[1] <= upperBound)).map((d, i) => d.selection[1]));
        lowerBound = d3.max([low, lowerBound]);
        var high = d3.min(brushes.filter((d, i) => (d.selection !== null) && (d.id !== activeId) && (lowerBound <= d.selection[0]) && (d.selection[0] <= upperBound)).map((d, i) => d.selection[0]));
        upperBound = d3.min([high, upperBound]);

        console.log('verdict ', lowerBound, upperBound)
*/
        //let verdict = brushes.filter((d, i) => (d.selection !== null) && (d.id !== activeId) && (((d.selection[0] <= lowerBound) && (upperBound <= d.selection[1])) || ((lowerBound <= d.selection[0]) && (d.selection[1] <= upperBound)))).length > 0 ? originalSelection : [lowerBound, upperBound]
        let verdict = brushes.filter((d, i) => (d.selection !== null) && (d.id !== activeId) && (d3.max([d.selection[0], lowerBound]) <= d3.min([d.selection[1], upperBound]))).length > 0 ? originalSelection : [lowerBound, upperBound]

        d3.select(this).transition().call(d3.event.target.move, verdict)

        brushes.forEach((d, i) => { 
          var node = d3.select('#brush-' + d.id).node();
          d.selection = node && d3.brushSelection(node); 
        });
        // Always draw brushes
        redrawBrushes();
      }
    }

    function redrawBrushes() {

      var brushSelection = gBrushes
        .selectAll('.brush')
        .data(brushes, function (d){ return d.id });

      // Set up new brushes
      brushSelection.enter()
        .insert('g', '.brush')
        .attr('class', 'brush')
        .attr('id', function(brush){ return 'brush-' + brush.id; })
        .each(function(brushObject) {
          //call the brush
          d3.select(this).call(brushObject.brush);
        });

      brushSelection
        .each(function (brushObject){
          d3.select(this)
            .attr('class', 'brush')
            .classed('highlighted', (d,i) => d.id === activeId)
            .selectAll('.overlay')
            .style('pointer-events', function() {
              var brush = brushObject.brush;
              if (brushObject.id === brushes[brushes.length - 1].id && brush !== undefined) {
                return 'all';
              } else {
                return 'none';
              }
            });
        })

      brushSelection.exit()
        .remove();
      
      console.log(brushes)
    }

    newBrush();
    redrawBrushes();

  }

  log() {
    console.log(this);
  }
}