'use strict';

const express = require('express');
const mongoose = require('mongoose');

// to use es6 promises w/ mongoose
mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Blogpost, Author} = require('./models');

const app = express();
app.use(express.json());

// CRUD operations

app.get('/post', (req, res) => {
	Blogpost.find() //doesn't work w/out limit
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
	.then(post => res.status(200).json(post.serializeWC()))
	.catch(err => {
		console.log(err);
		res.status(500).json({message: "Internal Server Error"});
	})
});

app.post('/post', (req, res) => {
	const requiredFields = ['title', 'content', 'author'];
	for (let i = 0; i < requiredFields.length; i++) {
		if (!(requiredFields[i] in req.body)) {
			const message = `Missing ${requiredFields[i]} in request body`;
			res.status(400).send(message);
			console.error(message);
		}
	}

Author
	.findById(req.body.author)
	.then(author => {
		if(author) {
			Blogpost
				.create({
					title: req.body.title,
					content: req.body.content,
					author: req.body.author
				})
				.then(post => res.status(201).json({
					id: post.id,
					author: `${author.firstName} ${author.lastName}`,
					content: post.content,
					title: post.title,
					comments: post.comments
				}))
				.catch(err => {
					console.error(err);
					res.status(500).json({ error: 'Something went wrong' });
				});
		}
		else {
			const message = `Author not found`;
      console.error(message);
      return res.status(400).send(message);
		}
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'})
	});

	// note this doesn't work due to the fact that it's not possible to populate after create
	/*	if(!(Author.findById(req.body.author))) {
	 *		res.status(400).json({message: "ID of given author in request body not found"});
	 *		}
   *
	 * Blogpost
	 * 	.create({
	 *		title: req.body.title,
	 *		content: req.body.content,
	 *		author: req.body.author
	 *	})
	 *	.then(post => {
	 *		post.populate('author');
	 *		res.status(201).json(post.serializeWC());
	 *	})
	 *	.catch(err => {
	 *		console.error(err);
	 *		res.status(500).json({message: 'Internal server error'
	 *	});
	 *  });*/
});

app.put('/post/:id', (req, res) => {
	if(req.params.id !== req.body.id) {
		const message = 'Request path id and request body id do not match';
		console.error(message);
		res.status(400).json({message: message});
	}

	const toUpdate = {};
	// again assumes if author is present, both first name and last name are present
	const updateableFields = ['title', 'content'];
	
	updateableFields.forEach(field => {
		if(field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	Blogpost
		.findByIdAndUpdate(req.params.id, {$set: toUpdate}, {new: true})
		.then(post => {
			Author 
				.findById(post.author)
				.then(author => {
					res.status(200).json({
						id: post.id,
						title: post.title,
						author: `${author.firstName} ${author.lastName}`,
						content: post.content
					});
				})
				.catch(err => res.status(500).json({message: "Interal server error"}));
		})
		.catch(err => res.status(500).json({message: "Interal server error"}))
});

app.delete('/post/:id', (req, res) => {
	Blogpost.findByIdAndRemove(req.params.id)
		.then(post => res.status(204).end())
		.catch(err => status(500).json({message: "Internal server error"}));
});

app.get('/authors', (req, res) => {
  Author
    .find()
    .then(authors => {
      res.json(authors.map(author => author.serialize()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something went terribly wrong' });
    });
});

app.post('/authors', (req, res) => {
	const requiredFields = ['firstName', 'lastName', 'userName'];
	for(let i = 0; i < requiredFields.length; i++) {
		if(!(requiredFields[i] in req.body)) {
			const message = `Missing ${requiredFields[i]} in request body`;
			res.status(400).send(message);
			console.error(message);
		}
	}

	Author
    .findOne({ userName: req.body.userName })
    .then(author => {
      if (author) {
        const message = `Username already taken`;
        console.error(message);
        return res.status(400).send(message);
      }
      else {
        Author
          .create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            userName: req.body.userName
          })
          .then(author => res.status(201).json(author.serialize()))
          .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something went horribly awry' });
    });
});

app.put('/authors/:id', (req, res) => {
	if(req.params.id !== req.body.id) {
		const message = 'Request path id and request body id do not match';
		console.error(message);
		res.status(400).json({message: message});
	}

	const updated = {};
  const updateableFields = ['firstName', 'lastName', 'userName'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

	Author
    .findOne({ userName: updated.userName || '', _id: { $ne: req.params.id } })
    .then(author => {
      if(author) {
        const message = `Username already taken`;
        console.error(message);
        return res.status(400).send(message);
      }
      else {
        Author
          .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
          .then(updatedAuthor => {
            res.status(200).json({
              id: updatedAuthor.id,
              name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
              userName: updatedAuthor.userName
            });
          })
          .catch(err => res.status(500).json({ message: err }));
      }
    });
});

// need to check if it will delete all posts by the given author
app.delete('/authors/:id', (req, res) => {
	Author
		.findByIdAndRemove(req.params.id)
		.then(() => {
			Blogpost
				.remove({author: req.params.id})
				.then(() => {
					res.status(204).end();
				})
		})
		.catch(err => status(500).json({message: "Internal server error"}));
})

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