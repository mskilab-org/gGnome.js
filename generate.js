const fs = require('fs');
const d3 = require('d3');
const outliers = require('outliers');
const csvWriter = require('csv-write-stream');

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
        let iid = 0;
        dataInput.coverage.forEach((cov,i) => {
          cov.y.forEach((k,j) => {
            let point = {x: (cov.startPoint + j * cov.binwidth + 1), y: k};
            point.place = chromoBins[cov.chromosome].scale(point.x);
            results.push(point);
          });
        });
        console.log(`loaded ${results.length} records for ${chromoData} of ${dataFile}...`);
        if (results.length > 0) {
          let chromosome = dataInput.coverage[0].chromosome;
          results = results.filter(outliers('y'));
          console.log(`Outliers removal left ${results.length} records for ${chromoData} of ${dataFile}...`);
          console.log(`Writing ${results.length} records in todal in ./coverage/${dataFile}/${dataFile}.${chromosome}.csv`);
          let writer = csvWriter()
          writer.pipe(fs.createWriteStream(`./coverage/${dataFile}/${dataFile}.${chromosome}.csv`));
          results.forEach((d,i) => writer.write(d));
          writer.end();
        }
      });
    });
  }
});