let mongoose = require("mongoose");

let employerSchema = new mongoose.Schema({
    compName: { type: String, required: true},
    email: { type: String, required: true},
    location: { type: String, required: true},
    password: { type: String, required: true},
    compImage: {location: {type: String, required: true}, key: {type: String, required: true}},
    geometry: { type: { type: String, enum: ['Point'], required: true }, coordinates: {type: [Number], required: true } },
    verified: { type: Boolean, required: true, default: false },
    jobAds: [ {type: mongoose.Schema.Types.ObjectId, ref: "Job"} ]
})

module.exports = mongoose.model("Employer", employerSchema);