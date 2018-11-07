const http = require('http');
const url = require('url');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.static('./'))
app.use(cors())

app.get('/datafiles', (req, res) => {
  let files = fs.readdirSync('./json/');
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(`{"files": [${files.map((d,i) => `{"file": "${d}", "name": "${d}"}`).join(',')}]}`);
  res.end();
});

app.listen(8080, () => console.log('App listening on port 8080!'))