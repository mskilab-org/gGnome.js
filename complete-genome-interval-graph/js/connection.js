class Connection extends Base {

  constructor(con) {
    super();
    this.cid = con.cid;
    this.source = con.source ? {sign: Math.sign(con.source), intervalId: Math.abs(con.source)} : null;
    this.sink = con.sink ? {sign: Math.sign(con.sink), intervalId: Math.abs(con.sink)} : null;
    this.title = con.title;
    this.type = con.type;
    this.weight = con.weight;
    this.styleClass = `popovered connection local ${con.type}`;
    this.clipPath = 'url("#clip")';
    this.line = d3.line().curve(d3.curveBasis).x((d) => d[0]).y((d) => d[1]);
  }

  pinpoint(intervalBins) {
    if (this.source) {
      this.source.interval = intervalBins[this.source.intervalId];
      this.source.y = this.source.interval.y;
      this.source.point = this.source.sign > 0 ? this.source.interval.endPoint : this.source.interval.startPoint;
      this.source.place = this.source.sign > 0 ? this.source.interval.endPlace : this.source.interval.startPlace;
    }
    if (this.sink) {
      this.sink.interval = intervalBins[this.sink.intervalId];
      this.sink.y = this.sink.interval.y;
      this.sink.point = this.sink.sign > 0 ? this.sink.interval.endPoint : this.sink.interval.startPoint;
      this.sink.place = this.sink.sign > 0 ? this.sink.interval.endPlace : this.sink.interval.startPlace;
    }
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