$(function() {

  //used for redrawing upon resize
  var throttleTimer;
  var plotContainerId = 'plot-container';
  var dataSelector = 'data-selector';
  var totalWidth = $('#' + plotContainerId).width();
  var totalHeight = $(window).height() - $('#' + plotContainerId).offset().top;
  var currentFile = Misc.getUrlParameter('file');
  var currentLocation = Misc.getUrlParameter('location');

  // used to maintain the main frame container
  var frame = new Frame(plotContainerId, totalWidth, totalHeight);
  // set the default location as parsed from the url
  frame.location = currentLocation;

  // If there are options defined on the HTML already, we should show them as they are (Web version)
  if ($('#' + 'data-selector').find('option').length > 0) {
    // get the list of options
    let options = $('#' + 'data-selector option').map(function() { return $(this).text(); }).get();
    // Act upon selector load
    $('#' + dataSelector).on('loaded.bs.select', event => {
      if (options.indexOf(currentFile) > 0) {
        $('#' + dataSelector).selectpicker('val', currentFile);
      } else {
        $('#' + dataSelector).selectpicker('val', options[0]);
      }
      $('#' + dataSelector).selectpicker('render');
    });

    // Act upon json reload
    $('#' + dataSelector).on('rendered.bs.select', event => {
      frame.loadData($('#' + dataSelector).val());
    });
  } else {
    // Otherwise, we should load them from the server (when running on localhost)
    $('#' + dataSelector).selectpicker('hide');

    d3.json('/datafiles', results => {
      $('#' + dataSelector).html(results.files.map((d,i) => `<option value="${d.file}">${d.name}</option>`).join(''));
      $('#' + dataSelector).selectpicker('refresh');
      $('#' + dataSelector).selectpicker('show');
      if (results.files.filter((d,i) => d.name === currentFile).length > 0) {
        $('#' + dataSelector).selectpicker('val', currentFile);
      }
      $('#' + dataSelector).selectpicker('render');
    });

    // Act upon json reload
    $('#' + dataSelector).on('refreshed.bs.select', event => {
      frame.loadData($('#' + dataSelector).val());
    });
    $('#' + dataSelector).on('changed.bs.select', event => {
      frame.loadData($('#' + dataSelector).val());
    });
  }

  // Act upon window resize
  d3.select(window).on('resize', () => {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(() => {
      totalWidth = $('#' + plotContainerId).width();
      totalHeight = $(window).height() - $('#' + plotContainerId).offset().top;
      frame.updateDimensions(totalWidth, totalHeight);
      frame.render();
    }, 200);
  });

  $('#gene-checkbox').on('click', (event) => {
    $('#walk-checkbox').removeAttr('checked');
    $('#read-checkbox').removeAttr('checked');
    frame.margins.panels.upperGap = $('#gene-checkbox').is(":checked") ? 
      0.6 * frame.height: 
      frame.margins.defaults.upperGapPanel;
    frame.showGenes = $('#gene-checkbox').is(":checked");
    frame.showWalks = $('#walk-checkbox').is(":checked");
    frame.showReads = $('#read-checkbox').is(":checked");
    frame.toggleGenesPanel();
  });

  $('#walk-checkbox').on('click', (event) => {
    $('#gene-checkbox').removeAttr('checked');
    $('#read-checkbox').removeAttr('checked');
    frame.margins.panels.upperGap = $('#walk-checkbox').is(":checked") ? 
      0.8 * frame.height: 
      frame.margins.defaults.upperGapPanel;
    frame.showGenes = $('#gene-checkbox').is(":checked");
    frame.showWalks = $('#walk-checkbox').is(":checked");
    frame.showReads = $('#read-checkbox').is(":checked");
    frame.toggleGenesPanel();
  });

  $('#read-checkbox').on('click', (event) => {
    $('#walk-checkbox').removeAttr('checked');
    $('#gene-checkbox').removeAttr('checked');
    frame.margins.panels.upperGap = $('#read-checkbox').is(":checked") ? 
      0.6 * frame.height: 
      frame.margins.defaults.upperGapPanel;
    frame.showGenes = $('#gene-checkbox').is(":checked");
    frame.showWalks = $('#walk-checkbox').is(":checked");
    frame.showReads = $('#read-checkbox').is(":checked");
    frame.toggleGenesPanel();
  });

  $('#locate-submit').on('click', (event) => {
    frame.runLocate($('#locate-input').val());
  });

  // Start file download.
  document.getElementById("download-button").addEventListener("click", function(){
      // Generate download of file with the elements in the current panels
    let text = document.getElementById("fragmentsDetails").innerHTML;
    let filename = "export.txt";

    download(filename, text);
  }, false);

  // Execute the delete operation
  $('html').keyup((e) => {
    if ((e.keyCode === 46) || (e.keyCode === 8)) {
      frame.runDelete();
    }
  });

  // Remove any other open popovers
  $(document).on('mousemove', (event) => {
    if (!$(event.target).is('.popovered')) {
      frame.clearPopovers();
    }
  });

  $('#fragmentsNote').tooltip({trigger: 'manual'});
  
  $('#fragmentsNote').on('click', (event) => {
    event.preventDefault();
    var textArea = document.createElement("textarea");

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';

    textArea.value = d3.select('#fragmentsNote').text();

    document.body.appendChild(textArea);

    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      $('#fragmentsNote').tooltip('show');
      setTimeout(function() {
        $('#fragmentsNote').tooltip('hide');
      }, 1000);
    } catch (err) {
      console.log('Oops, unable to copy');
    }

    document.body.removeChild(textArea);
  });

  $('#coverage-button').click(() => {
    $('#coverage-modal').modal({
      backdrop: 'static',
      keyboard: false
    });
  }); 

  // We can attach the `fileselect` event to all file inputs on the page
  $(document).on('change', ':file', function() {
    var input = $(this),
    numFiles = input.get(0).files ? input.get(0).files.length : 1,
    label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label, input.get(0).files[0]]);
  });

  // We can watch for our custom `fileselect` event like this
  $(document).ready( function() {
    $(':file').on('fileselect', function(event, numFiles, label, file) {
      $('#coverage-help').html('Loading coverage points ...');
      d3.select('#coverage-submit').attr('data-dismiss', 'modal0').classed('disabled', true);
      var input = $(this).parents('.input-group').find(':text'),
      log = numFiles > 1 ? numFiles + ' files selected' : label;
      if( input.length ) {
        input.val(log);
      } else {
        if( log ) alert(log);
      }
      let t1 = new Date();
      Papa.parse(file, {
        dynamicTyping: true,
        skipEmptyLines: true,
        header: true,
        complete: function(results) {
          console.log("All done!");
          results.data.forEach((d,i) => {
            d.color = frame.chromoBins[d.chromosome].color;
            d.place = frame.chromoBins[d.chromosome].scaleToGenome(d.x);
            frame.coveragePoints.push(d);
          })
          for (let k = 0; k < d3.min([frame.coveragePointsThreshold, results.data.length]); k++) {
            let index = frame.coveragePointsThreshold < results.data.length ? Math.floor(results.data.length * Math.random()) : k;
            let coveragePoint = results.data[index];
            frame.downsampledCoveragePoints.push(coveragePoint);
          }
          // update the fragments
          frame.brushContainer.updateFragments(true);
          // update the reads
          frame.brushContainer.renderReads();

          $('#coverage-help').html(`Successfully loaded ${results.data.length} records in ${(new Date() - t1) / 1000} seconds.`);
          d3.select('#coverage-submit').attr('data-dismiss', 'modal').classed('disabled', false);
        }
      });

    });
  });

  function download(filename, text) {
    let element = document.getElementById("downloadLink");
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';

    element.click();
  };
});

