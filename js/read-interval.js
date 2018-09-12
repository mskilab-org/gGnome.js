class ReadInterval extends Interval {

  constructor(hap) {
    super(hap);
    this.coordinates = `${this.chromosome}-${this.startPoint}-${this.endPoint}`;
    this.margins = {arrow: 5};
    this.arrowLegth = 5;
    this.y = this.y + ((this.strand === '+') ? 0.001 : 0);
  }

  valid() {
    this.errors = [];
    if (!Number.isInteger(this.iid) || (this.iid < 1)) {
      this.errors.push(`The iid ${this.iid} must be a positive integer!`);
    }
    if (!Number.isInteger(this.startPoint) || (this.startPoint < 1)) {
      this.errors.push(`The startPoint ${this.startPoint} must be a positive integer!`);
    }
    if (!Number.isInteger(this.endPoint) || (this.endPoint < 1)) {
      this.errors.push(`The endPoint ${this.endPoint} must be a positive integer!`);
    }
    if ((this.endPoint < this.startPoint)) {
      this.errors.push(`The endPoint ${this.endPoint} must be greater or equal than the startPoint ${this.startPoint}!`);
    }
    if (!Misc.isString(this.chromosome)) {
      this.errors.push(`The chromosome ${this.chromosome} must be a string!`);
    }
    if (!Misc.chromosomeLabels.includes(this.chromosome)) {
      this.errors.push(`The chromosome ${this.chromosome} is not a valid type! It must be one of ${Misc.chromosomeLabels}`);
    }
    if (!Misc.isString(this.title)) {
      this.errors.push(`The title ${this.title} must be a string!`);
    }
    if (!Misc.isString(this.type)) {
      this.errors.push(`The type ${this.type} must be a string!`);
    }
    if (!Misc.isString(this.strand)) {
      this.errors.push(`The strand ${this.strand} must be a string!`);
    }
    return this.errors.length < 1;
  }

  get fill() {
    return 'lightgray';
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

  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    [
      {label: 'Chromosome', value: this.chromosome},
      {label: 'Start Point (chromosome)', value: d3.format(',')(this.startPoint)},
      {label: 'End Point (chromosome)', value: d3.format(',')(this.endPoint - 1)}, // because endpoint is inclusive
      {label: 'Read Length', value: d3.format(',')(this.intervalLength)},
      {label: 'Strand', value: this.strand},
      {label: 'Read', value: this.read.title}]
      .forEach(function(e,j) {
       content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
     });
    return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
  }

  get points() {
    if (this.shapeWidth > this.margins.arrow) {
      if (this.strand === "+") {
        return [
          0, 0,
          d3.max([this.shapeWidth - this.margins.arrow, 0]), 0,
          this.shapeWidth, 0.5 * this.shapeHeight,
          d3.max([this.shapeWidth - this.margins.arrow, 0]), this.shapeHeight,
          0, this.shapeHeight];
      } else if (this.strand === "-") {
        return [
          d3.min([this.margins.arrow, this.shapeWidth]), 0,
          this.shapeWidth, 0,
          this.shapeWidth, this.shapeHeight,
          d3.min([this.margins.arrow, this.shapeWidth]), this.shapeHeight,
          0, 0.5 * this.shapeHeight];
      }
    } else {
      return [
        0, 0,
        this.shapeWidth, 0,
        this.shapeWidth, this.shapeHeight,
        0, this.shapeHeight];
    } 
  }
  
}