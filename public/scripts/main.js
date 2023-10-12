$(document).ready(function () {
  const swiperContainer = $(".swiper-container");
  const swipeLeftButton = $("#swipe-left");
  const swipeRightButton = $("#swipe-right");

  swipeLeftButton.on("click", function () {
    showNextUser();
  });

  swipeRightButton.on("click", function () {
    swipeRight();
  });

  function showNextUser() {
    const currentSlide = swiperContainer.find(".swiper-slide:visible");
    const nextSlide = currentSlide.next(".swiper-slide");

    if (nextSlide.length) {
      currentSlide.hide();
      nextSlide.show();
    }else {
      // Hide the buttons when no more users are available
      swipeLeftButton.hide();
      swipeRightButton.hide();
    }
  }

  function swipeRight() {
    const currentSlide = swiperContainer.find(".swiper-slide:visible");
    // Get the swiper-id from the hidden input field
    const swiperId = $("#swiper-id").val(); 
    const swipedId = currentSlide.data("user-id");

    // Post the swiper_id and swiped_id to the server
    $.post("/swipe", { swiper_Id: swiperId, swiped_Id: swipedId }, function () {
      
      showNextUser();
    });
  }
});



 