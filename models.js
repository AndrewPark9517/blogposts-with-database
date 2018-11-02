'use strict';

const mongoose = require('mongoose');

// author schema
const authorSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  userName: {type: String, unique: true}
});

// comment schema to be used in blogpost schema
const commentSchema = mongoose.Schema({
  content: String
});

// schema to represent blogpost
const blogPostSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'authors' },
    comments: [commentSchema]
});


blogPostSchema.virtual('fullName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});


blogPostSchema.pre('find', function(next) {
  this.populate('author');
  next();
});

blogPostSchema.pre('findOne', function(next) {
  this.populate('author');
  next();
})

blogPostSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.fullName
  }
};

authorSchema.methods.serialize = function() {
  return {
    id: this._id,
    name: `${this.firstName} ${this.lastName}`,
    userName: this.userName
  }
}

// serialize with comments (for id specific get request)
blogPostSchema.methods.serializeWC = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.fullName,
    comments: this.comments
  }
}

const Author = mongoose.model('authors', authorSchema);
const Blogpost = mongoose.model('blogposts', blogPostSchema);

module.exports = {Blogpost, Author};