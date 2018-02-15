class Walk extends Base {

  constructor(walk) {
    super();
    this.pid = walk.pid;
    this.cn = walk.cn;
    this.type = walk.type;
    this.strand = walk.strand;
    this.cids = walk.cids;
    this.iids = walk.iids;
    this.title = `${this.pid} | ${this.cn}`;
    this.errors = [];
  }

  valid() {
    this.errors = [];
    if (!Number.isInteger(this.pid) || (this.pid < 1)) {
      this.errors.push(`The pid ${this.pid} must be a positive integer!`);
    }
    if (!Number.isInteger(this.cn) || (this.cn < 0)) {
      this.errors.push(`The cn ${this.cn} must be a non-negative integer!`);
    }
    if (!Misc.isString(this.type)) {
      this.errors.push(`The type ${this.type} must be a string!`);
    }
    if (!Misc.isString(this.strand)) {
      this.errors.push(`The strand ${this.stand} must be a string!`);
    }
    if (!Array.isArray(this.cids)) {
      this.errors.push(`The cids ${this.cids} Array object is missing!`);
    }
    if (!Array.isArray(this.iids)) {
      this.errors.push(`The iids ${this.iids} Array object is missing!`);
    }
    return this.errors.length < 1;
  }

  // The title for the popover on the intervals
  get popoverTitle() {
    return 'Interval #' + this.title;
  }

  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    [{label: 'Chromosome', value: this.chromosome}, {label: 'Y', value: this.y}, {label: 'Start Point (chromosome)', value: d3.format(',')(this.startPoint)},
     {label: 'End Point (chromosome)', value: d3.format(',')(this.endPoint)}, {label: 'Interval Length', value: d3.format(',')(this.intervalLength)}, {label: 'Strand', value: this.strand}].forEach(function(e,j) {
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
    title: ${this.title},
    type: ${this.type},
    strand: ${this.strand}
    `;
  }
}

