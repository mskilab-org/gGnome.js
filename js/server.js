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
  res.writeHead(200, {'Content-Type': 'text/csv'});
  res.write('datafile\r\n');
  res.write(`${files.join('\r\n')}`);
  res.end();
});

app.listen(8080, () => console.log('App listening on port 8080!'))