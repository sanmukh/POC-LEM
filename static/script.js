var map;
var markers = [];
var userData = {};

function initMap() {
  map = new google.maps.Map(document.getElementById('g-map'), {
    center: {lat: 30.257805, lng: -97.746608},
    zoom: 11,
    disableDefaultUI: true
  });
}


// # Bottom Left: 30.121722, -97.946269
// # Bottom Right: 30.121722, -97.595235
// # Top Right: 30.515484, -97.595235
// # Top Left: 30.515484, -97.946269

// num cannot be bigger than 100
function generateUsers(num) {
    var users = {};
    var userLocFile = 'static/data/houseCoordinates'

    $.get(userLocFile,function(txt){
            console.log('here')
            var lines = txt.responseText.split("\n");
            for (var i = 0; i < num; i++) {
                console.log('here1')
                var [lat, lng] = lines[i].split[" "].map(x => double(x));
                users[i] = new google.maps.Marker({
                     position: {
                         lat: lat,
                         lng: lng
                     },
                     map: map,
                     title: "User " + i,
                     icon: {
                        url: 'static/img/home.png',
                        scaledSize : new google.maps.Size(25, 25),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(12.5, 12.5)
                    }
                });
                markers.push(users[i]);
            }
        });

    return users;
}

$(document).ready(function () {
    generateUsers(20);
    $('[data-toggle="datepicker"]').datepicker({
        autoPick: true,
        // date: new Date(2015, 10, 1),
        startDate: new Date(2015, 10, 1),
        endDate: new Date(2015, 10, 31)
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

    $(document).on('input', '#slider', function() {
        $('.hour-bar > p').text($(this).val() + ":00")
    });

    $(".settings-form").submit(function(e){
        e.preventDefault();
        $(".loading-box").show();
        $.ajax({
            type: "GET",
            url: "/run",
            contentType: 'application/json;charset=UTF-8',
            dataType: "json",
            // data: JSON.stringify({})
        }).done(function(data) {
            console.log(JSON.stringify(data));
            userData = data;

            // Object.keys(userData).forEach(function(num) {
            //     $(".loading-box").hide();
            //     console.log('USER', num, ':', userData[num]);
            // });
        });
    });
});
