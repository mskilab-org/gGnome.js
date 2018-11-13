// Running the loading of the genes

// Setup an event listener that will handle messages sent to the worker.
self.addEventListener('message', (e) => {
  importScripts( "/js/external/d3.min.js");
  console.log('before call', new Date());
  
  d3.csv(`/coverage/out1.csv`, (error, results) => {
    if (error) return;
    console.log('coveraging points succesfully loaded!', results.length);

    console.log('after allocation', new Date())
    // Send the message back.

    let str = JSON.stringify(results);
    var array = new Uint8Array(str.length);
    for(var i = 0; i < str.length; i++) {
      array[i] = str.charCodeAt(i);
    }
    var data = array;
    self.postMessage(data, [data.buffer]);
  });


}, false);