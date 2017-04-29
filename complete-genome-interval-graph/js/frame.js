class Frame {

  constructor(plotContainerId, totalWidth, totalHeight) {
    this.plotContainer = d3.select('#' + plotContainerId);
    this.dataInput = {};
    this.margins = {top: 20, bottom: 50, left: 30, right: 30, legendBar: 30 };
    this.colorScale = d3.scaleOrdinal(d3.schemeCategory10.concat(d3.schemeCategory20b));
    this.totalWidth = totalWidth;
    this.totalHeight = totalHeight;
    this.width = this.totalWidth - this.margins.left - this.margins.right;
    this.height = this.totalHeight - this.margins.top - this.margins.bottom;
    this.log();
  }

  updateDimensions(totalWidth, totalHeight) {
    this.totalWidth = totalWidth;
    this.totalHeight = totalHeight;
  }

  updateDataInput(dataInput) {
    this.dataInput = dataInput;
    this.genomeLength = this.dataInput.metadata.reduce((acc, elem) => (acc + elem.endPoint - elem.startPoint + 1), 0);
    this.genomeScale = d3.scaleLinear().domain([1, this.genomeLength]).range([0, this.width]);
    let startPoint = 0, endPoint = 0;
    this.chromoBins = this.dataInput.metadata.reduce((hash, element) => {
      let chromo = new Chromo(element);
      startPoint += chromo.startPoint;
      endPoint = startPoint.endPoint + chromo.length;
      chromo.scale = d3.scaleLinear().domain([chromo.startPoint, chromo.endPoint]).range([this.genomeScale(startPoint), this.genomeScale(endPoint)]);
      hash[element.chromosome] = chromo; 
      startPoint += chromo.length;
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

    this.drawLegend()

    this.log();
  }
  
  drawLegend() {
    this.controlsContainer = this.svg.append('g')
      .attr('class', 'controls-container')
      .attr('transform', 'translate(' + [this.margins.left, this.margins.top] + ')');
    
    this.controlsContainer.append('rect')
      .attr('class', 'legend-bar')
      .attr('width', this.width)
      .attr('height', this.margins.legendBar)
      .style('opacity', 0.8)
      .style('fill', 'steelblue')
      .style('stroke', 'black');
  }

  log() {
    console.log(this);
  }
}