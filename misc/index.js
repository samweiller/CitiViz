// Process the Data

// Set the Requirements
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const async = require('async'); // MARK FOR DELETION
// const writeLocal = require('../json-write-local');
const mongoose = require('mongoose');

/*

*/

var mongoClient = require('mongodb').MongoClient;
   mongoClient.connect("mongodb://localhost/ test", function(error, db) {
        if(!error){
             console.log("We are connected");
        }
        else
           console.dir(error);
    });


// Open up a data stream for a csv
// TODO: Either have this iterate through files or be dynamic (or both)
var stream = fs.createReadStream('data/testData.csv');

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
});

mongoose.connect('mongodb://localhost/test');

var bikeSchema = new mongoose.Schema({
   bikeid: Number,
   birthCertificate: {
      birthplace: Number,
      birthday: String
   },
   rides: [{
      duration: Number,
      startTime: String,
      startStation: Number,
      endStation: Number,
      user: [{
         type: String,
         birthYear: Number,
         gender: Number
      }]
   }]
});

var Bike = mongoose.model('Bike', bikeSchema);

var establishBike = new Bike({
   bikeid: 1
});

establishBike.save(function(err, establishBike) {
   if (err) return console.error(err);
   // console.dir(establishBike);
})

// Read in CSV data
csv
    .fromStream(stream, {
        headers: true
    }) // headers: true creates objects instead of arrays
    .on("data", function(ride) { // Read each line (ride)
        var bikeID = ride['bikeid'];

        Bike.findOne({'bikeid': bikeID}, function(err, data) {
           if (data.length) {
             console.log('data exists');
          } else {
             console.log('no data')
          }
        });
      //   console.log(query)

        /* PRE MONGOOSE STUFF

        // THIS IS BLOCKING AND I'm OKAY WITH THAT
        // Block the code to check for file existence and create file if needed.
        try {
            fs.accessSync('bikes/' + bikeID + '.json', fs.F_OK); // Check if JSON file exists for bike
            console.log('Bike ' + bikeID + ' already exists! Adding ride to JSON.');
        } catch (e) {
            console.log('Bike ' + bikeID + ' does not exist. Creating birth certificate!');
            var birthObject = {
               bikeid: bikeID,
               birthCertificate: {
                  birthday: ride['starttime'],
                  birthplace: ride['start station id']
               }
            };
            writeLocal.JSONwrite('bikes/' + bikeID + '.json', birthObject);
        }

        // Add ride to JSON
        rideObject = {
           ride: [{
             startTime: ride['starttime'],
             duration: ride['tripduration'],
             startStation: ride['start station id'],
             endStation: ride['end station id'],
             user: [{
                gender: ride['gender'],
                birthYear: ride['birth year'],
                type: ride['usertype']
             }]
          }]
        }

        writeLocal.JSONadd('bikes/' + bikeID + '.json', rideObject)

        console.log('Hello, world')


        //   console.log(ride);
        //   console.log(ride['start station id']);
        //   console.log('Hello, world!');

        */
    })

// END FULL DATA READ
.on("end", function() {
    console.log('Finished Processing CSV');
});
