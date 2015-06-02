	/*============================================
	Navigation Functions
	==============================================*/

	// Switch logo orange logo on scroll

	var blacklogo = './assets/logoblack.png'
	var orangelogo = './assets/logo2.png'

	$(window).scroll(function(){
		if ($(window).scrollTop()===0){
			$('.logoimg').attr('src', blacklogo);
		}
		else{
			$('.logoimg').attr('src', orangelogo);
		}
	});	

	// Switch to orange logo on nav click for mobile
	$('.navbar-toggle').click(function(){
		$('#main-nav').css('background', 'rgba(0,0,0,.8)');
		$('.logoimg').attr('src', orangelogo);
	});	

// Slide-in Contact Box 

	$(function() {
		$(window).scroll(function(){
			var distanceTop = $('#last').offset().top - $(window).height();

			if  ($(window).scrollTop() > distanceTop)
				$('#slidebox').animate({'bottom':'81px'},600);
			else
				$('#slidebox').stop(true).animate({'bottom':'-400px'},100);
		});

		$('#slidebox .close').bind('click',function(){
			$(this).parent().remove();
		});
	});
