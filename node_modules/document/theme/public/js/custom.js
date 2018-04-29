$(function() {
	$('.J_nav').click(function(e) {
        var element = $(this);
        if ( !element.hasClass('J_has-content') ) {
            e.preventDefault();
            element.parent().siblings().find('ul').slideUp();
            element.next().slideToggle();
        }		
	});

	// Bootstrap Table Class
	$('table').addClass('table');

	// Responsive menu spinner
	$('#menu-spinner-button').click(function() {
		$('#sub-nav-collapse').slideToggle();
	});

	// Catch browser resize
	$(window).resize(function() {
		// Remove transition inline style on large screens
		if ($(window).width() >= 768)
			$('#sub-nav-collapse').removeAttr('style');
	});
});