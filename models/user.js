const mongoose = require("mongoose");

const user = new mongoose.Schema({
    address: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  });
  
module.exports = mongoose.model("User", user);