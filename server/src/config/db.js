const mongoose = require('mongoose');

const connectDB = async (mongodbUri) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongodbUri);
};

module.exports = connectDB;
