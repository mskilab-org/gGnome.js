const fs = require('fs');
let MongoClient = require('mongodb').MongoClient;
let url = 'mongodb://localhost:27017/gGnome';

MongoClient.connect(url, { useNewUrlParser: true }, (err0, db) => {
  if (err0) throw err0;
  var dbo = db.db('gGnome');
  dbo.createCollection('coverages', (err1, res) => {
    if (err1) throw err1;
    console.log("Collection coverages created!");
    dbo.collection('coverages').deleteMany({}, (err2, obj) => {
      if (err2) throw err2;
      console.log(obj.result.n + " document(s) deleted");
      
      fs.readdirSync('./coverage/')
        .filter((d,i) =>  fs.lstatSync(`./coverage/${d}`).isDirectory())
        .map((dataFile) => {
          fs.readdirSync(`./coverage/${dataFile}/`).map((chromoData) => {
            fs.readFile(`./coverage/${dataFile}/${chromoData}`, (err3, chromodataContent) => {
              if (err3) {
                console.log(`File not found: ${err3}`)
                return;
              } else {
                let dataInput = Object.assign({}, JSON.parse(chromodataContent));
                let results = [];
                console.log(dataFile, chromoData, dataInput.coverage.length)
                dataInput.coverage.forEach((cov,i) => {
                  cov.y.forEach((k,j) => {
                    let point = {iid: cov.iid, dataFile: dataFile, title: cov.title, chromosome: cov.chromosome, x: (cov.startPoint + j * cov.binwidth), y: k};
                    results.push(point);
                  });
                });
                console.log(results.length);
                if (results.length > 0) {
                  MongoClient.connect(url, { useNewUrlParser: true }, (err4, dbt) => {
                    if (err4) throw err4;
                    var dbot = dbt.db('gGnome');
                    dbot.collection('coverages').insertMany(results, (err5, obj) => {
                      if (err5) throw err5;
                      console.log(obj.result.n + " document(s) inserted");
                      dbt.close();
                    });
                  });
                }
                //console.log(chromoData, dataInput.coverage.length, result.length);
              }
            });
          });
      });
      
      db.close();
    });
  });
});