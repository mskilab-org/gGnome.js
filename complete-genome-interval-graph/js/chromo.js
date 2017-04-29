class Chromo {

  constructor(chromoObject) {
    this.chromosome = chromoObject.chromosome;
    this.startPoint = chromoObject.startPoint;
    this.endPoint = chromoObject.endPoint;
    this.length = this.endPoint - this.startPoint + 1;
    this.color = chromoObject.color;
    this.scale = null;
    this.innerScale = null;
  }

  get chromoWidth() {
    return this.scale.range()[1] - this.scale.range()[0];
  }

  get chromoStartPosition() {
    return this.scale.range()[0];
  }

}