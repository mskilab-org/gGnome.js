// Running the loading of the genes


// Setup an event listener that will handle messages sent to the worker.
self.addEventListener('message', (e) => {
  /* Bring in D3.js*/
  importScripts( "/js/external/d3.min.js");
  importScripts( "/js/chromo.js");
  importScripts( "/js/base.js");
  importScripts( "/js/interval.js");
  importScripts( "/js/gene.js");

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
  d3.json('/public/genes.json', (error, results) => {
    if (error) return;
    console.log('genes succesfully loaded!', results.length);
    e.data.dataInput.genes = results.genes;
    e.data.dataInput.genes.forEach((d,i) => { d.endPoint += 1 }); // because endpoint is inclusive
    e.data.geneBins = {};
    e.data.genes = e.data.dataInput.genes.filter((d,i) => d.type === 'gene').map((d,i) => {
      let gene = new Gene(d);
      gene.startPlace = Math.floor(chromoBins[gene.chromosome].scaleToGenome(gene.startPoint));
      gene.endPlace = Math.floor(chromoBins[gene.chromosome].scaleToGenome(gene.endPoint));
      gene.color = chromoBins[gene.chromosome].color;
      gene.y = 0;
      e.data.geneBins[gene.iid] = gene;
      return gene;
    });
    // Send the message back.
    self.postMessage(e.data);
  });
}, false);