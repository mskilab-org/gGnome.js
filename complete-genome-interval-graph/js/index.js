$(function() {
  var frame = new Frame();
  frame.log();

  // Act upon json reload
  $('.selectpicker').on('rendered.bs.select', function (e) {
    //console.log($(this).val())
    d3.json($(this).val(), function(data) {
      frame.dataInput = data;
      frame.render();
    });
  });

  var throttleTimer; //used for redrawing upon resize
  // Act upon window resize
  function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {

    }, 200);
  }
});

