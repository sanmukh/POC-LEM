// GLOBALS
var map;
var selectedDate = 16;

function initMap() {
  map = new google.maps.Map(document.getElementById('g-map'), {
    center: {lat: 30.8270403, lng: -97.5413516},
    zoom: 11.1,
    disableDefaultUI: true,
    styles: [{
        featureType: "all",
        elementType: "labels",
        stylers: [
          { visibility: "off" }
        ]
      }]
  });
}


// if      (phase == "1") color = "#FF5A5A";
// else if (phase == "2") color = "#00BBFF";
// else if (phase == "3") color = "#2EFF8C";




$(document).ready(function () {

    // TESTING
    google.maps.event.addListener(map, 'click', function(event) {
        console.log(event.latLng.lat(), event.latLng.lng())
    });

    // LOAD MAP DATA
    startLoading();

    // SETTINGS FORM
    $('[data-toggle="datepicker"]').datepicker({
        autoPick: true,
        date: new Date(2015, 9, 16),
        startDate: new Date(2015, 9, 1),
        endDate: new Date(2015, 9, 31)
        // inline: true,
        // container: "#calendar-container"
    });
    $("#settings-button").click(function () {
        if ($("#info-button").hasClass("bar-selected")) {
            $("#info-button").removeClass("bar-selected");
            $(".dim").hide();
        }

        if ($("#settings-button").hasClass("bar-selected")) {
            $("#settings-button").removeClass("bar-selected");
            $(".settings-box").hide();
        }
        else {
            $("#settings-button").addClass("bar-selected");
            $(".settings-box").show();
        }
    });
    $(".settings-form").submit(function(e){
        e.preventDefault();
        // $(".loading-box").show();
        selectedDate = $('[data-toggle="datepicker"]').datepicker('getDate').getDate();
    });
    $(document).on('input', '#slider', function() {
        $('.hour-bar > p').text($(this).val() + ":00")
    });

    // INFO POPUP
    $("#info-button").click(function () {
        if ($("#settings-button").hasClass("bar-selected")) {
            $("#settings-button").removeClass("bar-selected");
            $(".settings-box").hide();
        }

        if ($("#info-button").hasClass("bar-selected")){
            $("#info-button").removeClass("bar-selected");
            $(".dim").hide();
        }
        else {
            $("#info-button").addClass("bar-selected");
            $(".dim").css('display', 'flex');
        }
    });
    $("#close-info").click(function(e) {
        $(".info-box").hide();
    });

});

function openPopup(html) {
    $(".info-content" ).empty().append(html);
    $(".info-box").show();
}
