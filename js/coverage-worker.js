// Running the loading of the genes


// Setup an event listener that will handle messages sent to the worker.
self.addEventListener('message', (e) => {
  /* Bring in D3.js*/
  importScripts( "/js/external/d3.min.js");
  importScripts( "/js/base.js");
  importScripts( "/js/chromo.js");
  importScripts( "/js/misc.js");
  importScripts( "/js/coverage-point.js");

  let genomeLength = e.data.dataInput.metadata.reduce((acc, elem) => (acc + elem.endPoint - elem.startPoint), 0);
  let boundary = 0;
  let genomeScale = d3.scaleLinear().domain([0, genomeLength]).range([0, e.data.width]);
  let chromoBins = e.data.dataInput.metadata.reduce((hash, element) => {
    let chromo = new Chromo(element);
    chromo.scaleToGenome = d3.scaleLinear().domain([0, chromo.endPoint]).range([boundary, boundary + chromo.length]);
    chromo.scale = d3.scaleLinear().domain([0, chromo.endPoint]).range([genomeScale(boundary), genomeScale(boundary + chromo.length)]);
    chromo.innerScale = d3.scaleLinear().domain([0, chromo.endPoint]).range([genomeScale(chromo.startPoint), genomeScale(chromo.endPoint)]);
    hash[element.chromosome] = chromo; 
    boundary += chromo.length;
    return hash; 
  }, {});
  let q = d3.queue();
  // e.data.dataInput.metadata.slice(4,7).forEach((k,j) => {
  //   q.defer(d3.json, `/coverage/${e.data.dataFileName}/${e.data.dataFileName}.${k.chromosome}.json`);
  // });
  // e.data.dataInput.metadata.slice(4,7).forEach((k,j) => {
     q.defer(d3.json, `/coverage/${e.data.dataFileName}/${e.data.dataFileName}.${e.data.chromosome}.json`);
  // });
  q.awaitAll((error, results) => {
    if (error) return;
    console.log('Coverage files loaded:', results.length);
    e.data.coveragePoints = [];
    results.forEach((res) => {
      res.coverage.forEach((d,i) => {
        d.y.forEach((k,j) => {
          let point = new CoveragePoint(d.iid, d.chromosome, d.startPoint + j * d.binwidth, Math.floor(chromoBins[d.chromosome].scaleToGenome(d.startPoint + j * d.binwidth + 1)), k);
          point.color = chromoBins[point.chromosome].color;
          e.data.coveragePoints.push(point);
        });
      });
    });
    self.postMessage(e.data);
  });
}, false);