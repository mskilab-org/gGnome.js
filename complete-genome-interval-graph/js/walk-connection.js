class WalkConnection extends Connection {

  constructor(con, wlk) {
    super(con);
		this.walk = wlk;
  }

  pinpoint() {
    if (this.source) {
      this.source.interval = this.walk.intervals.find((d,i) => this.source.intervalId === d.iid);
      this.source.y = this.source.interval.y;
      this.source.point = this.source.sign > 0 ? this.source.interval.endPoint : this.source.interval.startPoint;
      this.source.place = this.source.sign > 0 ? this.source.interval.endPlace : this.source.interval.startPlace;
      this.touchPlaceX = this.source.place;
      this.touchPlaceY = this.source.y;
      this.touchPlaceSign = this.source.sign;
    }
    if (this.sink) {
      this.sink.interval = this.walk.intervals.find((d,i) => this.sink.intervalId === d.iid);
      this.sink.y = this.sink.interval.y;
      this.sink.point = this.sink.sign > 0 ? this.sink.interval.endPoint : this.sink.interval.startPoint;
      this.sink.place = this.sink.sign > 0 ? this.sink.interval.endPlace : this.sink.interval.startPlace;
      this.touchPlaceX = this.sink.place;
      this.touchPlaceY = this.sink.y;
      this.touchPlaceSign = this.sink.sign;
    }
    this.distance = ((this.source) && (this.sink)) ? d3.format(',')(Math.abs(this.sink.place - this.source.place)) : '-';
  }
	
  // The title for the popover on the connections
  get popoverTitle() {
    return 'Connection #' + this.cid + ' - ' + this.type + ' of walk #' + this.walk.pid;
  }
}