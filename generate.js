const fs = require('fs');
const d3 = require('d3');
const d3_hexbin = require('d3-hexbin');
const outliers = require('outliers');

const dimensions = {width: 1366, height: 200, radius: 3};

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
      fs.readdirSync(`./coverage/${dataFile}/`).map((chromoData) => { //if (chromoData !== 'HCC1143_100.1.json') return;
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
          let cleaned = results.filter(outliers('y'));
          let scaleX = d3.scaleLinear().domain(d3.extent(cleaned, d => d.place)).range([0, dimensions.width]);
          let scaleY = d3.scaleLinear().domain(d3.extent(cleaned, d => d.y)).range([0, dimensions.height]);
          let hexb = d3_hexbin.hexbin()
            .x(e => scaleX(e.place))
            .y(e => scaleY(e.y))
            .radius(dimensions.radius)
            .extent([[0,0], [dimensions.width, dimensions.height]]);
          let bins = hexb(cleaned);
          bins.forEach((bin,i) => {
            let d = bin[0];
            records.push({iid: guid(), chromosome: d.chromosome, place: d.place, x: d.x, y: d.y, color: d.color, density: bin.length});
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