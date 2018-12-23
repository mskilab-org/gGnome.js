class CoveragePoint extends Base {

  constructor(cov) {
    let {chromosome, place, x,y, color} = cov;
    super();
    this.identifier = `${chromosome}-${x}-${y}`;
    this.iid = this.identifier;
    this.title = this.identifier;
    this.chromosome = chromosome;
    this.place = place;
    this.color = color;
    this.x = x;
    this.y = y;
  }

  // The title for the popover on the intervals
  get popoverTitle() {
    return  'Coverage #' + this.title;
  }

  get radius() {
    return 2;
  }

  get fill() {
    let col = d3.rgb(this.color);
    return [col.r / 255.0, col.g / 255.0, col.b / 255.0, 1.0];
  }

  get stroke() {
    return d3.rgb(this.color).darker(1);
  }

  get strokeWidth() {
    return 1;
  }

  get attributes() {
    return [
      {label: 'Chromosome', value: this.chromosome}, 
      {label: 'Y', value: this.y}, 
      {label: 'Location (chromosome)', value: d3.format(',')(this.x)},
      {label: 'Place', value: d3.format(',')(this.place)},
      {label: 'Ratio', value: d3.format(".0%")(this.y)}];
  }


  // The content for the popover of the intervals
  get popoverContent() {
    let content = '';
    this.attributes.forEach(function(e,j) {
       content += '<tr><td class="table-label" align="left" width="200" valign="top"><strong>' + e.label + ':</strong></td><td class="table-value" width="100" align="right" valign="top">' + e.value + '</td></tr>';
     });
    return '<div class="row"><div class="col-lg-12"><table width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
  }

}