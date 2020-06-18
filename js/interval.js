class Interval extends Base {

  constructor(inter) {
    super();
    this.iid = inter.iid;
    this.siid = inter.siid;
    this.chromosome = inter.chromosome;
    this.startPoint = inter.startPoint;
    this.endPoint = inter.endPoint;
    this.annotation = inter.annotation;
    this.metadata = inter.metadata || {};
    this.annotationArray = inter.annotation ? inter.annotation.split('|') : [];
    this.intervalLength = this.endPoint - this.startPoint;
    this.y = inter.y;
    this.title = inter.title;
    this.type = inter.type;
    this.strand = inter.strand;
    this.sequence = inter.sequence;
    this.errors = [];
    this.attributes = [
      {label: 'Chromosome', value: this.chromosome}, 
      {label: 'Y', value: this.y}, 
      {label: 'Start Point (chromosome)', value: d3.format(',')(this.startPoint)},
      {label: 'End Point (chromosome)', value: d3.format(',')(this.endPoint - 1)}, // because endpoint is inclusive 
      {label: 'Interval Length', value: d3.format(',')(this.intervalLength)}];
    if (this.strand) {
      this.attributes.push({label: 'Strand', value: this.strand});
    }
    if (this.sequence) {
      this.attributes.push({label: 'Sequence', value: this.sequence});
    }
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
    if (!Number.isInteger(this.y) || (this.y < 0)) {
      this.errors.push(`The y ${this.y} must be a non-negative integer!`);
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

  get isSubInterval() {
    return this.mode === 'subinterval';
  }

  // The title for the popover on the intervals
  get popoverTitle() {
    return  ((this.siid > 0) ? 'Sub-' : '') + 'Interval #' + this.title + (this.annotation ? (' : ' + this.annotation) : '');
  }

  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    this.attributes.forEach(function(e,j) {
       content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
     });
     Object.keys(this.metadata).forEach((key) => {
        content += '<tr><td class="table-label" align="left" width="250" valign="top" colspan="1"><strong>' +  Misc.humanize(key) +'</strong></td><td class="table-value" width="100" align="right" valign="top">' + this.metadata[key] + '</td></tr>';
     })
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