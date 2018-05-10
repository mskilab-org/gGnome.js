class Frame extends Base {

  constructor(plotContainerId, totalWidth, totalHeight) {
    super();
    // Frame drawing variables
    this.margins = {
      top: 30, bottom: 70, left: 30, right: 30,
      modal: {width: 900, height: 300, top: 30, bottom: 30, left: 30, right: 30},
      legend: {bar: 30, upperGap: 0, lowerGap: 20, axisTop: 10},
      panels: {upperGap: 155, chromoGap: 155, lowerGap: 0, gap: 26, widthOffset: 1, legend: 50, label: 10, yAxisTitleGap: 20},
      brushes: {upperGap: -10, height: 50},
      intervals: {bar: 10, gap: 20, geneBar: 2},
      genes: {textGap: 5, selectionSize: 2},
      walks: {bar: 10},
      defaults: {upperGapPanel: 155, upperGapPanelWithGenes: 360}};
    this.colorScale = d3.scaleOrdinal(d3.schemeCategory10.concat(d3.schemeCategory20b));
    this.updateDimensions(totalWidth, totalHeight);
    this.geneModalSelector = '#' + plotContainerId + '-gene-modal';
    this.popoverSelector = '.popover';

    // Frame DOM elements
    this.plotContainer = d3.select('#' + plotContainerId);
    this.geneModalContainer = d3.select(this.geneModalSelector);
    this.svg = null;
    this.svgFilter = null;

    // Frame data variables
    this.dataInput = {};
    this.dataInput.metadata = [];
    this.dataInput.intervals = [];
    this.dataInput.connections = [];
    this.dataInput.genes = [];
    this.genomeLength = null;
    this.genomeScale = null;
    this.chromoBins = null;
    this.intervals = [];
    this.genes = [];
    this.walks = [];
    this.yWalkExtent = [];
    this.axis = null;
  }

  updateDimensions(totalWidth, totalHeight) {
    this.totalWidth = totalWidth;
    this.totalHeight = totalHeight;
    this.width = this.totalWidth - this.margins.left - this.margins.right;
    this.height = this.totalHeight - this.margins.top - this.margins.bottom;
    this.margins.defaults.upperGapPanelWithGenes = (this.height + this.margins.top - 2 * this.margins.intervals.bar + this.margins.panels.chromoGap + this.margins.panels.gap) / 2;
  }

  updateData() {
    if (this.dataInput === null) return;
    this.settings = this.dataInput.settings;
    this.genomeLength = this.dataInput.metadata.reduce((acc, elem) => (acc + elem.endPoint - elem.startPoint + 1), 0);
    let boundary = 0;
    this.genomeScale = d3.scaleLinear().domain([0, this.genomeLength]).range([0, this.width]);
    this.chromoBins = this.dataInput.metadata.reduce((hash, element) => {
      let chromo = new Chromo(element);
      chromo.scaleToGenome = d3.scaleLinear().domain([0, chromo.endPoint]).range([boundary, boundary + chromo.length - 1]);
      chromo.scale = d3.scaleLinear().domain([0, chromo.endPoint]).range([this.genomeScale(boundary), this.genomeScale(boundary + chromo.length - 1)]);
      chromo.innerScale = d3.scaleLinear().domain([0, chromo.endPoint]).range([this.genomeScale(chromo.startPoint), this.genomeScale(chromo.endPoint)]);
      hash[element.chromosome] = chromo; 
      boundary += chromo.length;
      return hash; 
    }, {});
    let lengthExtent = d3.nest()
      .key((d,i) => d.chromosome)
      .rollup((v) => d3.extent(v, (d) => (d.endPoint - d.startPoint)))
      .object(this.dataInput.intervals);
    let interval = null, gene = null, connection = null, intervalLength, extentSize;
    this.intervalBins = {};
    this.intervals = this.dataInput.intervals.map((d, i) => {
      if (this.settings && this.settings.y_axis && !this.settings.y_axis.visible) {
        intervalLength = d.endPoint - d.startPoint;
        if (intervalLength > (0.1 * lengthExtent[d.chromosome][1])) {
          extentSize = lengthExtent[d.chromosome][0] - lengthExtent[d.chromosome][1];
          d.y = Math.round(1 + (9 / extentSize) * (intervalLength - lengthExtent[d.chromosome][1]));
        } else {
          extentSize = lengthExtent[d.chromosome][0] - 0.1 * lengthExtent[d.chromosome][1];
          d.y = Math.round(10 + (54 / extentSize) * (intervalLength - 0.1 * lengthExtent[d.chromosome][1]));
        }
      }
      let interval = new Interval(d);
      interval.startPlace = Math.floor(this.chromoBins[interval.chromosome].scaleToGenome(interval.startPoint));
      interval.endPlace = Math.floor(this.chromoBins[interval.chromosome].scaleToGenome(interval.endPoint));
      interval.color = this.chromoBins[interval.chromosome].color;
      this.intervalBins[interval.iid] = interval;
      return interval;
    });
    this.geneBins = {};
      this.genes = this.dataInput.genes.filter((d, i) => d.type === 'gene').map((d, i) => {
      let gene = new Gene(d);
      gene.startPlace = Math.floor(this.chromoBins[gene.chromosome].scaleToGenome(gene.startPoint));
      gene.endPlace = Math.floor(this.chromoBins[gene.chromosome].scaleToGenome(gene.endPoint));
      gene.color = this.chromoBins[gene.chromosome].color;
      gene.y = 0; //Math.round(Math.random() * 10);
      this.geneBins[gene.iid] = gene;
      return gene;
    });
    this.yGeneScale = d3.scaleLinear().domain([10, 0]).range([0, this.margins.panels.upperGap - this.margins.panels.chromoGap]).nice();
    this.yMax = d3.min([d3.max(this.dataInput.intervals.map((d, i) => d.y)), 500]);
    this.yScale = d3.scaleLinear().domain([0, 10, this.yMax]).range([this.height - this.margins.panels.upperGap + this.margins.top, 0.4 * (this.height - this.margins.panels.upperGap + this.margins.top), 2 * this.margins.intervals.bar]).nice();
    this.yAxis = d3.axisLeft(this.yScale).tickSize(-this.width).tickValues(d3.range(0, 10).concat(d3.range(10, 10 * Math.round(this.yMax / 10) + 1, 10)));
    this.connections = this.dataInput.connections.map((d, i) => {
      connection = new Connection(d);
      connection.pinpoint(this.intervalBins);
      connection.yScale = this.yScale;
      connection.arc = d3.arc()
        .innerRadius(0)
        .outerRadius(this.margins.intervals.bar / 2)
        .startAngle(0)
        .endAngle((e, j) => e * Math.PI);
      return connection;
    });
    if (this.dataInput.walks) {
      this.walkIntervals = [];
      this.walkConnections = [];
      this.walks = this.dataInput.walks.map((d, i) => {
        let walk = new Walk(d);
        walk.intervals = walk.iids.map((d, i) => {
          let interval = new WalkInterval(d, walk);
          interval.startPlace = Math.floor(this.chromoBins[interval.chromosome].scaleToGenome(interval.startPoint));
          interval.endPlace = Math.floor(this.chromoBins[interval.chromosome].scaleToGenome(interval.endPoint));
          interval.color = this.chromoBins[interval.chromosome].color;
          interval.shapeHeight = this.margins.walks.bar;
          this.walkIntervals.push(interval);
          return interval;
        });
        return walk;
      });
      this.yWalkExtent = d3.extent(this.walkIntervals.map((d, i) => d.y)).reverse();
      this.yWalkScale = d3.scaleLinear().domain(this.yWalkExtent).range([this.margins.panels.gap, this.margins.panels.upperGap - this.margins.panels.chromoGap - this.margins.panels.gap]).nice();
      this.walks.forEach((walk, i) => {
        walk.connections = walk.cids.map((d, i) => {
          let connection = new WalkConnection(d, walk);
          connection.pinpoint();
          connection.yScale = this.yWalkScale;
          connection.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(this.margins.intervals.bar / 2)
            .startAngle(0)
            .endAngle((e, j) => e * Math.PI);
          this.walkConnections.push(connection);
          return connection;
        });
      });

    }

  }

  render() {
    // Clear any existing svg
    this.plotContainer.selectAll('svg').remove();
    // Add the svg container
    this.svg = this.plotContainer.append('svg')
      .attr('class', 'plot')
      .attr('width', this.totalWidth)
      .attr('height', this.totalHeight);

    // Clear the modal svg
    this.geneModalContainer.selectAll('svg').remove();

    this.svgFilter = new SvgFilter(this.svg);
    this.svgFilter.drawShadow();
    this.svgFilter.renderGradients(this.dataInput.metadata);
    
    this.updateData();

    this.renderLegend();
    this.renderBrushes();
    this.brushContainer.createDefaults(this.chromoBins['1'].chromoGenome);

    this.renderGeneModal();
  }
 
  runDelete() {
    this.brushContainer.deleteBrush();
  }

  runLocate(domainString) {
    let chromosome = domainString.split(":")[0];
    let range = domainString.split(':')[1].split('-');
    let chromo = this.chromoBins[chromosome];
    this.brushContainer.createDefaults([chromo.scaleToGenome(parseFloat(range[0])), chromo.scaleToGenome(parseFloat(range[1]))]);
  }

  toggleGenesPanel() {
    if (this.dataInput.walks) {
      this.yWalkScale = d3.scaleLinear().domain(this.yWalkExtent).range([0 * this.margins.panels.gap, this.margins.panels.upperGap - this.margins.panels.chromoGap - 0 * this.margins.panels.gap]).nice();
      this.walkConnections.forEach((d,i) => d.yScale = this.yWalkScale);
    }
    this.yGeneScale = d3.scaleLinear().domain([10, 0]).range([0, this.margins.panels.upperGap - this.margins.panels.chromoGap]).nice();
    this.yScale = d3.scaleLinear().domain([0, 10, this.yMax]).range([this.height - this.margins.panels.upperGap + this.margins.top, 0.4 * (this.height - this.margins.panels.upperGap + this.margins.top), 2 * this.margins.intervals.bar]).nice();
    this.yAxis = d3.axisLeft(this.yScale).tickSize(-this.width).tickValues(d3.range(0, 10).concat(d3.range(10, 10 * Math.round(this.yMax / 10) + 1, 10)));
    this.panelsContainer
      .call(this.yAxis);
    let connection = null;
    this.connections.forEach((d,i) => d.yScale = this.yScale);
    this.panelsContainer
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.upperGap] + ')');
    this.shapesContainer
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.upperGap] + ')');
    this.connectionsContainer
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.upperGap] + ')');
    this.panelsContainer.select('g.y-axis-title')
      .attr('transform', 'translate(' + [-this.margins.panels.yAxisTitleGap, 0.5 * (this.height - this.margins.panels.upperGap + this.margins.top)] + ')rotate(-90)');
    this.genesContainer.classed('hidden', !this.showGenes);
    this.walksContainer.classed('hidden', !this.showWalks);
    this.walkConnectionsContainer.classed('hidden', !this.showWalks);
    this.brushContainer.update();
  }

  renderGeneModal() {
    this.geneModalTitle = this.geneModalContainer.select('.modal-title');
    this.geneBodyContainer = this.geneModalContainer.select('.modal-body').append('svg')
      .attr('class', 'gene-plot')
      .attr('width', this.margins.modal.width)
      .attr('height', this.margins.modal.height);
    this.genesPlot = this.geneBodyContainer.append('g')
      .attr('class', 'genes-plot')
      .attr('transform', 'translate(' + [this.margins.modal.left, this.margins.modal.top] + ')');
    this.genesPlotWidth =  this.margins.modal.width - this.margins.modal.left - this.margins.modal.right;
    this.genesPlotHeight = this.margins.modal.height - this.margins.top - this.margins.bottom;
    this.genesTypesPlot = this.genesPlot.append('g')
      .attr('class', 'genes-types-plot')
      .attr('transform', 'translate(' + [0, 0.5 * this.genesPlotHeight] + ')');
  }

  renderLegend() {
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
      .style('opacity', 0.66)
      .style('fill', (d, i) => d.color)
      .style('stroke', (d, i) => d3.rgb(d.color).darker(1));

    chromoLegendContainer
      .append('text')
      .attr('class', 'chromo-text')
      .attr('dx', (d, i) => d.chromoWidth / 2)
      .attr('dy', (d, i) => 0.62 * this.margins.legend.bar)
      .attr('text-anchor', 'middle')
      .text((d, i) => d.chromosome);
  }

  renderBrushes() {
    this.brushesContainer = this.controlsContainer.append('g')
      .attr('class', 'brushes')
      .attr('transform', 'translate(' + [0, this.margins.brushes.upperGap] + ')');

    this.panelsContainer = this.svg.append('g')
      .attr('class', 'panels-container')
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.upperGap] + ')');

    this.panelsContainer.append('g')
      .attr('class', 'axis axis--y')
      .classed('hidden', this.settings && this.settings.y_axis && !this.settings.y_axis.visible)
      .attr('transform', 'translate(' + [0, 0] + ')')
      .call(this.yAxis);

    this.panelsContainer.append('g')
      .attr('class', 'y-axis-title')
      .classed('hidden', this.settings && this.settings.y_axis && !this.settings.y_axis.visible)
      .attr('transform', 'translate(' + [-this.margins.panels.yAxisTitleGap, 0.5 * (this.height - this.margins.panels.upperGap + this.margins.top)] + ')rotate(-90)')
      .append('text')
      .attr('text-anchor', 'middle')
      .text(this.settings && this.settings.y_axis && this.settings.y_axis.title);

    this.panelsChromoAxisContainerBottom = this.svg.append('g')
      .attr('class', 'panels-axis-container')
      .attr('transform', 'translate(' + [this.margins.left, this.margins.top + this.height] + ')');

    this.panelsChromoAxisContainerTop = this.svg.append('g')
      .attr('class', 'panels-chromo-axis-container')
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.chromoGap] + ')');

    this.genesContainer = this.svg.append('g')
      .classed('genes-container', true)
      .classed('hidden', !this.showGenes)
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.chromoGap] + ')');
    
    this.walksContainer = this.svg.append('g')
      .classed('walks-container', true)
      .classed('hidden', !this.showWalks)
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.chromoGap] + ')');

    this.shapesContainer = this.svg.append('g')
      .attr('class', 'shapes-container')
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.upperGap] + ')');

    this.connectionsContainer = this.svg.append('g')
      .attr('class', 'connections-container')
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.upperGap] + ')');
    
    this.walkConnectionsContainer = this.svg.append('g')
      .classed('walk-connections-container', true)
      .classed('hidden', !this.showWalks)
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.chromoGap] + ')');

    this.brushContainer = new BrushContainer(this);
    this.brushContainer.render();
  }

  showGeneModal() {
    $(this.geneModalSelector).modal('show');
  }

  clearPopovers() {
    d3.select(this.popoverSelector)
      .transition()
      .duration(5)
      .style('opacity', 0);
  }
}