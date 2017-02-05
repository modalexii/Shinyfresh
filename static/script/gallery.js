var highestIndexValue = null;

$(document).ready( function() {

  // get highest index value for use in infinite slider
  var indexValues = $('.box').map(function(){
    return parseFloat($(this).attr('data-index')) || -Infinity;
  }).toArray();

  highestIndexValue = Math.max.apply(Math, indexValues);
  
  $('.boxInner a').on('click', function(event) {
    // prevent browsing away
    event.preventDefault();
    // make the change
    loadBillboardFromThumb( $(this) );
  });

  $('#billboard_nav_prev').on('click', function() {
    progressBillboard('prev');
  });

  $('#billboard_nav_next').on('click', function() {
    progressBillboard('next');
  });

  // support swipe
  $('#billboard_image').hammer().on('swiperight', function() {
    progressBillboard('prev');
  })

  $('#billboard_image').hammer().on('swipeleft', function() {
    progressBillboard('next');
  })
 
});

function progressBillboard(direction) {

  var currentIndexPosition = $('#billboard_contents').attr('data-index-position');

  if (direction === "prev") {

    if (currentIndexPosition === "1") {
      var newIndexPosition = highestIndexValue;
    } else {
      var newIndexPosition = +currentIndexPosition - 1;
    }

  } else if (direction === "next") {

    var currentIndexPosition = $('#billboard_contents').attr('data-index-position');
    if (currentIndexPosition == highestIndexValue) {
      var newIndexPosition = "1";
    } else {
      var newIndexPosition = +currentIndexPosition + 1;
    }

  }

  loadBillboardFromThumb( 
    $('.box[data-index=' + newIndexPosition + ']').children().children('a')
  );

}

function loadBillboardFromThumb(thumb) {
  // given an object representing the a element of a thumbnail,
  // load that thumbnail in the the billboard

  // make no thumbs appear selected
  $('.boxInner').removeClass('selected')
  
  // scrape properties of clicked thumbnail
  var displayImageSrc = thumb.attr('href');
  var imageRawSrc = thumb.children('.meta.raw').html();
  var title = thumb.children('.meta.title').html();
  var caption = thumb.children('.meta.caption').html();
  var date = thumb.children('.meta.date').html();
  var media = thumb.children('.meta.media').html();
  var newIndexPosition = thumb.parent().parent().attr('data-index');
  // edit properties of billboard
  $('#billboard_image').attr('src', displayImageSrc);
  $('#billboard_title').html(title);
  $('#billboard_caption').html(caption);
  $('#billboard_date').html(date);
  $('#billboard_media').html(media);
  $('#billboard_raw_link').attr('href', imageRawSrc);
  $('#billboard_contents').attr('data-index-position', newIndexPosition)

  // make thumb appear selected
  thumb.parent().addClass('selected');

}