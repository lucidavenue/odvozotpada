function isScrolledIntoView(o){var i=$(window).scrollTop(),n=i+$(window).height(),l=$(o).offset().top;return l+$(o).height()/2<=n&&i<=l}$(function(){$(document).scroll(function(){var o=$(".navbar-fixed-top");o.toggleClass("scrolling",$(this).scrollTop()>o.height()/2)})}),$(window).scroll(function(){$(".fade-in").each(function(){!0===isScrolledIntoView(this)&&$(this).addClass("visible")})}),$(".page-image").paroller(),$(".navbar-toggler").click(function(){$(".navbar-fixed-top").toggleClass("navbar-open")});