class Frame extends Base {

  constructor(plotContainerId, totalWidth, totalHeight) {
    super();
    // Frame drawing variables
    this.margins = {
      top: 30, bottom: 70, left: 30, right: 30,
      modal: {width: 900, height: 300, top: 30, bottom: 30, left: 30, right: 30},
      legend: {bar: 30, upperGap: 0, lowerGap: 20, axisTop: 10},
      panels: {upperGap: 155, chromoGap: 155, lowerGap: 0, gap: 26, widthOffset: 1, legend: 50, label: 10, yAxisTitleGap: 20},
      brushes: {upperGap: -10, height: 50, minSelectionSize: 2},
      intervals: {bar: 10, gap: 20, geneBar: 2},
      genes: {textGap: 5, selectionSize: 2, weightThreshold: 10},
      reads: {gap: 2, coverageHeight: 140, selectionSize: 2, minCoverageRadius: 6, maxCoverageRadius: 16, coverageTitle: 'Coverage', domainSizeLimit: 30000},
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
    this.dataInput.subintervals = [];
    this.dataInput.connections = [];
    this.dataInput.genes = [];
    this.genomeLength = null;
    this.genomeScale = null;
    this.chromoBins = null;
    this.intervals = [];
    this.genes = [];
    this.walks = [];
    this.coveragePoints = [];
    this.downsampledCoveragePoints = [];
    this.yWalkExtent = [];
    this.axis = null;
    this.connectionWeightScale;
  }

  updateDimensions(totalWidth, totalHeight) {
    this.totalWidth = totalWidth;
    this.totalHeight = totalHeight;
    this.width = this.totalWidth - this.margins.left - this.margins.right;
    this.height = this.totalHeight - this.margins.top - this.margins.bottom;
    this.margins.defaults.upperGapPanelWithGenes = (this.height + this.margins.top - 2 * this.margins.intervals.bar + this.margins.panels.chromoGap + this.margins.panels.gap) / 2;
  }

  loadData(dataFile) {
    this.dataFile = dataFile;
    this.dataFileName = this.dataFile.substring(0, this.dataFile.length - 5);
    this.url = `index.html?file=${this.dataFile}&location=${this.location}&view=${this.view}`;
    history.replaceState(this.url, 'Project gGnome.js', this.url);
    d3.queue()
      .defer(d3.json, 'json/' + dataFile)
      .defer(d3.json, 'public/metadata.json')
      .awaitAll((error, results) => {
        if (error) return;
        this.dataInput = results[0];
        this.dataInput.metadata = results[1].metadata;
        this.dataInput.sequences = results[1].sequences;
        this.coveragePointsThreshold = results[1].coveragePointsThreshold || this.margins.reads.domainSizeLimit;
        this.coveragePoints = [];
        this.downsampledCoveragePoints = [];
        this.render();
        this.updateGenes();
        this.updateCoveragePoints();
        this.updateDescription();
        if (this.view === 'walks') {
          $('.content .ui.dropdown').dropdown('set exactly', 'walks');
        }
    });
  }

  toggleView(value) {
    if (['intervals', 'genes', 'walks', 'coverage'].includes(value)) {
      this.margins.panels.upperGap = (value !== 'intervals') ? 0.8 * this.height : this.margins.defaults.upperGapPanel;
      this.showGenes = (value === 'genes');
      this.showWalks = (value === 'walks');
      this.showReads = (value === 'coverage');
      this.toggleGenesPanel();
      this.url = `index.html?file=${this.dataFile}&location=${this.location}&view=${this.view}`;
      history.replaceState(this.url, 'Project gGnome.js', this.url);
    }
  }

  updateCoveragePoints() {
    Papa.parse('../../coverage/' + this.dataFileName + '.csv', {
      dynamicTyping: true,
      skipEmptyLines: true,
      header: true,
      worker: true,
      download: true,
      complete: (results) => {
        if (results) {
          results.data.forEach((d,i) => {
            d.color = this.chromoBins[d.chromosome].color;
            d.place = this.chromoBins[d.chromosome].scaleToGenome(d.x);
            this.coveragePoints.push(d);
          })
          for (let k = 0; k < d3.min([this.coveragePointsThreshold, results.data.length]); k++) {
            let index = this.coveragePointsThreshold < results.data.length ? Math.floor(results.data.length * Math.random()) : k;
            let coveragePoint = results.data[index];
            this.downsampledCoveragePoints.push(coveragePoint);
          }
          // update the fragments
          this.brushContainer.updateFragments(true);
          // update the reads
          this.brushContainer.renderReads();
          toastr.success(`Loaded ${results.data.length} coverage records!`);
          if (this.view === 'coverage') {
            $('.content .ui.dropdown').dropdown('set exactly', 'coverage');
            d3.select('#shadow').classed('hidden', true);
          }
        }
      }
    });
  }

  updateDescription() {
    d3.select('#genome-description').html(this.settings && this.settings.description);
  }

  updateGenes() {
    if (this.genes.length > 0) {
      d3.select('body').classed('shadowed', false);
      return;
    }
    // load the workers
    var worker = new Worker('js/genes-worker.js');
    // Setup an event listener that will handle messages received from the worker.
    worker.addEventListener('message', (e) => {
      this.dataInput.genes = e.data.dataInput.genes;
      this.genes = e.data.genes;
      this.geneBins = e.data.geneBins;
      toastr.success(`Loaded ${this.dataInput.genes.length} gene records!`);
      if (this.view === 'genes') {
        $('.content .ui.dropdown').dropdown('set exactly', 'genes');
        d3.select('#shadow').classed('hidden', true);
      }
    }, false);
    worker.postMessage({dataInput: {metadata: this.dataInput.metadata, genes: []}, geneBins: {}, width: this.width});
  }

  updateData() {
    if (this.dataInput === null) return;
    console.log('called updateData with dataInput!');
    this.settings = this.dataInput.settings;
    this.dataInput.metadata.forEach((d,i) => { d.endPoint += 1 }); // because endpoint is inclusive
    this.dataInput.intervals.forEach((d,i) => { d.endPoint += 1 }); // because endpoint is inclusive
    this.genomeLength = this.dataInput.metadata.reduce((acc, elem) => (acc + elem.endPoint - elem.startPoint), 0);
    let boundary = 0;
    this.genomeScale = d3.scaleLinear().domain([0, this.genomeLength]).range([0, this.width]);
    this.chromoBins = this.dataInput.metadata.reduce((hash, element) => {
      let chromo = new Chromo(element);
      chromo.scaleToGenome = d3.scaleLinear().domain([0, chromo.endPoint]).range([boundary, boundary + chromo.length]);
      chromo.scale = d3.scaleLinear().domain([0, chromo.endPoint]).range([this.genomeScale(boundary), this.genomeScale(boundary + chromo.length)]);
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
    this.intervals = this.dataInput.intervals.map((d,i) => {
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
    this.yGeneScale = d3.scaleLinear().domain([10, 0]).range([0, this.margins.panels.upperGap - this.margins.panels.chromoGap]).nice();
    this.yScale = d3.scaleLinear();
    this.connections = this.dataInput.connections.map((d,i) => {
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
      this.walks = this.dataInput.walks.map((d,i) => {
        let walk = new Walk(d);
        walk.intervals = walk.iids.map((d,i) => {
          d.endPoint += 1; // because endpoint is inclusive
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
      this.yWalkExtent = d3.extent(this.walkIntervals.map((d,i) => d.y)).reverse();
      this.yWalkScale = d3.scaleLinear().domain(this.yWalkExtent).range([this.margins.panels.gap, this.margins.panels.upperGap - this.margins.panels.chromoGap - this.margins.panels.gap]).nice();
      this.walks.forEach((walk, i) => {
        walk.connections = walk.cids.map((d,i) => {
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
    this.hasSubintervals = false;
    // Calculate the range of weight in the visible connections
    let weightExtent = d3.extent(this.connections.map((d,i) => d.weight));
    this.connectionWeightScale = d3.scaleLinear().domain(weightExtent).range([0.25, 1]);
  }

  render() {
    // Clear any existing svg
    this.plotContainer.selectAll('svg').remove();
    // Clear any existing canvas
    this.plotContainer.selectAll('canvas').remove();

    this.canvas = this.plotContainer.append('canvas')
      .attr('class', 'plot')
      .attr('id', 'coverage-canvas')
      .attr('width', this.totalWidth)
      .attr('height', this.totalHeight);

    this.reglCanvas = new ReglCanvas('coverage-canvas');
    this.ctxCanvas = this.canvas.node().getContext('2d');

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

    this.runLocate((this.location ? this.location : this.chromoBins['1'].domain));

    this.renderGeneModal();
  }
 
  runDelete() {
    this.brushContainer.deleteBrush();
  }

  runLocate(fullDomainString) {
    if ((/^\s*$/).test(fullDomainString)) return;
    if (fullDomainString.includes(':')) {
      this.runDelete();
      fullDomainString.split(' | ').forEach((subdomainString, i) => {
        let domains = [];
        subdomainString.split(' ').forEach((domainString, j) => {
          let chromosome = domainString.split(":")[0];
          let range = domainString.split(':')[1].split('-');
          let chromo = this.chromoBins[chromosome];
          domains.push({chromosome: chromosome, chromo: chromo, range: range});
        });
        this.brushContainer.createDefaults([domains[0].chromo.scaleToGenome(parseFloat(domains[0].range[0])), domains[domains.length - 1].chromo.scaleToGenome(parseFloat(domains[domains.length - 1].range[1] - 1))]); 
      });
    } else {
      let matchedGenes = this.genes.filter(d => d.title === fullDomainString);
      if (matchedGenes.length > 0) {
        this.brushContainer.createDefaults([matchedGenes[0].startPlace, matchedGenes[0].endPlace]);  
      }
    }
  }

  toggleGenesPanel() {
    if (this.dataInput.walks) {
      this.yWalkScale = d3.scaleLinear().domain(this.yWalkExtent).range([0 * this.margins.panels.gap, this.margins.panels.upperGap - this.margins.panels.chromoGap - 0 * this.margins.panels.gap]).nice();
      this.walkConnections.forEach((d,i) => d.yScale = this.yWalkScale);
    }
    this.yGeneScale = d3.scaleLinear().domain([10, 0]).range([0, this.margins.panels.upperGap - this.margins.panels.chromoGap]).nice();
    this.yCoverageScale = d3.scaleLinear().range([this.margins.reads.gap, this.margins.panels.upperGap - this.margins.panels.chromoGap]);
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
    this.readsContainer.classed('hidden', !this.showReads);
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
      .data(Object.values(this.chromoBins), (d,i) => d.chromosome)
      .enter()
      .append('g')
      .attr('class', 'chromo-legend-container')
      .attr('transform', (d,i) => ('translate(' + [d.chromoStartPosition, this.margins.legend.upperGap] + ')'));

    chromoLegendContainer
      .append('rect')
      .attr('class', 'chromo-box')
      .attr('width', (d,i) => d.chromoWidth)
      .attr('height', this.margins.legend.bar)
      .style('opacity', 0.66)
      .style('fill', (d,i) => d.color)
      .style('stroke', (d,i) => d3.rgb(d.color).darker(1));

    chromoLegendContainer
      .append('text')
      .attr('class', 'chromo-text')
      .attr('dx', (d,i) => d.chromoWidth / 2)
      .attr('dy', (d,i) => 0.62 * this.margins.legend.bar)
      .attr('text-anchor', 'middle')
      .text((d,i) => d.chromosome);
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
      .attr('transform', 'translate(' + [0, 0] + ')');

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

    this.readsContainer = this.svg.append('g')
      .classed('reads-container', true)
      .classed('hidden', !this.showReads)
      .attr('transform', 'translate(' + [this.margins.left, this.margins.panels.chromoGap] + ')');

    this.readsContainer.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(' + [0, 0] + ')');

    this.readsContainer.append('g')
      .attr('class', 'y-axis-title')
      .attr('transform', 'translate(' + [-this.margins.panels.yAxisTitleGap,  + 0.5 * (this.margins.reads.gap + this.margins.panels.upperGap)] + ')rotate(-90)')
      .append('text')
      .attr('text-anchor', 'middle')
      .text(this.margins.reads.coverageTitle);

    this.readsContainer
      .append('rect')
      .attr('class', 'loading-box hidden')
      .attr('width', this.width)
      .attr('height', this.margins.top + this.margins.panels.upperGap - this.margins.reads.gap);

    this.readsContainer
      .append('text')
      .attr('class', 'loading hidden')
      .attr('transform', 'translate(' + [this.width/2, + 0.5 * (this.margins.top + this.margins.panels.upperGap)] + ')')
      .attr('text-anchor', 'middle')
      .text('loading ...');

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