class Gene extends Interval {

  constructor(gen) {
    super(gen);
    this.group_id = gen.group_id;
    this.margins = {arrow: 5}
    this.coefficient = 1;
  }

  get fill() {
    if (this.type === 'gene') {
      return this.color;
    } else if (this.type === 'exon') {
      return "red";
    } else if (this.type === 'intron') {
      return "blue";
    } else if (this.type === 'UTR') {
      return "green";
    } else {
      return '#000';
    }
  }

  get stroke() {
    if (this.type === 'gene') {
      return d3.rgb(this.color).darker(1);
    } else {
      return d3.rgb(this.color).brighter(1);
    }
  }

  // The title for the popover on the gene
  get modalTitle() {
    return this.popoverTitle + ' | ' + this.chromosome + ':' + d3.format(',')(this.startPoint) + ' - ' + d3.format(',')(this.endPoint);
  }

  // The title for the popover on the gene
  get popoverTitle() {
    return 'Gene #' + this.title;
  }

  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    [{label: 'Chromosome', value: this.chromosome}, {label: 'Type', value: this.type}, {label: 'Start Point (chromosome)', value: d3.format(',')(this.startPoint)},
     {label: 'End Point (chromosome)', value: d3.format(',')(this.endPoint)}, {label: 'Length', value: d3.format(',')(this.intervalLength)}, {label: 'Strand', value: this.strand}].forEach(function(e,j) {
       content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
     });
    return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
  }

  get location() {
    return `${this.chromosome}: ${this.startPoint} - ${this.endPoint}`;
  }

  get points() {
    if (this.type === 'gene') {
      if (this.strand === "+") {
        return [
          0, - 0.5 * this.shapeHeight * this.coefficient,
          this.shapeWidth, - 0.5 * this.shapeHeight  * this.coefficient,
          this.shapeWidth, - this.margins.arrow  * this.coefficient,
          this.shapeWidth + this.margins.arrow, 0,
          this.shapeWidth, + this.margins.arrow  * this.coefficient,
          this.shapeWidth, + 0.5 * this.shapeHeight  * this.coefficient,
          0, + 0.5 * this.shapeHeight]
      } else if (this.strand === "-") {
        return [
          this.shapeWidth, - 0.5 * this.shapeHeight * this.coefficient,
          0, - 0.5 * this.shapeHeight * this.coefficient,
          0, - this.margins.arrow  * this.coefficient,
          0  - this.margins.arrow, 0,
          0, + this.margins.arrow  * this.coefficient,
          0, + 0.5 * this.shapeHeight  * this.coefficient,
          this.shapeWidth, + 0.5 * this.shapeHeight  * this.coefficient]
      } 
    } else {
      return [0, - 0.5 * this.shapeHeight * this.coefficient,
        this.shapeWidth, - 0.5 * this.shapeHeight * this.coefficient,
        this.shapeWidth, + 0.5 * this.shapeHeight * this.coefficient,
        0, + 0.5 * this.shapeHeight * this.coefficient]
    }
  }

}