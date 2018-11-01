'use strict';

const mongoose = require('mongoose');

// schema to represent blogpost
const blogpostSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {
        firstName: String,
        lastName: String
    }
});

blogpostSchema.virtual('fullName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogpostSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.fullName
  }
};

const Blogpost = mongoose.model('blogposts', blogpostSchema);

module.exports = {Blogpost};