class Misc {

  static isString(obj) {
    return (Object.prototype.toString.call(obj) === '[object String]');
  }

  static get chromosomeLabels() {
    return new Array(22).fill(0, 0, 22).map((x,i) => `${(i + 1)}`).concat(['X','Y','M']);
  }

  static get connectionLabels() {
    return ['LOOSE', 'REF', 'ALT'];
  }

  static unique(array) {
    return Object.assign([],array).filter((value, index, self) => { 
      return self.indexOf(value) === index;
    });
  }

  static get server() {
    return 'http://localhost:8000'
  }

  static alerting(text, type) {
    return $('#detail').append(`<div class="alert alert-${type}" role="alert">${text}</div>`);
  }

  static get metadata() {
    var input = (function () {
        var json = null;
        $.ajax({
            'async': false,
            'global': false,
            'url': Misc.server + '/metadata',
            'dataType': 'json',
            'success': (data) => {
                json = data;
            }
        });
        return json;
    })();
    return input.metadata;
  }

  static intervals(startPlace, endPlace) {
    var input = (function () {
        var json = null;
        $.ajax({
            'async': false,
            'global': false,
            'url': Misc.server + '/intervals',
            'data': {"startPlace": startPlace, "endPlace": endPlace},
            'dataType': 'json',
            'success': (data) => {
                json = data;
            }
        });
        return json;
    })();
    return input.map((d,i) => { return new Interval(d)});
  }

  static get guid() {

    function S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
    }
    // then to call it, plus stitch in '4' in the third group
    return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
  }

  static magnitude(n) {
    let order = Math.floor(Math.log(n) / Math.LN10 + 0.000000001); // because float math sucks like that
    return Math.pow(10, order);
  }

  static groupBy(list, keyGetter) {
      const map = new Map();
      list.forEach((item) => {
          const key = keyGetter(item);
          const collection = map.get(key);
          if (!collection) {
              map.set(key, [item]);
          } else {
              collection.push(item);
          }
      });
      return map;
  }

}