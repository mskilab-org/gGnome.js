$(function() {

  //used for redrawing upon resize
  var throttleTimer;
  var plotContainerId = 'plot-container';
  var dataSelector = 'data-selector';
  var tagsSelector = 'tags-selector';
  var counterLabel = 'counter-label';
  var annotationsSelector = 'annotations-selector';
  var totalWidth = $('#' + plotContainerId).width();
  var totalHeight = $(window).height() - $('#' + plotContainerId).offset().top;
  var currentLocation = Misc.getUrlParameter('location');
  var currentView = Misc.getUrlParameter('view');

  if (['genes', 'coverage'].includes(currentView)) {
    d3.select('#shadow').classed('hidden', false);
  }
  // used to maintain the main frame container
  var frame = new Frame(plotContainerId, totalWidth, totalHeight);
  // set the default location as parsed from the url
  frame.location = currentLocation;
  frame.selectedViews = currentView.split(',');

  d3.csv('datafiles.csv', (error, results) => {
    if (error) {
      d3.csv('datafiles', (res) => {
        d3.select('#tags-selector').classed('hidden', true);
        populateComboBox(res);
      });
    } else {
      d3.select('#tags-selector').classed('hidden', false);
      populateComboBox(results);
      populateTags(results);
    }
  });

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

  $('#locate-submit').on('click', (event) => {
    frame.runLocate($('#locate-input').val());
  });

  $('.ui.checkbox').checkbox({
    'onChange': function() {
      var $input = $(this);
      var checked = $input.is(':checked');
      frame.views[$input.attr('name')] = checked;
      frame.toggleGenesPanel();
    }
  });
  
  // Start file download.
  document.getElementById("download-button").addEventListener("click", function(){
    // Download the current file
    let filename = frame.dataFile;
    Misc.download(filename);
  }, false);

  // Execute the delete operation
  $('html').keyup((e) => {
    if (((e.keyCode === 46) || (e.keyCode === 8)) && (frame.brushContainer.visibleFragments.length > 1)) {
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

  $('#validate-button').click(() => {
    window.location.href = "validator.html";
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

  function populateComboBox(results) {
    $(`#${dataSelector}`)
      .dropdown({ // first set the configuration
        clearable: false,
        compact: true,
        fullTextSearch: true,
        on: 'hover',
        fullTextSearch: true,
        action: 'activate',
        onChange: (value, text, $selectedItem) => {
          if (value) {
            frame.loadData(value);
          }
        }
      })
     .dropdown('setup menu', { values: results.map((d,i) => {return {name: d.datafile, value: d.datafile}}) }) //set the values
     .dropdown('set exactly', Misc.getUrlParameter('file') || results[0].datafile); // set the selected
  }

  function populateTags(results) {
    let splittedTags = results.map((d,i) => d.description.split(';').map((e,j) => e.trim()).filter(Boolean)).flat();
    let tags = [ ...new Set(splittedTags)].sort();
    let tagsCounter = new Map([...new Set(splittedTags)].map(x => [x, splittedTags.filter(y => y === x).length]));
    tags = tags.sort((a, b) => d3.descending(tagsCounter.get(a), tagsCounter.get(b)) || d3.ascending(a.toLowerCase(),b.toLowerCase()));
    $(`.${counterLabel}`).html(`Browse ${results.length} of ${results.length} ${Misc.pluralize('sample', results.length)}:`);

    $(`#${tagsSelector}`)
      .dropdown({
        clearable: true,
        placeholder: 'Browse categories',
        on: 'hover',
        fullTextSearch: true,
        action: 'activate',
        values: tags.map((d,i) => {return {name: `<span class="description">${tagsCounter.get(d)} ${Misc.pluralize('sample',tagsCounter.get(d))}</span><span class="text">${d}</span>`, value: d, text: d}}),
        onChange: (value, text, $selectedItem) => {
          if (!value) return; // don't go further if nothing is typed in
          let filtered = [...results];
          if (value) {
            filtered = results.filter((d,i) => value.split(',').map((v) => d.description.includes(v)).flat().reduce((a,b) => a && b, true));
          }
          let values = filtered.map((d,i) => {return {name: d.datafile, value: d.datafile}});
          let filteredSplittedTags = filtered.map((d,i) => d.description.split(';').map((e,j) => e.trim()).filter(Boolean)).flat();
          let filteredTags = [ ...new Set(filteredSplittedTags)].sort();
          let filteredTagsCounter = new Map([...new Set(filteredSplittedTags)].map(x => [x, filteredSplittedTags.filter(y => y === x).length]));

          $(`.${counterLabel}`).html(`Browse <b>${filtered.length}</b> of <b>${results.length}</b> ${Misc.pluralize('sample', results.length)}:`);

          let filteredTagValues = filteredTags
            .map((d,i) => {return {value: d, text: d, name: `<span class="description">${filteredTagsCounter.get(d)} ${Misc.pluralize('sample',filteredTagsCounter.get(d))}</span><span class="text">${d}</span>`, count: filteredTagsCounter.get(d)}})
            .sort((a,b) => d3.descending(a.count, b.count) || d3.ascending(a.value.toLowerCase(),b.value.toLowerCase()));

        d3.selectAll(`#${tagsSelector} .item`)
          .datum((d,i,nodes) => nodes[i].getAttribute("data-text"))
          .sort((a,b) => d3.descending(filteredTagsCounter.get(a), filteredTagsCounter.get(b)))
          .classed('hidden', (d,i) => !filteredTags.includes(d))
          .classed('disabled', (d,i) => !filteredTags.includes(d))
          .attr('data-text', (d) => d)
          .attr('data-value', (d) => d)
          .attr('data-count', (d) => filteredTagsCounter.get(d) || 0)
          .each(function(d,i) {
             d3.select(this).select('span.text').text(d);
             d3.select(this).select('span.description').text(`${filteredTagsCounter.get(d)} ${Misc.pluralize('sample',filteredTagsCounter.get(d))}`)
         });
         d3.selectAll(`#${tagsSelector} .item`)
           .datum((d,i,nodes) => +nodes[i].getAttribute("data-count"))
           .sort((a,b) => d3.descending(a,b));

          $(`#${dataSelector}`).dropdown('clear');
          $(`#${dataSelector}`).dropdown('setup menu', {values: values});
          if (values.length > 0) {
            $(`#${dataSelector}`).dropdown('set exactly', values[0].value);
          }
        }
    });
  }
});

