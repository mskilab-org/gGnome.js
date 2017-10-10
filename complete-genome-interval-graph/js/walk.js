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
  }

  // The title for the popover on the intervals
  get popoverTitle() {
    return 'Interval #' + this.title;
  }

  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    [{label: 'Chromosome', value: this.chromosome}, {label: 'Jabba', value: this.y}, {label: 'Start Point (chromosome)', value: d3.format(',')(this.startPoint)}, {label: 'Start Point (genome)', value: d3.format(',')(this.startPlace)},
     {label: 'End Point (chromosome)', value: d3.format(',')(this.endPoint)}, {label: 'End Point (genome)', value: d3.format(',')(this.endPlace)}, {label: 'Interval Length', value: d3.format(',')(this.intervalLength)}, {label: 'Strand', value: this.strand}].forEach(function(e,j) {
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

