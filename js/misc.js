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

  static processData(series, threshold) {
    return Misc.largestTriangleThreeBuckets(series, threshold);
  }

  static largestTriangleThreeBuckets(data, threshold) {
    var floor = Math.floor,
    abs = Math.abs;

    var data_length = data.length;
    if (threshold >= data_length || threshold === 0) {
      return data; // Nothing to do
    }

    var sampled = [],
      sampled_index = 0;

    // Bucket size. Leave room for start and end data points
    var every = (data_length - 2) / (threshold - 2);

    var a = 0,  // Initially a is the first point in the triangle
      max_area_point,
      max_area,
      area,
      next_a;

    sampled[ sampled_index++ ] = data[ a ]; // Always add the first point

    for (var i = 0; i < threshold - 2; i++) {

      // Calculate point average for next bucket (containing c)
      var avg_x = 0,
        avg_y = 0,
        avg_range_start  = floor( ( i + 1 ) * every ) + 1,
        avg_range_end    = floor( ( i + 2 ) * every ) + 1;
      avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

      var avg_range_length = avg_range_end - avg_range_start;

      for ( ; avg_range_start<avg_range_end; avg_range_start++ ) {
        avg_x += data[ avg_range_start ][ 0 ] * 1; // * 1 enforces Number (value may be Date)
        avg_y += data[ avg_range_start ][ 1 ] * 1;
      }
      avg_x /= avg_range_length;
      avg_y /= avg_range_length;

      // Get the range for this bucket
      var range_offs = floor( (i + 0) * every ) + 1,
        range_to   = floor( (i + 1) * every ) + 1;

      // Point a
      var point_a_x = data[ a ][ 0 ] * 1, // enforce Number (value may be Date)
        point_a_y = data[ a ][ 1 ] * 1;

      max_area = area = -1;

      for ( ; range_offs < range_to; range_offs++ ) {
        // Calculate triangle area over three buckets
        area = abs( ( point_a_x - avg_x ) * ( data[ range_offs ][ 1 ] - point_a_y ) -
              ( point_a_x - data[ range_offs ][ 0 ] ) * ( avg_y - point_a_y )
              ) * 0.5;
        if ( area > max_area ) {
          max_area = area;
          max_area_point = data[ range_offs ];
          next_a = range_offs; // Next a is this b
        }
      }

      sampled[ sampled_index++ ] = max_area_point; // Pick this point from the bucket
      a = next_a; // This a is the next a (chosen b)
    }

    sampled[ sampled_index++ ] = data[ data_length - 1 ]; // Always add last

    return sampled;
  }

}