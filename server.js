var express = require('express');
var app = express();
var mongoose = require('mongoose');
var moment = require('moment');
var Promise = require("promise").Promise;
var googleImages = require('google-images');
var http = require('http');

var apiUrl = "";
var url = 'mongodb://admin:admin@ds015892.mlab.com:15892/dlw-fcc-image-search';
var db;

var port = process.env.PORT || 8080;

mongoose.connect(url);

var Schema = mongoose.Schema;  

var ImageSearch = new Schema({  
    term: { type: String, required: true },
    when: { type: String, required: true }
});
 
var ImageSearchModel = mongoose.model('ImageSearch', ImageSearch); 

app.get('/api/latest/imagesearch/', function (req, res) {
    // Browse recent search history
    
    var recentSearches = [];
    
    return ImageSearchModel.find(function (err, searches) {
        if (!err) {
            for(var i = 0; i < searches.length; i++) {
                var search = searches[i];
                recentSearches.push({"term":search.term, "when": search.when});
            }            
            
            res.setHeader('Content-Type', 'application/json');
            return res.send(JSON.stringify(recentSearches, null, 3));            
        } else {
            return console.log(err);
        }
    });
});

app.get('/api/imagesearch/:searchTerm', function (req, res) {
    // Look up images from google with the given term.
    // Store this search for future use
    // Return results and allow pagination
    
    var searchTerm = req.params.searchTerm;
    var page = req.query.offset;
    
    if(!page) {
        page = 1;
    }
    
    var currentDate = moment().format();
    
    var search = new ImageSearchModel({
        "term": searchTerm,
        "when": currentDate
    });
        
    search.save(function (err) {
        if (err) return console.log(err);
    });    
    
    var client = googleImages('006116720211627076061:2fdgcjv0e_k', 'AIzaSyCS7H1ep7eWRUyAPv_Aajr8hOieR_h7TVw');
    var searchResults = [];
    
    // paginate results

    client.search(searchTerm, {page: page})
        .then(function (images) {
            for(var i = 0; i < images.length; i++) {
                var image = images[i];
                searchResults.push({"url":image.url, "thumbnail": image.thumbnail.url});
            }
            res.setHeader('Content-Type', 'application/json');
            return res.send(JSON.stringify(searchResults, null, 3));
        });    
    
});

app.get('/', function (req, res) {
    return res.send("To use this api use /api/imagesearch/'search-term-here'. You can also view recent searches with '/api/latest/imagesearch/'.");
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});