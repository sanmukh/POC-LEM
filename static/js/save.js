// BUS

var allBuses = {}
var busMarkers = []
function saveBuses() {
    var userLocFile = 'static/data/dss/Buscoords.dss';
    var MPERDEG = (2 * Math.PI/360) * 637800 * Math.cos(37.822153 * (Math.PI/360));
    var baseLat = 30.121722;
    var baseLng = -97.946269;

    $.get(userLocFile,function(txt){
        var lines = txt.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var [name, x, y] = lines[i].split(", ");
            var latX = baseLat + ((x -  1568000) / 3.28084) / MPERDEG;
            var lngY = baseLng + ((y - 14265000) / 3.28084) / MPERDEG;
            if (!inRange(latX, lngY, 37) || lngY > -97.457101) continue;
            var shape = "line";
            // if (allTransformers[name] !== undefined)
            //     shape = "triangle"
            // else if (allCapacitors[name] !== undefined)
            //     shape = "rectangle"
            // else if (bigTransformer[name] !== undefined)
            //     shape = "square"
            allBuses[name] = { lat: latX, lng: lngY, shape: shape}
            busMarkers[name] = new google.maps.Marker({
                 position: {
                     lat: latX,
                     lng: lngY
                 },
                 map: map,
                 title: "Bus: " + name,
                 icon: {
                    url: 'static/img/' + shape + '.png',
                    scaledSize : new google.maps.Size(10, 10),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(5, 5)
                }
            });
        }
    }).done(function (){
        // console.log('------------------ BUSES ------------------');
        // console.log(JSON.stringify(allBuses))
        saveLines()
        // saveLoads();
        saveTransformers();
        // saveGenerators();
    });
}

// LINES

var allLineData = {};
var lineMarkers = [];
function saveLines() {
    var userLocFile = 'static/data/dss/Lines.dss'

    $.get(userLocFile,function(txt) {
        var lines = txt.split("\n");
        for (var i = 0; i < lines.length -1; i++) {
            var lineData = lines[i].split(" ");
            var name = lineData.splice(0, 1);
            var temp = {}
            for (var j = 0; j < lineData.length; j++) {
                var [key, value] = lineData[j].split("=");
                temp[key] = value;
            }

            var busData1 = temp["bus1"].split(".")
            var busData2 = temp["bus2"].split(".")
            temp["bus1"] = busData1.splice(0, 1);
            temp["bus2"] = busData2.splice(0, 1);
            var phase = busData1[busData1.length - 1];
            var color = "#545454"
            // if      (phase == "1") color = "#FF5A5A";
            // else if (phase == "2") color = "#00BBFF";
            // else if (phase == "3") color = "#2EFF8C";
            temp["phases"] = busData1;
            temp["color"] = color;

            if (allBuses[temp["bus1"]] !== undefined && allBuses[temp["bus2"]] !== undefined) {
                temp["start"] = allBuses[temp["bus1"]];
                temp["end"]   = allBuses[temp["bus2"]];
                var mapLine = new google.maps.Polyline({
                    path: [temp["start"], temp["end"]],
                    geodesic: true,
                    strokeColor: color,
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    map: map,
                    zIndex: 8
                });
                allLineData[name] = temp;
                lineMarkers.push(mapLine);
            }

        }
    }).done(function () {
        console.log('------------------ LINES ------------------');
        console.log(JSON.stringify(allLineData));
    });
}

// LOADS

var allLoads = {};
var loadMarkers = [];
function saveLoads() {
    var userLocFile = 'static/data/dss/Loads.dss'

    $.get(userLocFile, function(txt) {
        var lines = txt.split("\n");
        for (var i = 0; i < lines.length -1; i++) {
            var loadData = lines[i].split("\t");
            var name = loadData.splice(0, 1)[0];
            name = name.split("-")[0];
            loadData = loadData.map(x => x.slice(x.indexOf("=") + 1));
            var [phases, bus, kV, kW, kvar, status, model, cvrwatts, cvrvars, cl,
                numcust, yearly, xfkVA] = loadData;
            var busName = bus.split("_")[1];
            var phase = bus.split(".")[1];

            if (allBuses[busName] === undefined)
                continue;

            allLoads[name] = {
                phase: phase,
                bus: busName,
                kV: kV,
                kW: kW,
                kvar: kvar,
                status: status,
                model: model,
                cvrwatts: cvrwatts,
                cvrvars: cvrvars,
                cl: cl,
                numcust: numcust,
                yearly: yearly,
                xfkVA: xfkVA
            }
        }
    }).done(function () {
        console.log('------------------ LOADS ------------------');
        console.log(JSON.stringify(allLoads));
    });
}

// TRANS

var allTransformers = {};
var transMarkers = [];
function saveTransformers() {
    var userLocFile = 'static/data/dss/Transformers.dss'

    $.get(userLocFile, function(txt) {
        var lines = txt.split("\n");
        for (var i = 0; i < lines.length -1; i++) {
            var transformerData = lines[i].split("\t");
            var name = transformerData.splice(0, 1)[0];
            name = name.slice(0, name.indexOf("-"));
            transformerData = transformerData.map(x => x.slice(x.indexOf("=") + 1));
            var [phases, wdg1, bus1, kv1, kVA1, wdg2, bus2, kv2, kVA2, loadloss,
                noloadloss, xhl, normhkva, emerghkva] = transformerData;
            var bus1Data = bus1.split(".")
            var bus1Name = bus1Data.splice(0, 1);

            if (allBuses[bus1Name] === undefined)
                continue;

            allTransformers[name] = {
                phase: bus1Data[0],
                wdg1: { bus: bus1Name, kv: kv1, kVA: kVA1},
                wdg2: { bus: bus2, kv: kv2, kVA: kVA2},
                loadloss: loadloss,
                noloadloss: noloadloss,
                xhl: xhl,
                normhkva: normhkva,
                emerghkva: emerghkva
            }
        }
    }).done(function () {
        console.log('------------------ TRANSFORMERS ------------------');
        console.log(JSON.stringify(allTransformers));
    });
}

// GEN

var allGenerators = {};
var genMarkers = [];
function saveGenerators() {
    var userLocFile = 'static/data/dss/Generators.dss'

    $.get(userLocFile, function(txt) {
        var lines = txt.split("\n");
        for (var i = 0; i < lines.length -1; i++) {
            var generatorData = lines[i].split(" ");
            var name = generatorData.splice(0, 1)[0];
            generatorData = generatorData.map(x => x.slice(x.indexOf("=") + 1));
            var [bus, p, kV, kW, pf, model] = generatorData;
            var busName = bus.split("_")[1].toUpperCase();
            var phases = bus.split(".")
            phases.splice(0, 1);
            if (allBuses[busName] === undefined)
                continue;

            allGenerators[name] = {
                bus: busName,
                phases: phases,
                kV: kV,
                kW: kW,
                pf: pf,
                model: model
            }
        }
    }).done(function () {
        console.log('------------------ GENERATORS ------------------');
        console.log(JSON.stringify(allGenerators));
    });
}

// FUNCTIONS

function inRange(lat, lng, range) {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    var lat1 = 30.946120568515894;
    var lon1 = -97.68366435118686;

    var lon2 = lng;
    var lat2 = lat;

    var R = 6371; // km

    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = lon2 - lon1;
    var dLon = toRad(x2)
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return (d < range);
}
