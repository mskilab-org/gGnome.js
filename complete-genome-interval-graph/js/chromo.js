class Chromo {

  constructor(chromoObject) {
    this.chromosome = chromoObject.chromosome;
    this.startPoint = chromoObject.startPoint;
    this.endPoint = chromoObject.endPoint;
    this.length = this.endPoint - this.startPoint + 1;
    this.color = chromoObject.color;
  }
  
}