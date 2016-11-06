// REQUIRES
const firebase = require('firebase');
const fs = require('fs');
const csv = require('fast-csv');
const async = require('async');

firebase.initializeApp({
    serviceAccount: "./citiviz-914fd-firebase-adminsdk-al22h-0d51e5b384.json",
    databaseURL: "https://citiviz-914fd.firebaseio.com"
});

var db = firebase.database();
var ref = db.ref("/");

// OLD DEMO CODE
var bikeRef = ref.child("bikes"); // <-- SCHEMA BASE
var masterBikeRef = ref.child('masterBikes')

// THIS LINE IS A KILL SWITCH FOR THE DATABASE. IT. WILL. ERASE. EVERYTHING.
// firebase.database().ref().remove()


// Open up a data stream for a csv
// TODO: Either have this iterate through files or be dynamic (or both)
var stream = fs.createReadStream('data/201601-citibike-tripdata.csv');

csv
    .fromStream(stream, {
        headers: true
    }) // headers: true creates objects instead of arrays
    .validate(function(ride, next) { // Read each line (ride)
        var bikeID = ride['bikeid'];

        timestamp = createTimeStampFrom(ride['starttime'], bikeID)

        rideObject = {
            startTime: ride['starttime'],
            duration: ride['tripduration'],
            startStation: ride['start station id'],
            endStation: ride['end station id'],
            user: {
                gender: ride['gender'],
                birthYear: ride['birth year'],
                type: ride['usertype']
            }
        };
        masterBikeRef.child(bikeID).set(1)
        console.log('Bike ' + bikeID + ' exists.');
        updateSummaryForBike(bikeID, rideObject).then(
            function(data) {
                createNewRideForBike(bikeID, rideObject, timestamp).then(
                    function(data) {
                        next();
                    });
            });
    });

// /////////////////////////////////////////////////////////////////
// // WORKING CODE - Pull Data Down
// countryRef.child(theParsedCountry).child('gold').once("value")
//     .then(function(dataSnapshot) {
//         var goldToReport = dataSnapshot.val()
//     });
//
// // SAMPLE
// schemaBase.child(childID).child(childID).once("value")
//    .then(function(dataSnapshot) {
//       var childValue = dataSnapshot.val();
//    })
// /////////////////////////////////////////////////////////////////

// //////////////////////////////////////////////////////////////////
// // WORKING CODE - Push Data Up
// // HotSwap Ex
// firebase.database().ref().child('counter').transaction(function(currentRank) {
//                         return currentRank + 1;
//                     });
// //////////////////////////////////////////////////////////////////

function createTimeStampFrom(dateTime, bikeID) {
    var monthDay = dateTime.split('/');
    var yearTime = monthDay[2].split(' ');
    var hourMin = yearTime[1].split(':');

    if (monthDay[0].length == 1) {
        var theMonth = '0' + monthDay[0];
    } else {
        theMonth = monthDay[0];
    }

    if (monthDay[1].length == 1) {
        var theDay = '0' + monthDay[1];
    } else {
        var theDay = monthDay[1];
    }

    var theYear = yearTime[0];

    if (hourMin[0].length == 1) {
        var theHour = '0' + hourMin[0];
    } else {
        var theHour = hourMin[0];
    }

    var theMin = hourMin[1];

    return String(theYear + theMonth + theDay + '_' + theHour + theMin + '_' + bikeID)
}

function createNewBikeWithID(bikeID, birthdate, birthplace) {
    console.log('Created new bike ' + bikeID + '.');

    masterBikes.child(bikeID).set()

    return bikeRef.child(bikeID).set({ // Set Birth certificate
        bikeid: bikeID,
        birthdate: birthdate,
        birthplace: birthplace,
        summary: {
            num_rides: 0
        }
    });
};

function createNewRideForBike(bikeID, rideObject, timestamp) {
    // Ride Schema
    //  var rideObject = {
    //    duration: Number,
    //    startTime: String,
    //    startStation: Number,
    //    endStation: Number,
    //    user: [{
    //       type: String,
    //       birthYear: Number,
    //       gender: Number
    //    }]
    //   };
    //  console.log('ride for bike')

    // Write the new post's data simultaneously in the posts list and the user's post list.
    var updates = {};
    updates['/bikes/' + bikeID + '/rides/' + timestamp] = rideObject;

    console.log('Created new ride on bike ' + bikeID + '.');

    return firebase.database().ref().update(updates);
}

function updateSummaryForBike(bikeID, rideObject) {
    /*
    SUMMARY SCHEMA

    bike.summary:

    num_rides: Count
    avg_duration: Avg
    avg_gender: (1-2)
    avg_type: (1-2)
    */

    return bikeRef.child(bikeID).child('summary').once('value').then(function(snapshot) {
        var currentRides = snapshot.child('num_rides').val()
        var newAverageDuration = (
                Number(snapshot.child('avg_duration').val() * currentRides) + Number(rideObject.duration)
            ) /
            Number(currentRides + 1);

        var newAvgBirthYear = (
                Number(snapshot.child('avg_birth_year').val() * currentRides) + Number(rideObject.user.birthYear)
            ) /
            Number(currentRides + 1);

        var newPercFemale = snapshot.child('percent_female').val();
        if (rideObject.user.gender == 0) {
            var newPercFemale = snapshot.child('percent_female').val();
        } else if (rideObject.user.gender == 1) { // male
            var newPercFemale = Number(currentRides * snapshot.child('percent_female').val()) /
                Number(currentRides + 1);
        } else if (rideObject.user.gender == 2) {
            var newPercFemale = Number(
                    Number(currentRides * snapshot.child('percent_female').val()) + 1) /
                Number(currentRides + 1);
        }

        var newPercSubscriber = snapshot.child('percent_subscriber').val();
        if (rideObject.user.type == "Customer") { // male
            var newPercSubscriber = Number(currentRides + snapshot.child('percent_subscriber').val()) /
                Number(currentRides + 1);
        } else if (rideObject.user.type == "Subscriber") {
            var newPercSubscriber = Number(
                    Number(currentRides * snapshot.child('percent_subscriber').val()) + 1) /
                Number(currentRides + 1);
        }

        var summaryObject = {
            num_rides: currentRides + 1,
            avg_duration: newAverageDuration,
            avg_birth_year: newAvgBirthYear,
            percent_female: newPercFemale,
            percent_subscriber: newPercSubscriber
        }

        var updates = {};
        updates['/bikes/' + bikeID + '/summary'] = summaryObject;

        console.log('Updated summary on bike ' + bikeID + '.');

        firebase.database().ref().update(updates);
    });
}
