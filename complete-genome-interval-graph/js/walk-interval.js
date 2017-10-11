class WalkInterval extends Interval {

  constructor(hap, wlk) {
    super(hap);
		this.walk = wlk; 
		this.uid = wlk.pid + '#' + this.iid;
  }

  // The title for the popover on the gene
  get popoverTitle() {
    return 'Walk Interval #' + this.title + ' of walk #' + this.walk.pid;
  }

  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    [{label: 'Chromosome', value: this.chromosome}, {label: 'Y', value: this.y}, {label: 'Start Point (chromosome)', value: d3.format(',')(this.startPoint)}, {label: 'Start Point (genome)', value: d3.format(',')(this.startPlace)},
     {label: 'End Point (chromosome)', value: d3.format(',')(this.endPoint)}, {label: 'End Point (genome)', value: d3.format(',')(this.endPlace)}, {label: 'Interval Length', value: d3.format(',')(this.intervalLength)}, {label: 'Strand', value: this.strand}].forEach(function(e,j) {
       content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
     });
    return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
  }


}