// Function to flatten an array of arrays
function flatten(ary) {
  return ary.reduce(function(a, b) {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}

// Function to group the input data by chromosome
function getChromosomeBins(dataArray) {
  var bins = d3.map([], function(d) { return d.chromosome; });;
  dataArray.intervals.forEach(function(d,i) { 
    if (!bins.has(d.chromosome)) {
        bins.set(d.chromosome, {minPoint: undefined, maxPoint: undefined, minY: undefined, maxY: undefined, intervals: []});
      }
      var bin = bins.get(d.chromosome);
      bin.chromosome = d.chromosome;
      bin.minPoint = d3.min([d.startPoint, bin.minPoint]);
      bin.maxPoint = d3.max([d.endPoint, bin.maxPoint]);
      bin.minY = d3.min([d.y, bin.minY]);
      bin.maxY = d3.max([d.y, bin.maxY]);
      bin.intervals.push(d);
      bins.set(d.chromosome, bin);
  });
  return bins;
}