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
