'use strict';
exports.DATABASE_URL =
  process.env.DATABASE_URL || 'mongodb://localhost/blog-app';

// TEST_DATABASE_URL is for testing later. The database has not been created yet
// need a separate databse since it seems the test will modify the database
// look at thinkful bootcamp server-side unit 2, lesson 2, part 1 for reference
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-blog-app';
exports.PORT = process.env.PORT || 8080;