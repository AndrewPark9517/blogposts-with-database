'use strict';

const express = require('express');
const mongoose = require('mongoose');

// to use es6 promises w/ mongoose
mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Blogpost} = require('./models');

const app = express();
app.use(express.json());

// CRUD operations

app.get('/post', (req, res) => {
	Blogpost.find().limit(10)
	.then(blogposts => {
		res.status(200).json({
			blogposts: blogposts.map(post => post.serialize())
		});
	})
	.catch(err => {
		console.log(err);
		res.status(500).json({message: "Internal server error"});
	});
});

app.get('/post/:id', (req, res) => {
	Blogpost.findById(req.params.id)
	.then(post => res.status(200).json(post.serialize()))
	.catch(err => {
		console.log(err);
		res.status(500).json({message: "Internal Server Error"});
	})
});

app.post('/post', (req, res) => {
	// assumes if author is present, then both first name and last name are present
	// not a good assumption, but good enough for an exercise
	const requiredFields = ['title', 'content', 'author'];
	for (let i = 0; i < requiredFields.length; i++) {
		if (!(requiredFields[i] in req.body)) {
			const message = `Missing ${requiredFields[i]} in request body`;
			res.status(400).send(message);
			console.error(message);
		}
	}

	Blogpost.create({
		title: req.body.title,
		content: req.body.content,
		author: {
			firstName: req.body.author.firstName,
			lastName: req.body.author.lastName
		}
	})
		.then(post => res.status(201).json(post.serialize()))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'});
		});
});

app.put('/post/:id', (req, res) => {
	if(req.params.id !== req.body.id) {
		const message = 'Request path id and request body id do not match';
		console.error(message);
		res.status(400).json({message: message});
	}

	const toUpdate = {};
	// again assumes if author is present, both first name and last name are present
	const updateableFields = ['title', 'content', 'author'];
	
	updateableFields.forEach(field => {
		if(field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	Blogpost
		.findByIdAndUpdate(req.params.id, {$set: toUpdate})
		.then(post => res.status(200).json(post.serialize()))
		.catch(err => res.status(500).json({message: "Interal server error"}))
});

app.delete('/post/:id', (req, res) => {
	Blogpost.findByIdAndRemove(req.params.id)
		.then(post => res.status(204).end())
		.catch(err => status(500).json({message: "Internal server error"}));
});

// to catch all bad requests
app.use('*', function(req, res) {
	res.status(404).json({message: "Endpoint Not Found"});
});

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
      mongoose.connect(
        databaseUrl,
        err => {
          if (err) {
            return reject(err);
          }
          server = app
            .listen(port, () => {
              console.log(`Your app is listening on port ${port}`);
              resolve();
            })
            .on("error", err => {
              mongoose.disconnect();
              reject(err);
            });
        }
      );
    });
  }
  
  // this function closes the server, and returns a promise. we'll
  // use it in our integration tests later.
  function closeServer() {
    return mongoose.disconnect().then(() => {
      return new Promise((resolve, reject) => {
        console.log("Closing server");
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }
  
  // if server.js is called directly (aka, with `node server.js`), this block
  // runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
  if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
  }
  
  module.exports = { app, runServer, closeServer };