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

// Open up a data stream for a csv
// TODO: Either have this iterate through files or be dynamic (or both)
var stream = fs.createReadStream('data/testData.csv');

csv
    .fromStream(stream, {
        headers: true
    }) // headers: true creates objects instead of arrays

.on("data", function(ride) { // Read each line (ride)
   console.log(ride)

    var bikeID = ride['bikeid'];
    rideObject = {
      //   ride: [{
            startTime: ride['starttime'],
            duration: ride['tripduration'],
            startStation: ride['start station id'],
            endStation: ride['end station id'],
            user: {
                gender: ride['gender'],
                birthYear: ride['birth year'],
                type: ride['usertype']
            }
      //   }]
    };
    console.log(rideObject)

    // Find Bike ID
    bikeRef.once('value', function(snapshot) {
        if (snapshot.hasChild(bikeID)) {
            console.log('exists');
            // .then(function(data) {
                createNewRideForBike(bikeID, rideObject).then(
                   function(data) {
                      console.log('Ride created')
                   }
                );
            // });
        } else {
            // .then(function(data) {
                createNewBikeWithID(bikeID, ride['starttime'], ride['start station id']).then(function(data) {
                    createNewRideForBike(bikeID, rideObject);
                });
            // });
        }
    });
    // If no exist, create it
    // Create ride entry AS PROMISE
});

.on("end", function(){
     console.log("done");
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

function createNewBikeWithID(bikeID, birthdate, birthplace) {
   console.log('Created new bike ' + bikeID + '.');

    return bikeRef.child(bikeID).set({ // Set Birth certificate
        bikeid: bikeID,
        birthdate: birthdate,
        birthplace: birthplace
    });
};

function createNewRideForBike(bikeID, rideObject) {
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

    // Get a key for a new Post.
    var newRideKey = bikeRef.child(bikeID).child('rides').push().key;

    // Write the new post's data simultaneously in the posts list and the user's post list.
    var updates = {};
    updates['/bikes/' + bikeID + '/rides/' + newRideKey] = rideObject;

    console.log('Created new ride on bike ' + bikeID + '.');

    return firebase.database().ref().update(updates);
}
