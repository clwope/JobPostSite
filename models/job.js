let mongoose = require("mongoose");

let jobSchema = new mongoose.Schema({
    compName: {type: String, required:true},
    body: { type: String, required: true },
    position: { type: String, required: true },
    pay: {type: String, required: true},
    subPosition: { type: String, required: true },
    location: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true },
    time: { type: String, required: true },
    education: { type: String, required: true },
    experience: { type: String, required: true },
    phone: { type: String, required: true },
    type: { type: String, enum: ["Part-time", "Full-time"], required: true },
    createdAt: { type: Date },
    compImage: {location: {type: String, required: true}, key: {type: String, required: true}},
    views: { type: Number },
    geometry: { type: { type: String, enum: ['Point'], required: true }, coordinates: {type: [Number], required: true } },
    EmployeeId: [ { type: mongoose.Schema.Types.ObjectId, ref: "Employee"} ],
}).index( {"createdAt": 1}, {expireAfterSeconds: 30*24*60*60} );

module.exports = mongoose.model("Job", jobSchema);