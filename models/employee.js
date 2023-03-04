let  mongoose = require("mongoose");

let employeeSchema = new mongoose.Schema({
    email: { type: String, required: true},
    password: { type: String, required: true },
    fullname: { type: String, required: true },
    age: { type: String, required: true },
    gender : { type: String, required: true },
    verified: { type: Boolean, required: true, default: false},
    cv: {location: {type: String, required: true}, key: {type: String, required: true}}
})

module.exports = mongoose.model("Employee", employeeSchema);