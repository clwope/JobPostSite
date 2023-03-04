const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  }
}).index( {"createdAt": 1}, {expireAfterSeconds: 6*60*60} );

module.exports = mongoose.model("Token", tokenSchema);