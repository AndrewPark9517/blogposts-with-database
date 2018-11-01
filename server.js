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