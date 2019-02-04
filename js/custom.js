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

	function fitElementToParent(el, padding) {
	  var timeout = null;
	  function resize() {
	    if (timeout) clearTimeout(timeout);
	    anime.set(el, {scale: 1});
	    var pad = padding || 0;
	    var parentEl = el.parentNode;
	    var elOffsetWidth = el.offsetWidth - pad;
	    var parentOffsetWidth = parentEl.offsetWidth;
	    var ratio = parentOffsetWidth / elOffsetWidth;
	    timeout = setTimeout(anime.set(el, {scale: ratio}), 10);
	  }
	  resize();
	  window.addEventListener('resize', resize);
	}

// sphere animation
	var sphereAnimation = (function() {

	  var sphereEl = document.querySelector('.sphere-animation');
	  var spherePathEls = sphereEl.querySelectorAll('.sphere path');
	  var pathLength = spherePathEls.length;
	  var hasStarted = false;
	  var aimations = [];
		const flatGreen = 'rgba(190,239,152,1)';
		const neonGreen = 'rgba(87,255,4,1)';
		const neonBlue = 'rgba(52,103,197,1)';
		const neonPink = 'rgba(244,0,235,1)';
		var colors = [flatGreen, neonBlue];

	  fitElementToParent(sphereEl);

	  var breathAnimation = anime({
	    begin: function() {
	      for (var i = 0; i < pathLength; i++) {
	        aimations.push(anime({
	          targets: spherePathEls[i], sphereEl,
          	stroke: {value: colors, duration: 500},
	          translateX: [2, -4],
	          translateY: [2, -4],
	          easing: 'easeOutQuad',
	          autoplay: false
	        }));
	      }
	    },
	    update: function(ins) {
	      aimations.forEach(function(animation, i) {
	        var percent = (1 - Math.sin((i * .35) + (.0022 * ins.currentTime))) / 2;
	        animation.seek(animation.duration * percent);
	      });
	    },
	    duration: Infinity,
	    autoplay: false
	  });

	  var introAnimation = anime.timeline({
	    autoplay: false
	  })
	  .add({
	    targets: spherePathEls,
	    strokeDashoffset: {
	      value: [anime.setDashoffset, 0],
	      duration: 2900,
	      easing: 'easeInOutCirc',
	      delay: anime.stagger(190, {direction: 'reverse'})
	    },
	    duration: 2000,
	    delay: anime.stagger(60, {direction: 'reverse'}),
	    easing: 'linear'
	  }, 0);

	  var shadowAnimation = anime({
	      targets: '#sphereGradient',
	      x1: '25%',
	      x2: '25%',
	      y1: '0%',
	      y2: '75%',
	      duration: 30000,
	      easing: 'easeOutQuint',
	      autoplay: false
	    }, 0);

	  function init() {
	    introAnimation.play();
	    breathAnimation.play();
	    shadowAnimation.play();
	  }

	  init();

	})();



	$('a[href*="#"]')
	  // Remove links that don't actually link to anything
	  .not('[href="#"]')
	  .not('[href="#0"]')
	  .click(function(event) {
	    // On-page links
	    if (
	      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
	      &&
	      location.hostname == this.hostname
	    ) {
	      // Figure out element to scroll to
	      var target = $(this.hash);
	      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
	      // Does a scroll target exist?
	      if (target.length) {
	        // Only prevent default if animation is actually gonna happen
	        event.preventDefault();
	        $('html, body').animate({
	          scrollTop: target.offset().top
	        }, 1000, function() {
	          // Callback after animation
	          // Must change focus!
	          var $target = $(target);
	          $target.focus();
	          if ($target.is(":focus")) { // Checking if the target was focused
	            return false;
	          } else {
	            $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
	            $target.focus(); // Set focus again
	          };
	        });
	      }
	    }
	  });
