class Misc {

  static getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(window.location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  static isString(obj) {
    return (Object.prototype.toString.call(obj) === '[object String]');
  }

  static power(x) {
    return Math.pow(10, (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1);
  }

  static get chromosomeLabels() {
    return new Array(22).fill(0, 0, 22).map((x,i) => `${(i + 1)}`).concat(['X','Y','M']);
  }

  static get connectionLabels() {
    return ['LOOSE', 'REF', 'ALT'];
  }

  static shuffleArray(arr) {
    let array = Object.assign(arr);
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  static unique(array) {
    return Object.assign([],array).filter((value, index, self) => { 
      return self.indexOf(value) === index;
    });
  }

  static alerting(text, type) {
    return $('#detail').append(`<div class="alert alert-${type}" role="alert">${text}</div>`);
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

  static lessThanZeroError(p) {
    return 'Percentile expect number >= 0 but given "' + p + '" and its type is "' + (typeof p) + '".';
  }


  static graterThanHundredError(p) {
    return 'Percentile expect number <= 100 but given "' + p + '" and its type is "' + (typeof p) + '".';
  }


  static nanError(p) {
    return 'Percentile expect number but given "' + p + '" and its type is "' + (typeof p) + '".';
  }

  static percentile(p, list, fn) {
    if (isNaN(Number(p))) {
      throw new Error(nanError(p));
    }

    p = Number(p);

    if (p < 0) {
      throw new Error(lessThanZeroError(p));
    }

    if (p > 100) {
      throw new Error(graterThanHundredError(p));
    }

    list = list.sort(function (a, b) {
      if (fn) {
        a = fn(a);
        b = fn(b);
      }

      a = Number.isNaN(a) ? Number.NEGATIVE_INFINITY : a;
      b = Number.isNaN(b) ? Number.NEGATIVE_INFINITY : b;

      if (a > b) return 1;
      if (a < b) return -1;

      return 0;
    });

    if (p === 0) return list[0];

    var kIndex = Math.ceil(list.length * (p / 100)) - 1;

    return list[kIndex];
  }

}