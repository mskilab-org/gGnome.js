$(function() {

  //used for redrawing upon resize
  var throttleTimer;
  var plotContainerId = 'plot-container';
  var dataSelector = 'data-selector';
  var totalWidth = $('#' + plotContainerId).width();
  var totalHeight = $(window).height() - $('#' + plotContainerId).offset().top;
  
  // used to maintain the main frame container
  var frame = new Frame(plotContainerId, totalWidth, totalHeight);

  // Act upon json reload
  $('#' + dataSelector).on('rendered.bs.select', event => {
    d3.json($('#' + dataSelector).val(), dataInput => {
      frame.dataInput = dataInput;
      frame.render();
    });
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


});

