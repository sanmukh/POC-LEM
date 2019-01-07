// ---------------------------------- BUSES -------------------------------

var allBuses = {}
var busMarkers = {}
function startLoading(){
    var userLocFile = 'static/data/buses'
    var MPERDEG = (2 * Math.PI/360) * 637800 * Math.cos(37.822153 * (Math.PI/360));
    var baseLat = 30.121722;
    var baseLng = -97.946269;

    $.get(userLocFile,function(txt){
        allBuses = JSON.parse(txt);
        busNames = Object.keys(allBuses);
        busNames.forEach(function(name) {
            if (name != "") {
                var busData = allBuses[name];
                var mapIcon = new google.maps.Marker({
                     position: {
                         lat: parseFloat(busData.lat),
                         lng: parseFloat(busData.lng)
                     },
                     // map: map,
                     title: "Bus: " + name,
                     icon: {
                        url: 'static/img/line.png',
                        scaledSize : new google.maps.Size(10, 10),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(5, 5)
                    },
                    zIndex: 2
                });
                busMarkers[name] = {
                    icon:mapIcon,
                    show: false,
                    connections: 0
                };
            }
        });
    }).done(function () {
        // saveLines();
        // saveLoads();
        // saveGenerators();
        loadCapacitor();
        loadSubstation();
        loadTransformersAndGenerators(5);
       // loadLoads(20);
        loadLines();
        loadUsers();
        loadPV();
    });
}

// ---------------------------------- LINES -------------------------------
var allLineData = {};
var lineMarkers = [];
function loadLines() {
    var userLocFile = 'static/data/lines';
    $.get(userLocFile, function(txt) {
        allLines = JSON.parse(txt);
        lineNames = Object.keys(allLines);
        lineNames.forEach(function(name) {
            var lineSize = 2;
            var lineData = allLines[name];
            var phases = lineData['phases'];

            // check how many connections
            busMarkers[lineData["bus1"]].connections += 1;
            busMarkers[lineData["bus2"]].connections += 1;
            if (!busMarkers[lineData["bus1"]].save && busMarkers[lineData["bus1"]].connections == 2)
                busMarkers[lineData["bus1"]].icon.setMap(null);
            else
                busMarkers[lineData["bus1"]].icon.setMap(map);

            if (!busMarkers[lineData["bus2"]].save && busMarkers[lineData["bus2"]].connections == 2)
                busMarkers[lineData["bus2"]].icon.setMap(null);
            else
                busMarkers[lineData["bus2"]].icon.setMap(map);

            phases.forEach(function (phase) {
                var color = "#545454"
                if      (phase == "1") color = "#2EFF8C";
                else if (phase == "2") color = "#FF5A5A";
                else if (phase == "3") color = "#00BBFF";
                var mapLine = new google.maps.Polyline({
                    name: name,
                    path: [lineData["start"], lineData["end"]],
                    geodesic: true,
                    strokeColor: color,
                    strokeOpacity: 1.0,
                    strokeWeight: lineSize,
                    map: map,
                    zIndex: (7 - lineSize)
                });
                lineSize += 3;
                lineMarkers.push(mapLine);

                var formatPhases = "";
                for (var j = 0; j < lineData["phases"].length - 1; j++) {
                    formatPhases += lineData["phases"][j] + ", "
                }
                formatPhases += lineData["phases"][j];

                var popup_content =
                    `<div style="popup">
                        <h1 style="margin-top: 5px; margin-bottom:10px;margin-left:5px;">LINE</h1>
                        <hr>
                        <p style="margin-top: 0px; margin-bottom:3px;">Source/Destination Buses: ${lineData["bus1"]} ⇒ ${lineData["bus2"]}</p>
                        <p style="margin-top: 0px; margin-bottom:3px;">Current Phase(s): ${formatPhases}</p>
                        <p style="margin-top: 0px; margin-bottom:3px;">Length: ${lineData["length"]} ${lineData["units"]}</p>
                    </div>`;

                google.maps.event.addListener(mapLine, 'click', () =>openPopup(popup_content) )
            });
            allLineData[name] = lineData;
        });
    });
}



// ---------------------------------- TRANS -------------------------------

var allTransformers = {};
var transMarkers = [];
function loadTransformers(num) {
    var userLocFile = 'static/data/transformers';
    $.get(userLocFile, function(txt) {
        allLines = JSON.parse(txt);
        transNames = Object.keys(allLines);
        var i = 0;
        transNames.forEach(function(name) {
            if (i < num) {
                var transData = allLines[name];
                var busData = allBuses[transData["wdg1"]["bus"]];
                busMarkers[transData["wdg1"]["bus"]].save = true;
                busMarkers[transData["wdg1"]["bus"]].icon.setMap(map);
                var mapTrans = new google.maps.Marker({
                     position: {
                         lat: parseFloat(busData.lat),
                         lng: parseFloat(busData.lng)
                     },
                     map: map,
                     title: "Trans: " + name,
                     icon: {
                        url: 'static/img/pentagon.png',
                        scaledSize : new google.maps.Size(15, 15),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(0, 0)
                    }
                });
                allTransformers[name] = transData;
                transMarkers.push(mapTrans);
            }
            i++;
        });
    });
}



// ---------------------------------- GENS -------------------------------

var allGenerators = {};
var genMarkers = [];

// ---------------------------------- GENS & TRANS -------------------------------

function loadTransformersAndGenerators(num) {
    var userLocFile = 'static/data/transformers';
    $.get(userLocFile, function(txt) {
        allLines = JSON.parse(txt);
        transNames = Object.keys(allLines);
        transNames.forEach(name => allTransformers[name] = allLines[name]);
    }).done(function () {
        var userLocFile = 'static/data/generators';
        $.get(userLocFile, function(txt2) {
            allLines2 = JSON.parse(txt2);
            genNames = Object.keys(allLines2);


            var i = 0;
            genNames.forEach(function(name) {
                if (!(num) || i < num) {

                    var genData = allLines2[name];
                    if (allGenerators[genData["bus"]] == undefined) {
                        allGenerators[genData["bus"]] = allLines2;
                        var transData = allTransformers[genData["bus"]];
                        var busData = allBuses[transData["wdg1"]["bus"]];


                        busMarkers[transData["wdg1"]["bus"]].save = true;
                        busMarkers[transData["wdg1"]["bus"]].icon.setMap(map);

                        var mapTrans = new google.maps.Marker({
                             position: {
                                 lat: parseFloat(busData.lat),
                                 lng: parseFloat(busData.lng)
                             },
                             map: map,
                             title: "Transformer: " + (i + 1),
                             icon: {
                                url: 'static/img/triangle_orange.png',
                                scaledSize : new google.maps.Size(18, 18),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(0, 0)
                            }
                        });

                        var popup_content1 =
                            `<div style="popup">
                                <h1 style="margin-top: 5px; margin-bottom:10px;margin-left:5px;">TRANSFORMER #${(i + 1)}</h1>
                                <hr>
                                <p style="margin-top: 0px; margin-bottom:3px;">Voltage at End Points: ${transData['wdg1']['kv']} kV ⇄ ${transData['wdg2']['kv']} kV</p>
                                <p style="margin-top: 0px; margin-bottom:3px;">Connected to Bus: ${transData['wdg1']['bus']}</p>
                                <p style="margin-top: 0px; margin-bottom:3px;">Current Phase: ${transData['phase']}</p>
                            </div>`;

                        google.maps.event.addListener(mapTrans, 'click', () =>openPopup(popup_content1))

                        transMarkers.push(mapTrans);

                        var mapGen = new google.maps.Marker({
                             position: {
                                 lat: parseFloat(busData.lat),
                                 lng: parseFloat(busData.lng)
                             },
                             map: map,
                             title: "Generator: " + (i + 1),
                             icon: {
                                url: 'static/img/pentagon_blue.png',
                                scaledSize : new google.maps.Size(18, 18),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(18, 18)
                            }
                        });
                        genMarkers.push(mapGen);

                        var formatPhases = "";
                        for (var j = 0; j < genData["phases"].length - 1; j++) {
                            formatPhases += genData["phases"][j] + ", "
                        }
                        formatPhases += genData["phases"][j];

                        var popup_content2 =
                            `<div style="popup">
                                <h1 style="margin-top: 5px; margin-bottom:10px;margin-left:5px;">GENERATOR #${(i + 1)}</h1>
                                <hr>
                                <p style="margin-top: 0px; margin-bottom:3px;">Connected to Bus: ${transData['wdg1']['bus']}</p>
                                <p style="margin-top: 0px; margin-bottom:3px;">Current Phase(s): ${formatPhases}</p>
                            </div>`;

                        google.maps.event.addListener(mapGen, 'click', () =>openPopup(popup_content2))
                    }
                    else {
                        i--;
                    }
                }
                i++;
            });
        });
    });
}

// ---------------------------------- LOADS -------------------------------

var allLoads = {};
var loadMarkers = [];
// ignores repeats, will need to change in the future

function loadLoads(num) {
    var userLocFile = 'static/data/loads';
    $.get(userLocFile, function(txt) {
        allLines = JSON.parse(txt);
        loadNames = Object.keys(allLines);
        var i = 0;
        loadNames.forEach(function(name) {
            if (!(num) || i < num) {
                var loadData = allLines[name];
                var busData = allBuses[name];
                busMarkers[name].save = true;
                busMarkers[name].icon.setMap(map)
                var mapLoad = new google.maps.Marker({
                     position: {
                         lat: parseFloat(busData.lat),
                         lng: parseFloat(busData.lng)
                     },
                     map: map,
                     title: "Load: " + name,
                     icon: {
                        url: 'static/img/circle_red.png',
                        scaledSize : new google.maps.Size(12, 12),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(12, 0),
                    },
                    zIndex: 1
                });

                allLoads[name] = loadData;
                loadMarkers.push(mapLoad);


                var popup_content =
                    `<div style="popup">
                        <h1 style="margin-top: 5px; margin-bottom:10px;margin-left:5px;">LOAD #${i + 1}</h1>
                        <hr>
                        <p style="margin-top: 0px; margin-bottom:3px;">Connected to Bus: ${name}</p>
                        <p style="margin-top: 0px; margin-bottom:3px;">Current Phase: ${loadData['phase']}</p>
                    </div>`;

                google.maps.event.addListener(mapLoad, 'click', () =>openPopup(popup_content))
            }
            i++;
        });
    }).done(function () {
        // saveBuses();
        // console.log("sadf")
    });
}


// ---------------------------------- OTHER -------------------------------
var allCapacitors = {};
var capMarkers = [];
allCapacitors["B4909"] = {
    bus: "B4909",
    kV: 12.47,
    kvar: 900,
    conn: "wye",
    terminal: 1,
    delay: 1,
    type: "volt",
    on: 120.5,
    off: 125,
    PTphase: 2,
    PTratio: 60
}

function loadCapacitor() {
    var cap = allCapacitors["B4909"]
    var busData = allBuses[cap["bus"]];
    var mapCap = new google.maps.Marker({
         position: {
             lat: parseFloat(busData.lat),
             lng: parseFloat(busData.lng)
         },
         map: map,
         title: "Capacitor",
         icon: {
            url: 'static/img/rectangle_orange.png',
            scaledSize : new google.maps.Size(25, 25),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(0, 12.5)
        }
    });

    busMarkers[cap['bus']].save = true;
    busMarkers[cap['bus']].icon.setMap(map);

    var popup_content =
        `<div style="popup">
            <h1 style="margin-top: 5px; margin-bottom:10px;margin-left:5px;">CAPACITOR</h1>
            <hr>
            <p style="margin-top: 0px; margin-bottom:3px;">Max Reactive Power Injection Capacity: ${cap['kV']} kV</p>
            <p style="margin-top: 0px; margin-bottom:3px;">Connected to Bus: ${cap['bus']}</p>
        </div>`;

    google.maps.event.addListener(mapCap, 'click', () =>openPopup(popup_content))
    capMarkers.push(mapCap);
}

var allSubstations = {}
var subMarkers = []
allSubstations["SubXfmr"] = {
    phases: 3,
    windings:2,
    bus: "5964927408",
    conns: ["wye","wye"],
    kvs: [68.8,13.09],
    kvas: [16000,16000],
    numtaps: 16,
    xhl:11.63,
    ppm_antifloat:5,
    wdg1: {
        r:0.596
    },
    wdg2: {
        r:0.596
    }
}

function loadSubstation() {
    var sub = allSubstations["SubXfmr"];
    var busData = allBuses[sub["bus"]];
    var mapSub = new google.maps.Marker({
         position: {
             lat: parseFloat(busData.lat),
             lng: parseFloat(busData.lng)
         },
         map: map,
         title: "Substation",
         icon: {
            url: 'static/img/overlap.png',
            scaledSize : new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 20)
        }
    });

    busMarkers["5964927408"].save = true;
    busMarkers["5964927408"].icon.setMap(map);

    subMarkers.push(mapSub);
}

function loadPV() {
    var userLocFile = 'static/data/pv';

    $.get(userLocFile, function(txt) {
        var pvs = JSON.parse(txt);

        for (var m = 1; m <= 5; m ++) {
            var mapPV = new google.maps.Marker({
                 position: {
                     lat: parseFloat(pvs[m].lat),
                     lng: parseFloat(pvs[m].lng)
                 },
                 map: map,
                 title: "PV " + m,
                 icon: {
                    url: 'static/img/triangle_yellow.png',
                    scaledSize : new google.maps.Size(20, 20),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(10, 10)
                }
            });

            var bus = allBuses[pvs[m]["bus"]]

            var mapLine = new google.maps.Polyline({
                path: [{
                    lat: parseFloat(pvs[m].lat),
                    lng: parseFloat(pvs[m].lng)
                }, {
                    lat: bus.lat,
                    lng: bus.lng
                }],
                geodesic: true,
                strokeColor: "#545454",
                strokeOpacity: .5,
                strokeWeight: 2,
                map: map
            });
			
			(function () {
				var userIDs = [21, 26, 30, 33, 36]
                var userID = userIDs[m];
                var popup_content =
                    `<div style="popup">
                        <h1 style="margin-top: 5px; margin-bottom:10px;margin-left:5px;">USER #${m}</h1>
                        <hr>
                        <p style="margin-top: 0px; margin-bottom:3px;">Transformer: #${pvs[m]["transformer"]}</p>
                        <p style="margin-top: 0px; margin-bottom:3px;">Bus: ${pvs[m]["bus"]}</p>
                        <div class="graph-button-box">
                            <div id="solar">SOLAR</div>
                        </div>
                        <div class="chart" id="chart-solar"></div>
                    </div>`
                google.maps.event.addListener(mapPV, 'click', (e) => {
                    openPopup(popup_content);
                    userPopUp(userID);
                    $(".graph-button-box > div").click((e) => clickGraphBox(e));
                });
            })();
        }
    });
}


function loadUsers() {
    var userLocFile = 'static/data/localUsers';
    $.get(userLocFile, function(txt) {
        var localUsers = JSON.parse(txt);
        for (var m = 1; m <= 15; m++) {
			
			if ( m%3 == 2) {
				var mapUser = new google.maps.Marker({
                 position: {
                     lat: parseFloat(localUsers[m].lat),
                     lng: parseFloat(localUsers[m].lng)
                 },
                 map: map,
                 title: "User " + m,
                 icon: {
                    url: 'static/img/circle_red.png',
						scaledSize : new google.maps.Size(12, 12),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(12, 0),
                }
            });
			
			
            var bus = allBuses[localUsers[m]["bus"]]


            var mapLine = new google.maps.Polyline({
                path: [{
                    lat: parseFloat(localUsers[m].lat),
                    lng: parseFloat(localUsers[m].lng)
                }, {
                    lat: bus.lat,
                    lng: bus.lng
                }],
                geodesic: true,
                strokeColor: "#545454",
                strokeOpacity: .5,
                strokeWeight: 2,
                map: map
            });

            (function () {
                var userID = localUsers[m].userID;
                var popup_content =
                    `<div style="popup">
                        <h1 style="margin-top: 5px; margin-bottom:10px;margin-left:5px;">USER #${m}</h1>
                        <hr>
                        <p style="margin-top: 0px; margin-bottom:3px;">Transformer: #${localUsers[m]["transformer"]}</p>
                        <p style="margin-top: 0px; margin-bottom:3px;">Bus: ${localUsers[m]["bus"]}</p>
                        <div class="graph-button-box">
                            <div id="load" class="graph-selected-box">LOAD</div>
                        </div>
                        <div class="chart graph-selected-graph" id="chart-load"></div>
                    </div>`
                google.maps.event.addListener(mapUser, 'click', (e) => {
                    openPopup(popup_content);
                    userPopUp(userID);
                    $(".graph-button-box > div").click((e) => clickGraphBox(e));
                });
            })();
				
			} else{
			
            var mapUser = new google.maps.Marker({
                 position: {
                     lat: parseFloat(localUsers[m].lat),
                     lng: parseFloat(localUsers[m].lng)
                 },
                 map: map,
                 title: "User " + m,
                 icon: {
                    url: 'static/img/home.png',
                    scaledSize : new google.maps.Size(20, 20),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(10, 10)
                }
            });

            var bus = allBuses[localUsers[m]["bus"]]


            var mapLine = new google.maps.Polyline({
                path: [{
                    lat: parseFloat(localUsers[m].lat),
                    lng: parseFloat(localUsers[m].lng)
                }, {
                    lat: bus.lat,
                    lng: bus.lng
                }],
                geodesic: true,
                strokeColor: "#545454",
                strokeOpacity: .5,
                strokeWeight: 2,
                map: map
            });

            (function () {
                var userID = localUsers[m].userID;
                var popup_content =
                    `<div style="popup">
                        <h1 style="margin-top: 5px; margin-bottom:10px;margin-left:5px;">USER #${m}</h1>
                        <hr>
                        <p style="margin-top: 0px; margin-bottom:3px;">Transformer: #${localUsers[m]["transformer"]}</p>
                        <p style="margin-top: 0px; margin-bottom:3px;">Bus: ${localUsers[m]["bus"]}</p>
                        <div class="graph-button-box">
                            <div id="load" class="graph-selected-box">LOAD</div>
                            <div id="solar">SOLAR</div>
                            <div id="AMI">AMI</div>
                        </div>
                        <div class="chart graph-selected-graph" id="chart-load"></div>
                        <div class="chart" id="chart-solar"></div>
                        <div class="chart" id="chart-AMI"></div>
                    </div>`
                google.maps.event.addListener(mapUser, 'click', (e) => {
                    openPopup(popup_content);
                    userPopUp(userID);
                    $(".graph-button-box > div").click((e) => clickGraphBox(e));
                });
            })();
			
			}
		}
    });
}


function userPopUp(userNum) {
    var layout = {
        xaxis: {
            range: [`2015-10-${selectedDate} 00:00:00`, `2015-10-${selectedDate + 1} 00:00:00`],
            type: 'date',
            titlefont: {
                family: 'proxima-nova, sans-serif',
                color: '#545454'
            }
        },
        yaxis: {
            titlefont: {
                family: 'proxima-nova, sans-serif',
                color: '#545454'
            }
        },
        showlegend: false,
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 50,
            pad: 5
        }
    };

    Plotly.d3.csv(`static/data/users/${userNum}/load.csv`, function(err1, rows1) {
        Plotly.d3.csv(`static/data/users/${userNum}/GT_load.csv`, function(err2, rows2) {
       /*     var data = [{
                type: "scatter",
                mode: "lines",
                name: "Load",
                x: unpack(rows1, 'local_15min'),
                y: unpack(rows1, 'grid'),
                line: {color: '#FF5A5A'}
            }, {
                type: "scatter",
                mode: "lines",
                name: "GT Load",
                x: unpack(rows2, 'local_15min'),
                y: unpack(rows2, 'grid'),
                line: {color: '#00BBFF'}
            }];*/
			var data = [{
                type: "scatter",
                mode: "lines",
                name: "Load",
                x: unpack(rows1, 'local_15min'),
                y: unpack(rows1, 'grid'),
                line: {color: '#FF5A5A'}
            }];
            Plotly.newPlot('chart-load', data, layout, {displayModeBar: false});
        });
    });

    Plotly.d3.csv(`static/data/users/${userNum}/solar.csv`, function(err1, rows1) {
        Plotly.d3.csv(`static/data/users/${userNum}/solar.csv`, function(err2, rows2) {

       /*     var data = [{
                type: "scatter",
                mode: "lines",
                x: unpack(rows1, 'local_15min'),
                y: unpack(rows1, 'grid'),
                line: {color: '#FF5A5A'}
            }, {
                type: "scatter",
                mode: "lines",
                x: unpack(rows2, 'local_15min'),
                y: unpack(rows2, 'grid'),
                line: {color: '#00BBFF'}
            }]; */
			yrows = unpack(rows1, 'grid');
			var yrown = [];
			for (var i = 0; i < yrows.length; i++) {
				yrown.push(- yrows[i]);
			}
			 var data = [{
                type: "scatter",
                mode: "lines",
                x: unpack(rows1, 'local_15min'),
                y: yrown,
                line: {color: '#FF5A5A'}
            }]; 

            Plotly.newPlot('chart-solar', data, layout, {displayModeBar: false});
        });
    });

    Plotly.d3.csv(`static/data/users/${userNum}/AMI_i.csv`, function(err, rows) {

        var data = [{
            type: "scatter",
            mode: "lines",
            x: unpack(rows, 'local_15min'),
            y: unpack(rows, 'grid'),
            line: {color: '#FF5A5A'}
        }];

        Plotly.newPlot('chart-AMI', data, layout, {displayModeBar: false});
    });
}

function unpack(rows, key) {
    return rows.map(function(row) { return row[key]; });
}


function clickGraphBox(e) {
    $(".graph-selected-box").removeClass("graph-selected-box");
    $(".graph-selected-graph").removeClass("graph-selected-graph");
    $("#" + e.target.id).addClass("graph-selected-box");
    $("#chart-" + e.target.id).addClass("graph-selected-graph");
}
