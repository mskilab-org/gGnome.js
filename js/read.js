class Read extends Base {

  constructor(hap, chromoBins) {
    super(hap);
    this.rid = hap.rid;
    this.title = hap.title;
    this.chromosome = hap.chromosome;
    this.startPoint = hap.startPoint;
    this.endPoint = hap.endPoint;
    this.coordinates = `${this.chromosome}-${this.startPoint}-${this.endPoint}`;
    this.coverage = hap.coverage;
    this.coverageCoords = this.coverage.map((d,i) => [Math.floor(chromoBins[this.chromosome].scaleToGenome(d[0])), d[1]]);
    this.coverageMax = d3.max(this.coverage,(d,i) => d[1]);
    this.iids = hap.iids;
    this.intervalBins = {};
    this.startPlace = Math.floor(chromoBins[this.chromosome].scaleToGenome(this.startPoint));
    this.endPlace = Math.floor(chromoBins[this.chromosome].scaleToGenome(this.endPoint));
    this.color = 'lightgray';
    this.intervalBins = {};
    this.intervals = this.iids.map((d,i) => {
      let readInterval = new ReadInterval(d);
      readInterval.startPlace = Math.floor(chromoBins[readInterval.chromosome].scaleToGenome(readInterval.startPoint));
      readInterval.endPlace = Math.floor(chromoBins[readInterval.chromosome].scaleToGenome(readInterval.endPoint));
      readInterval.color = chromoBins[readInterval.chromosome].color;
      readInterval.y = 0;
      this.intervalBins[readInterval.iid] = readInterval;
      return readInterval;
    });
  }

  valid() {
    this.errors = [];
  }

  get fill() {
    return this.color;
  }

  isOverlappingWith(interval) {
    return ((0 <= interval.range[1] - this.range[0] + this.arrowLegth) && (0 <= this.range[1] - interval.range[0] + this.arrowLegth));
  }

  get stroke() {
    return d3.rgb(this.color).darker(1);
  }
  
  // The title for the popover on the gene
  get popoverTitle() {
    return 'Read #' + this.title;
  }

}