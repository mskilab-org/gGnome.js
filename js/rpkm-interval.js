class RPKMInterval extends Base {

  constructor(inter) {
    super();
    this.iid = inter.iid;
    this.chromosome = inter.chromosome;
    this.startPoint = inter.start;
    this.endPoint = inter.end;
    this.intervalLength = this.endPoint - this.startPoint;
    this.y = inter.y;
    this.title = inter.iid;
    this.errors = [];
    this.attributes = [
      {label: 'Chromosome', value: this.chromosome}, 
      {label: 'Y', value: this.y}, 
      {label: 'Start Point (chromosome)', value: d3.format(',')(this.startPoint)},
      {label: 'End Point (chromosome)', value: d3.format(',')(this.endPoint - 1)}, // because endpoint is inclusive 
      {label: 'Length', value: d3.format(',')(this.intervalLength)}];
    if (this.strand) {
      this.attributes.push({label: 'Strand', value: this.strand});
    }
    if (this.sequence) {
      this.attributes.push({label: 'Sequence', value: this.sequence});
    }
  }

  // The title for the popover on the intervals
  get popoverTitle() {
    return  ((this.siid > 0) ? 'Sub-' : '') + 'RPKM Bar #' + this.title + (this.annotation ? (' : ' + this.annotation) : '');
  }

  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    this.attributes.forEach(function(e,j) {
       content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
     });
    return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
  }

  get location() {
    return `${this.chromosome}: ${this.startPoint} - ${this.endPoint}`;
  }

  get toString() {
    return `identifier: ${this.identifier},
    iid: ${this.iid},
    chromosome: ${this.chromosome},
    startPoint: ${this.startPoint},
    endPoint: ${this.endPoint},
    y: ${this.y},
    title: ${this.title},
    type: ${this.type},
    strand: ${this.strand}
    strand: ${this.strand}
    sequence: ${this.sequence}
    `;
  }
}