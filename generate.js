const fs = require('fs');
const downsampler = require('downsample-lttb');
const d3 = require('d3');

function guid() {

  function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
  }
  // then to call it, plus stitch in '4' in the third group
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

fs.readFile('./public/metadata.json', (err, metadataContent) => {
  if (err) {
    console.log(`File not found: ${err}`)
    return;
  } else {
    let dataInput = Object.assign({}, JSON.parse(metadataContent));
    let genomeLength = dataInput.metadata.reduce((acc, elem) => (acc + elem.endPoint - elem.startPoint), 0);
    let boundary = 0;
    let chromoBins = dataInput.metadata.reduce((hash, element) => {
      let chromoLength = element.endPoint - element.startPoint;
      hash[element.chromosome] = {scale: d3.scaleLinear().domain([0, element.endPoint]).range([boundary, boundary + chromoLength]), records: [], color: element.color}; 
      boundary += chromoLength;
      return hash; 
    }, {});
    fs.readdirSync('./coverage/')
    .filter((d,i) =>  fs.lstatSync(`./coverage/${d}`).isDirectory())
    .map((dataFile) => {
      let records = [];
      fs.readdirSync(`./coverage/${dataFile}/`).map((chromoData) => {
        let contents = fs.readFileSync(`./coverage/${dataFile}/${chromoData}`);
        let dataInput = Object.assign({}, JSON.parse(contents));
        let results = [];
        dataInput.coverage.forEach((cov,i) => {
          cov.y.forEach((k,j) => {
            let point = {chromosome: cov.chromosome, x: (cov.startPoint + j * cov.binwidth + 1), y: k};
            point.place = chromoBins[cov.chromosome].scale(point.x);
            point.color = chromoBins[cov.chromosome].color;
            results.push(point);
          });
        });
        //console.log(chromoData, dataInput.coverage.length, results.length);
        if (results.length > 0) {
          let downsampledSeries = downsampler.processData(results.map(d => [d.place,d.y]), 2000);
          downsampledSeries.forEach((d,i) => {
            records.push({iid: guid(), chromosome: results[0].chromosome, place: d[0], x: Math.round(chromoBins[results[0].chromosome].scale.invert(d[0])), y: d[1], color: results[0].color});
          });
        }
      });
      //console.log(records.length)
      fs.writeFile(`./coverage/${dataFile}.json`, JSON.stringify(records.sort((x,y) => d3.ascending(x.place, y.place)).map((d,i) => {d.iid = i; return d;}), null, 2), (err) => {
        if (err) throw err;
          console.log('complete');
      });
    });
  }
});