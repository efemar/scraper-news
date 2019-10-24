//Dependencies
var express = require('express')
var cheerio = require("cheerio");
var axios = require("axios");
var exphbs = require("express");
var mongoose = require("mongoose");

// Require all models
var db = require("./models");

var PORT = 3000;
// var PORT = process.env.PORT || 3000;

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/scraper-news", { useNewUrlParser: true });
// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/unit18Populater";
// mongoose.connect(MONGODB_URI)

mongoose.connect("mongodb://localhost/scraper-news", { useNewUrlParser: true });

// Initialize Express
var app = express();

// Configure middleware

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));


app.engine('handlebars', exphbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

// Routes
// A GET route for scraping the echoJS website
    
 app.get("/scrape", function (req, res) {
  const URL = 'https://www.npr.org/sections/news/'
    axios
      .get(URL)
      .then(URLResponse => {
        const $ = cheerio.load(URLResponse.data)
        $('#overflow article').each((i, element) => {
          var title = $(element).find("h2").children("a").text();
          var link = $(element).find("h2").children("a").attr("href");
          var summary = $(element).find("p").children("a").text();
          db.Article.create({
            title: title,
            link: link,
            summary: summary
          }).catch(console.log)
        })
        //console.log(title)
        res.send('done scraping')
        //res.render('index', { articles: dbArticles })
      })
      .catch(error => {
        res.status(500).json(error)
      })
      //res.render('index', { articles: dbArticles })
  })

  app.get('/', (req, res) => {
    db.Article.find()
      .limit(20)
      .then(dbArticles => res.render("index", { articles : dbArticles }))
      .catch(error => res.status(500).json(error))
  })


// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  db.Article.find({})
    .then(function (dbArticles) {
      res.json(dbArticles)
    })
    .catch(function (err) {
      res.json(err)
    })
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  db.Article.findOne({ _id: req.params.id})
    .populate("note")
    .then(function (dbArticles) {
      //console.log(dbArticles)
      res.json(dbArticles)
    })
    .catch(function (err) {
      res.json(err)
    })

});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // TODO
  // ====
  db.Note.create(req.body)
  .then(function(dbNote) {
   return db.Article.findOneAndUpdate({ _id: req.params.id} , { $push: {note: dbNote._id } }, {new: true});
  })
  .then(function() {
    res.redirect('/')
  })
  .catch(error => {
    // handle errors
    res.status(400).json(error)
  })
  })


// Route for deleting an Article's associated Note

app.delete('/note', (req, res) => {
  db.Note.deleteMany({})
    .then(({ deletedCount }) => {
      res.json({ deletedCount })
    })
    .catch(error => {
      console.log(error)
      res.status(500).send('An unexpected error occurred.')
    })
})

// Route for saving the articles and displaying them on the saved pages

//Saved Articles Routes
app.get('/saved', (req, res) => {
  db.SavedArticle.find()
    .sort({ _id: -1 })
    .limit(20)
    .then(dbSavedArticles => res.render('saved-article', { SavedArticle: dbSavedArticles }))
    .catch(error => res.status(500).json(error))
})

// Route for clearing all articles

app.delete('/articles', (req, res) => {
  db.Article.deleteMany({})
    .then(({ deletedCount }) => {
      res.json({ deletedCount })
    })
    .catch(error => {
      console.log(error)
      res.status(500).send('An unexpected error occurred.')
    })
})



// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
