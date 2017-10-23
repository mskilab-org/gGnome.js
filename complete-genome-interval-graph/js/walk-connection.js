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

  // Calculate the points for inter-chromosome connections
  get interConnectorEndpoints() {
    var points = [];

    var origin = d3.min([this.source.scale(this.source.place), this.sink.scale(this.sink.place)]);
    var target = d3.max([this.source.scale(this.source.place), this.sink.scale(this.sink.place)]);
    var originSign = (origin === this.source.scale(this.source.place)) ? this.source.sign : this.sink.sign;
    var targetSign = (target === this.source.scale(this.source.place)) ? this.source.sign : this.sink.sign;
    var originY = (origin === this.source.scale(this.source.place)) ? (this.source.y) : (this.sink.y);
    var targetY = (target === this.source.scale(this.source.place)) ? (this.source.y) : (this.sink.y);
    var originYScale = (origin === this.source.scale(this.source.place)) ? (this.source.fragment.yWalkScale) : (this.sink.fragment.yWalkScale);
    var targetYScale = (target === this.source.scale(this.source.place)) ? (this.source.fragment.yWalkScale) : (this.sink.fragment.yWalkScale);
    var midPointX = 0.5 * origin + 0.5 * target;
    var midPointY = 0.5 * originY + 0.5 * targetY;

    if (this.type === 'ALT') {
      if (Math.abs(this.source.y) === Math.abs(this.sink.y)) {
        points = [
                [origin, originYScale(originY)],
                [d3.min([origin + Math.sign(originSign) * 5,  midPointX - 5]), originYScale(originY)],
                [d3.min([origin + Math.sign(originSign) * 25, midPointX - 5]), originYScale(midPointY) - (5)],
                [midPointX, originYScale(midPointY) - (10)],
                [d3.max([target + Math.sign(targetSign) * 25, midPointX + 5]), targetYScale(midPointY) - (5)],
                [d3.max([target + Math.sign(targetSign) * 5,  midPointX + 5]), targetYScale(targetY)],
                [target, targetYScale(targetY)]];
      } else {
        points = [
                [origin, originYScale(originY)],
                [origin + Math.sign(originSign) * 5, originYScale(originY)],
                [origin + Math.sign(originSign) * 25, originYScale(originY) + Math.sign(targetY - originY) * (0.25)],
                [target + Math.sign(targetSign) * 25, targetYScale(targetY) - Math.sign(targetY - originY) * (0.25)],
                [target + Math.sign(targetSign) * 5, targetYScale(targetY)],
                [target, targetYScale(targetY)]];
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
      [this.touchScale(this.touchPlaceX) + this.touchPlaceSign * 15, this.yScale(this.touchPlaceY) - 5],
      [this.touchScale(this.touchPlaceX) + this.touchPlaceSign * 5,  this.yScale(this.touchPlaceY) - 15]];
  }
	
  // The title for the popover on the connections
  get popoverTitle() {
    return 'Connection #' + this.cid + ' - ' + this.type + ' of walk #' + this.walk.pid;
  }
}