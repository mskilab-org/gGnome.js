const http = require('http');
const url = require('url');
const fs = require('fs');
const d3 = require('d3');
const express = require('express')
const cors = require('cors')
const app = express()

app.use(express.static('./'))
app.use(cors())

app.get('/datafiles', (req, res) => {
  let files = fs.readdirSync('./json/');
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(`{"files": [${files.map((d, i) => `{"file": "./json/${d}", "name": "${d}"}`).join(',')}]}`);
  res.end();
});

app.get('/intervals', (req, res) => {
  fs.readFile('metadata.json', (err1, data1) => {
    fs.readFile('data.json', (err2, data2) => {
      if (err1 || err2) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        return res.end("404 Not Found");
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      let genomeLength = JSON.parse(data1).metadata.reduce((acc, elem) => (acc + elem.endPoint - elem.startPoint + 1), 0);
      let boundary = 0
      let chromoBins = JSON.parse(data1).metadata.reduce((hash, chromoObject) => {
        let chromo = {
          chromosome: chromoObject.chromosome,
          startPoint: chromoObject.startPoint,
          endPoint: chromoObject.endPoint,
          length: (chromoObject.endPoint - chromoObject.startPoint + 1),
          color: chromoObject.color
        };
        chromo.scaleToGenome = d3.scaleLinear().domain([0, chromo.endPoint]).range([boundary, boundary + chromo.length - 1]);
        hash[chromoObject.chromosome] = chromo; 
        boundary += chromo.length;
        return hash; 
      }, {});
      let interval = null, gene = null, connection = null;
      let intervalBins = {};
      let intervals = JSON.parse(data2).intervals.map((d, i) => {
        let interval = {
          iid: d.iid,
          chromosome: d.chromosome,
          startPoint: d.startPoint,
          endPoint: d.endPoint,
          intervalLength: (d.endPoint - d.startPoint),
          y: d.y,
          title: d.title,
          type: d.type,
          strand: d.strand
        };
        interval.startPlace = Math.floor(chromoBins[interval.chromosome].scaleToGenome(interval.startPoint));
        interval.endPlace = Math.floor(chromoBins[interval.chromosome].scaleToGenome(interval.endPoint));
        interval.color = chromoBins[interval.chromosome].color;
        return interval;
      });
      let q = url.parse(req.url, true);
      let qdata = q.query;
      if (Object.hasOwnProperty.call(qdata, 'startPlace') && Object.hasOwnProperty.call(qdata, 'endPlace')
          && qdata.startPlace !== '' && qdata.endPlace !== '' ) {
        let domain = [qdata.startPlace, qdata.endPlace];
        intervals = intervals
          .filter((e, j) => 
            ((e.startPlace <= domain[1]) && (e.startPlace >= domain[0])) || 
            ((e.endPlace <= domain[1]) && (e.endPlace >= domain[0])) || 
            (((domain[1] <= e.endPlace) && (domain[1] >= e.startPlace)) || 
            ((domain[0] <= e.endPlace) && (domain[0] >= e.startPlace))))
      }
      res.write(JSON.stringify(intervals));
      res.end();
    });
  });
});

app.listen(8080, () => console.log('App listening on port 8080!'))