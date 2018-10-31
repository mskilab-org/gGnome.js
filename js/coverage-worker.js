// Running the loading of the genes


// Setup an event listener that will handle messages sent to the worker.
self.addEventListener('message', (e) => {
  /* Bring in D3.js*/
  importScripts( "/js/external/d3.min.js");
  importScripts( "/js/base.js");
  importScripts( "/js/coverage-point.js");

  d3.json(`/coverage/${e.data.dataFile}`, (error, results) => {
    if (error) return;
    console.log('coverage points succesfully loaded!', results.length);
    e.data.dataInput.coveragePoints = results.map((d,i) => {
      return new CoveragePoint(d.iid, d.chromosome, d.place, d.x, d.y, d.color);
    });
    // Send the message back.
    self.postMessage(e.data);
  });
}, false);