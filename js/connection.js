class Connection extends Base {

  constructor(con) {
    super();
    this.cid = con.cid;
    this.source = con.source ? {sign: Math.sign(con.source), intervalId: Math.abs(con.source)} : null;
    this.sink = con.sink ? {sign: Math.sign(con.sink), intervalId: Math.abs(con.sink)} : null;
    this.title = con.title;
    this.type = con.type;
    this.weight = con.weight;
    this.metadata = con.metadata || {};
    this.annotation = con.annotation;
    this.annotationArray = con.annotation ? con.annotation.split('|') : [];
    this.styleClass = `popovered connection local ${con.type}`;
    this.clipPath = 'url("#clip")';
    this.line = d3.line().curve(d3.curveBasis).x((d) => d[0]).y((d) => d[1]);
    this.errors = [];
  }

  get isSubConnection() {
    return this.mode === 'subconnection';
  }

  valid() {
    this.errors = [];
    if (!Number.isInteger(this.cid) || (this.cid < 1)) {
      this.errors.push(`The cid ${this.cid} must be a positive integer!`);
    }
    if (!Misc.connectionLabels.includes(this.type)) {
      this.errors.push(`The type ${this.type} is not a valid type! It must be one of ${Misc.connectionLabels}`);
    }
    if ((this.type !== 'LOOSE') && (this.source === null)) {
      this.errors.push(`The type ${this.type} is not LOOSE and the source is not an integer!`);
    }
    if ((this.type !== 'LOOSE') && (this.sink === null)) {
      this.errors.push(`The type ${this.type} is not LOOSE and the sink is not an integer!`);
    }
    if ((this.type === 'LOOSE') && (this.sink === null) && (this.source === null)) {
      this.errors.push(`The type is LOOSE and both the source AND the sink are not defined!`);
    }
    if ((this.type === 'LOOSE') && (this.sink !== null) && (this.source !== null)) {
      this.errors.push(`The type is LOOSE and both the source AND the sink are defined!`);
    }
    if (!Number.isInteger(this.weight) || (this.weight < 0)) {
      this.errors.push(`The weight ${this.weight} must be a non-negative integer!`);
    }
    if (!Misc.isString(this.title)) {
      this.errors.push(`The title ${this.title} must be a string!`);
    }
    return this.errors.length < 1;
  }
  
  pinpoint(intervalBins) {
    if (this.source) {
      this.source.interval = intervalBins[this.source.intervalId];
      this.source.y = this.source.interval.y;
      this.source.point = this.source.sign > 0 ? this.source.interval.endPoint : this.source.interval.startPoint;
      this.source.place = this.source.sign > 0 ? this.source.interval.endPlace : this.source.interval.startPlace;
      this.touchPlaceX = this.source.place;
      this.touchPlaceY = this.source.y;
      this.touchPlaceSign = this.source.sign;
    }
    if (this.sink) {
      this.sink.interval = intervalBins[this.sink.intervalId];
      this.sink.y = this.sink.interval.y;
      this.sink.point = this.sink.sign > 0 ? this.sink.interval.endPoint : this.sink.interval.startPoint;
      this.sink.place = this.sink.sign > 0 ? this.sink.interval.endPlace : this.sink.interval.startPlace;
      this.touchPlaceX = this.sink.place;
      this.touchPlaceY = this.sink.y;
      this.touchPlaceSign = this.sink.sign;
    }
    this.distance = ((this.source) && (this.sink)) ? d3.format(',')(Math.abs(this.sink.place - this.source.place)) : '-';
  }

  locateAnchor(fragment) {
    this.kind = 'ANCHOR';
    this.styleClass = `popovered connection anchor`;
    if ((this.source.place <= fragment.domain[1]) && (this.source.place >= fragment.domain[0])) {
      this.source.scale = fragment.scale;
      this.touchPlaceX = this.source.sign > 0 ? this.source.interval.endPlace : this.source.interval.startPlace;
      this.touchPlaceY = this.source.y;
      this.touchPlaceSign = this.source.sign;
      this.fill = d3.rgb(this.sink.interval.color).darker(1);
      this.stroke = '#000';
      this.otherEnd = this.sink;
    } else {
      this.sink.scale = fragment.scale;
      this.touchPlaceX = this.sink.sign > 0 ? this.sink.interval.endPlace : this.sink.interval.startPlace;
      this.touchPlaceY = this.sink.y;
      this.touchPlaceSign = this.sink.sign;
      this.fill = d3.rgb(this.source.interval.color).darker(1);
      this.stroke = '#000';
      this.otherEnd = this.source;
    }
    this.touchScale = fragment.scale;

    this.identifier = Misc.guid;
  }

  get transform() {
    if (this.kind === 'ANCHOR') {
      this.points = [this.touchScale(this.touchPlaceX), this.yScale(this.touchPlaceY)];
      return'translate(' + this.points + ')';
    } else {
      return 'translate(0,0)';
    }
  }

  get render() {
    if (this.kind === 'ANCHOR') {
      this.path = this.arc(this.touchPlaceSign);
    } else {
      this.points = this.type === 'LOOSE' ? this.looseConnectorEndpoints : this.interConnectorEndpoints;
      this.path = this.line(this.points);
    }
    return this.path;
  }

  // Calculate the points for inter-chromosome connections
  get interConnectorEndpoints() {
    var points = [];

    var origin = d3.min([this.source.scale(this.source.place), this.sink.scale(this.sink.place)]);
    var target = (origin === this.source.scale(this.source.place)) ? this.sink.scale(this.sink.place) : this.source.scale(this.source.place);
    var originSign = (origin === this.source.scale(this.source.place)) ? this.source.sign : this.sink.sign;
    var targetSign = (originSign === this.source.sign) ? this.sink.sign : this.source.sign;
    var originY = (origin === this.source.scale(this.source.place)) ? (this.source.y) : (this.sink.y);
    var targetY = (originY === this.source.y) ? (this.sink.y) : (this.source.y);
    var midPointX = 0.5 * origin + 0.5 * target;
    var midPointY = 0.5 * originY + 0.5 * targetY;

    if ((this.type === 'ALT') && (this.mode !== 'subconnection')) {
      if (Math.abs(this.source.y) === Math.abs(this.sink.y)) {
        points = [
                [origin, this.yScale(originY)],
                [d3.min([origin + Math.sign(originSign) * 5,  midPointX - 5]), this.yScale(originY)],
                [d3.min([origin + Math.sign(originSign) * 25, midPointX - 5]), this.yScale((midPointY + (midPointY < 10 ? 0.5 : 5 )))],
                [midPointX, this.yScale((midPointY + (midPointY < 10 ? 0.75 : 10 )))],
                [d3.max([target + Math.sign(targetSign) * 25, midPointX + 5]), this.yScale((midPointY + (midPointY < 10 ? 0.5 : 5 )))],
                [d3.max([target + Math.sign(targetSign) * 5,  midPointX + 5]), this.yScale(targetY)],
                [target, this.yScale(targetY)]];
      } else {
        points = [
                [origin, this.yScale(originY)],
                [origin + Math.sign(originSign) * 5, this.yScale(originY)],
                [origin + Math.sign(originSign) * 25, this.yScale((originY + Math.sign(targetY - originY) * (originY < 10 ? 0.25 : 5 )))],
                [target + Math.sign(targetSign) * 25, this.yScale((targetY - Math.sign(targetY - originY) * (targetY < 10 ? 0.25 : 5 )))],
                [target + Math.sign(targetSign) * 5, this.yScale(targetY)],
                [target, this.yScale(targetY)]];
      }
    } else {
      points = [
              [origin, this.yScale(originY)],
              [target, this.yScale(targetY)]];
    }
    return points;
  }

  // The array of points forming the loose connections with one endpoint missing
  get looseConnectorEndpoints() {
    return [
      [this.touchScale(this.touchPlaceX), this.yScale(this.touchPlaceY)],
      [this.touchScale(this.touchPlaceX) + this.touchPlaceSign * 15, this.yScale(this.touchPlaceY + (this.touchPlaceY < 10 ? 0.25 : 5 ))],
      [this.touchScale(this.touchPlaceX) + this.touchPlaceSign * 5,  this.yScale(this.touchPlaceY + (this.touchPlaceY < 10 ? 0.75 : 5 ))]];
  }

  // The title for the popover on the connections
  get popoverTitle() {
    return 'Connection #' + this.cid + ' - ' + this.type + (this.annotation ? (' : ' + this.annotation) : '');
  }

  // The content for the popover on the connections
  get popoverContent() {
    var content = '';
    var array = [
      [`<strong class="info">${this.title}</strong>`, '<strong>Source</strong>', '<strong>Sink</strong>'],
      ['Chromosome', ((!this.source) ? 'Unknown' : this.source.interval.chromosome), ((!this.sink) ? 'Unknown' : this.sink.interval.chromosome)], 
      ['Interval', ((!this.source) ? 'Unknown' : (this.source.intervalId + (this.source.sign > 0 ? ' (right)' : ' (left)'))), ((!this.sink) ? 'Unknown' : (this.sink.intervalId + (this.sink.sign > 0 ? ' (right)' : ' (left)')))],
      ['Point (chromosome)', ((!this.source) ? 'Unknown' : d3.format(',')(this.source.point)), ((!this.sink) ? 'Unknown' : d3.format(',')(this.sink.point))],
      ['Y', ((!this.source) ? 'Unknown' : d3.format('.2f')(this.source.y)), ((!this.sink) ? 'Unknown' : d3.format('.2f')(this.sink.y))],
      ['Weight', '&nbsp;', this.weight]
    ];
    array.forEach(function(e,j) {
       content += '<tr class="row-'+ e[0].replace(/<[^>]*>?/gm, '').toLowerCase() +'"><td class="table-label" align="left" width="150" valign="top"><strong>' + e[0] + 
      '</strong></td><td class="table-value" width="100" align="right" valign="top">' + e[1] + 
      '</td><td class="table-value" width="100" align="right" valign="top">' + e[2] + '</td></tr>';
     });
     content += '<tr><td class="table-label" align="left" width="250" valign="top" colspan="2"><strong>Distance</strong></td><td class="table-value" width="100" align="right" valign="top">' + (this.distance) + '</td></tr>';
     Object.keys(this.metadata).forEach((key) => {
        content += '<tr><td class="table-label" align="left" width="250" valign="top" colspan="2"><strong>' +  Misc.humanize(key) +'</strong></td><td class="table-value" width="100" align="right" valign="top">' + this.metadata[key] + '</td></tr>';
     })
    return '<div class="row"><div class="col-lg-12"><table class="connections-popover"width="0" border="0" align="left" cellpadding="0" cellspacing="0"><tbody>' + content + '</tbody></table></div></div>';
  }

  get location() {
    return `${((!this.source) ? 'Unknown' : this.source.interval.chromosome)}: 
     ${((!this.source) ? 'Unknown' : (this.source.point))} | 
     ${((!this.sink) ? 'Unknown' : this.sink.interval.chromosome)}: 
     ${((!this.sink) ? 'Unknown' : (this.sink.point))}
    `;
  }

  get bounds() {
    let boundaries = [];
    if (this.source && this.sink) {
      boundaries[this.source.place, this.sink.place];
    } else if (this.source && !this.sink) {
      boundaries[this.source.place, this.source.place];
    } else if (!this.source && this.sink) {
      boundaries[this.sink.place, this.sink.place];
    }
    return boundaries.sort((a,b) => d3.ascending(a, b));
  }

  get toString() {
    return `identifier: ${this.identifier},
    cid: ${this.cid},
    source: ${this.source},
    sink: ${this.sink},
    title: ${this.title},
    type: ${this.type}
    weight: ${this.weight}
    `;
  }
}