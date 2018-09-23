$(function() {

  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
    $('#validateBtn').on('click', (event) => {
      event.preventDefault();
      $('#detail').html('');
      validateInputFile();
    });

    function validateInputFile() {
      var fileName = $("#fileupload").val();
      var file_extension = fileName.split('.').pop();
      if (file_extension === 'json') {
        var input = document.getElementById('fileupload');
        var files = input.files; // FileList object
        // use the 1st file from the list
        f = files[0];
        var reader = new FileReader();
        reader.onprogress = ((theFile) => {
          return (e) => {
            var percentLoaded = Math.round((e.loaded / e.total) * 100);
          };
        })(f);
        // Closure to capture the file information.
        reader.onload = ((theFile) => {
          return (e) => {
            try {
              let json = JSON.parse(e.target.result);
              //console.log(e.target.result);
              if (validateIntervals(json)) {
                alerting(`The interval sections is properly validated!`, 'success');
              }
              if (validateConnections(json)) {
                alerting(`The connections sections is properly validated!`, 'success');
              }
              if ((json.walks) && (validateWalks(json))) {
                alerting(`The walks sections is properly defined!`, 'success');
              }
             } catch(e) {
                alerting(`The JSON parsing failed with error: ${e}`, 'danger')
             }
          };
        })(f);
        // Read in the image file as a data URL.
        reader.readAsText(f);
      } else {
        alerting('The file has an invalid type; only .json files are supported.', 'danger')
      }
    }

    function validateIntervals(json) {
      let valid = true;
      if (Array.isArray(json.intervals)) {
        if (json.intervals.length > 1) {
          alerting(`JSON file contains <strong>${json.intervals.length}</strong> intervals`, 'info');
          let interval, ids = [];
          json.intervals.forEach((d,i) => {
            ids.push(d.iid);
            interval = new Interval(d);
            if (!interval.valid()) {
              interval.errors.forEach((e, j) => {
                alerting(`Interval entry <strong>${i + 1}</strong> with iid ${d.iid} failed with error: ${e}`, 'danger');
                valid = false;
              });
            }
          });
          if (ids.length > Misc.unique(ids).length) {
            alerting(`The intervals Array contains duplicate iid values!`, 'danger');
            valid = false;
          }
        } else {
          alerting(`JSON file contains <strong>no intervals</strong>`, 'warning');
        }
      } else {
        if (json.intervals === undefined) {
          alerting('The intervals Array object is missing!', 'danger');
          valid = false;
        }
        if (!Array.isArray(json.intervals)) {
          alerting('The intervals object is not an Array!', 'danger');
          valid = false;
        }
      }
      return valid;
    }

    function validateConnections(json) {
      let valid = true;
      if (Array.isArray(json.connections)) {
        if (json.connections.length > 1) {
          alerting(`JSON file contains <strong>${json.connections.length}</strong> connections`, 'info');
          let iids = json.intervals.map((d,i) => d.iid);
          let connection, intervalIds = [], cids = [];
          json.connections.forEach((d,i) => {
            connection = new Connection(d);
            cids.push(d.cid);
            if (connection.source !== null) { 
              intervalIds.push(connection.source.intervalId);
            }
            if (connection.sink !== null) {
              intervalIds.push(connection.sink.intervalId);
            }
            if (!connection.valid()) {
              connection.errors.forEach((e, j) => {
                alerting(`Connection entry <strong>${i + 1}</strong> with cid ${d.cid} failed with error: ${e}`, 'danger');
                valid = false;
              });
            }
          });
          if (cids.length > Misc.unique(cids).length) {
            alerting(`The connections Array contains duplicate cid values!`, 'danger');
            valid = false;
          }
          Misc.unique(intervalIds).forEach((iid, j) => {
            if (!iids.includes(iid)) {
              alerting(`The source or sink with absolute value ${iid} does not correspond to an existing interval!`, 'danger');
              valid = false;
            }
          });
        } else {
          alerting(`JSON file contains <strong>no connections</strong>`, 'warning');
        }
      } else {
        if (json.connection === undefined) {
          alerting('The connections Array object is missing!', 'danger');
          valid = false;
        }
        if (!Array.isArray(json.connections)) {
          alerting('The connections object is not an Array!', 'danger');
          valid = false;
        }
      }
      return valid;
    }

    function validateWalks(json) {
      let valid = true;
      if (json.walks !== undefined) {
        if (Array.isArray(json.walks)) {
          if (json.walks.length > 1) {
            alerting(`JSON file contains <strong>${json.walks.length}</strong> walks`, 'info');
            let walk, ids = [];
            json.walks.forEach((d,i) => {
              ids.push(d.pid);
              walk = new Walk(d);
              if (!walk.valid()) {
                walk.errors.forEach((e, j) => {
                  alerting(`Walk entry <strong>${i + 1}</strong> with pid ${d.pid} failed with error: ${e}`, 'danger');
                  valid = false;
                });
              }
            });
            if (ids.length > Misc.unique(ids).length) {
              alerting(`The walks Array contains duplicate pid values!`, 'danger');
              valid = false;
            }
          } else {
            alerting(`JSON file contains <strong>no walks</strong>`, 'warning');
          }
        } else {
          alerting('The walks object is not an Array!', 'danger');
          valid = false;
        }
      }
      return valid;
    }

    function alerting(text, type) {
      return $('#detail').append(`<div class="alert alert-${type}" role="alert">${text}</div>`);
    }

  } else {
    alert('The File APIs are not fully supported in this browser.');
  }

});

