const fs = require('fs');
const d3 = require('d3');
const outliers = require('outliers');
const csvWriter = require('csv-write-stream');

fs.readFile('./public/metadata.json', (err, metadataContent) => {
  if (err) {
    console.log(`File not found: ${err}`)
    return;
  } else {
    fs.readdirSync('./coverage/json/')
    .filter((d,i) =>  fs.lstatSync(`./coverage/json/${d}`).isDirectory())
    .map((dataFile) => {
      let records = [];
      fs.readdirSync(`./coverage/json/${dataFile}/`).map((chromoData) => { //if (chromoData !== 'HCC1143_100.1.json') return;
        let contents = fs.readFileSync(`./coverage/json/${dataFile}/${chromoData}`);
        let dataInput = Object.assign({}, JSON.parse(contents));
        let results = [];
        let iid = 0;
        dataInput.coverage.forEach((cov,i) => {
          cov.y.forEach((k,j) => {
            let point = {x: (cov.startPoint + j * cov.binwidth + 1), y: k, chromosome: cov.chromosome};
            results.push(point);
          });
        });
        console.log(`loaded ${results.length} records for ${chromoData} of ${dataFile}...`);
        if (results.length > 0) {
          let chromosome = dataInput.coverage[0].chromosome;
          results = results.filter(outliers('y'));
          console.log(`Outliers removal left ${results.length} records for ${chromoData} of ${dataFile}...`);
          console.log(`Writing ${results.length} records in todal in ./coverage/csv/${dataFile}/${dataFile}.${chromosome}.csv`);
          let writer = csvWriter();
          writer.pipe(fs.createWriteStream(`./coverage/csv/${dataFile}/${dataFile}.${chromosome}.csv`));
          results.forEach((d,i) => writer.write(d));
          writer.end();
        }
      });
    });
  }
});