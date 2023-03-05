if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

let express = require("express");
let app = express();
let path = require("path");
let ejsMate = require("ejs-mate");
let method = require("method-override");
let mongoose = require("mongoose");
let Job = require("./models/job");
let Employer = require("./models/employer");
let Employee = require("./models/employee");
let Token = require("./models/token");
let { storage, cloudinary, sto } = require("./cloudinary");
let multer = require("multer");
let upload = multer({ sto });
let cities = require("./utils/city");
let positions = require("./utils/position");
let educations = require("./utils/education");
let experiences = require("./utils/experience");
let catchAsync = require("./utils/catchAsync");
let { validateJob, validateEmployer, isLogged, validateEmployee, isAuthEmployee, isAuthEmployer, validateEmployerEdit, validateEmployeeEdit, isVerifiedEmployee, isVerifiedEmployer } = require("./middleware");
let flash = require("connect-flash");
let session = require("express-session");
let bcrypt = require("bcrypt");
let { s3UploadImage, s3GetImage, s3UploadPDF, s3GetPDF, s3DeleteImage, s3DeletePDF } = require("./aws/index");
let mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
let mapBoxToken = process.env.MAPBOX_TOKEN;
let geocoder = mbxGeocoding({accessToken: mapBoxToken});
require("./nodemailer/nodemailer");
let crypto = require("crypto");
let mongoSanitize = require("express-mongo-sanitize");
let helmet = require("helmet");
let MongoStore = require("connect-mongo");

async function main() {
    await mongoose.connect(process.env.DB_URL);
}
  
main().then(() => console.log("connected to database")).catch(err => console.log(err));

app.engine("ejs", ejsMate);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(method("_method"));
app.use(mongoSanitize());

const sessionConfig = {
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL,
        secret: "yoursecret",
        touchAfter: 24*3600
    }),
    secret: "yoursecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60  * 60 * 24 * 7,
      maxAge: 1000 * 60  * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

app.use((req, res, next) => {
    res.locals.id = req.session.user_id;
    res.locals.user = req.session.user_role;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})

app.get("/", (req, res) => {
    res.render("home");
})

app.get("/index", catchAsync(async (req, res) => {
    let topJobs = await Job.find().sort( { createdAt: -1} ).limit(6);
    res.render("Jobs/index", { topJobs });
}))

app.get("/about", (req, res) => {
    res.render("about");
})

app.get("/search", catchAsync(async (req, res) => {
    let foundJobs = await Job.find().sort({createdAt: -1}).limit(60);
    res.render("Jobs/search", { foundJobs, positions, cities, educations, experiences });
}))

app.get("/new", isLogged, isVerifiedEmployer, catchAsync(async (req, res) => {
    let isEmployer = await Employer.findById(req.session.user_id);
    if(isEmployer){
        res.render("Jobs/new", { positions, cities, educations, experiences });
    }
    else{
        req.flash("error", "You don't have permission for this action");
        res.redirect("/index");
    }
}))

app.get("/employers", (req, res) => {
    res.render("Users/register/comp");
})

app.get("/login/comp", (req, res) => {
    res.render("Users/login/comp");
})

app.get("/employee", (req, res) => {
    res.render("Users/register/emp");
})

app.get("/login/emp", (req, res) => {
    res.render("Users/login/emp");
})

app.get("/pwchange", (req, res) => {
    res.render("Users/changepw");
})

app.post("/search", catchAsync(async (req, res) => {
    let { time=["Part-time", "Full-time"], location, position, education, experience } = req.body;
    let pf = time.toString();
    let loc = location;
    let pos = position;
    let ed = education;
    let exp = experience;

    if(location === undefined && position === undefined){
        if(education === undefined){
            if(experience === undefined){
                let loc = "All";
                let pos = "All";
                let ed = "All";
                let exp = "All";
                let foundJobs = await Job.find( {type: {$in: time}} ).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }else{
                let loc = "All";
                let pos = "All";
                let ed = "All";
                let foundJobs = await Job.find( {type: {$in: time}, experience: experience} ).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }
        }else{
            if(experience === undefined){
                let loc = "All";
                let pos = "All";
                let exp = "All";
                let foundJobs = await Job.find( {type: {$in: time}, education: education} ).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }else{
                let loc = "All";
                let pos = "All";
                let foundJobs = await Job.find( {type: {$in: time}, education: education, experience: experience} ).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }
        }
    }else if(location === undefined){
        if(education === undefined){
            if(experience === undefined){
                let loc = "All";
                let ed = "All";
                let exp = "All";
                let foundJobs = await Job.find( {type: {$in: time}, position: position}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }else{
                let loc = "All";
                let ed = "All";
                let foundJobs = await Job.find( {type: {$in: time}, position: position, experience: experience}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }
        }else{
            if(experience === undefined){
                let loc = "All";
                let exp = "All";
                let foundJobs = await Job.find( {type: {$in: time}, position: position, education: education}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }else{
                let loc = "All";
                let foundJobs = await Job.find( {type: {$in: time}, position: position, education: education, experience: experience}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }  
        }
    }else if(position === undefined){
        if(education === undefined){
            if(experience === undefined){
                let pos = "All";
                let ed = "All";
                let exp = "All";
                let foundJobs = await Job.find( {type: {$in: time}, location: location}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }else{
                let pos = "All";
                let ed = "All";
                let foundJobs = await Job.find( {type: {$in: time}, location: location, experience: experience}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }
        }else{
            if(experience === undefined){
                let pos = "All";
                let exp = "All";
                let foundJobs = await Job.find( {type: {$in: time}, location: location, education: education}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }else{
                let pos = "All";
                let foundJobs = await Job.find( {type: {$in: time}, location: location, education: education, experience: experience}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }
            
        }
    }else{
        if(education === undefined){
            if(experience === undefined){
                let ed = "All";
                let exp = "All";
                let foundJobs = await Job.find( {type: {$in: time}, location: location, position: position}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }else{
                let ed = "All";
                let foundJobs = await Job.find( {type: {$in: time}, location: location, position: position, experience: experience}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }
        }else{
            if(experience === undefined){
                let exp = "All";
                let foundJobs = await Job.find( {type: {$in: time}, location: location, position: position, education: education}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }else{
                let foundJobs = await Job.find( {type: {$in: time}, location: location, position: position, education: education, experience: experience}).sort( { createdAt: -1} );
                return res.render("Jobs/list", { foundJobs, positions, cities, pf, loc, pos, ed, exp });
            }
        }
    }
    
}))

app.post("/new", isLogged, isVerifiedEmployer,  upload.array("compImage"), validateJob, catchAsync(async (req, res) => {
    let isEmployer = await Employer.findById(req.session.user_id);
    if(isEmployer){
        let user = await Employer.findById(req.session.user_id);
        let job = new Job(req.body);
        job.views = 0;
        job.geometry = user.geometry;
        job.compName = user.compName;
        job.compImage = user.compImage;
        job.createdAt = Date.now();
        let day =  job.createdAt.getDate();
        let month = job.createdAt.getMonth();
        let year = job.createdAt.getFullYear();
        let time = `${day}.${month}.${year}`;
        job.time = time;
        user.jobAds.push(job);
        await job.save();
        await user.save();
        req.flash("success", "New job ad added");
        res.redirect(`/show/${job._id}`);
    }
    else{
        req.flash("error", "You don't have permission for this action");
        res.redirect("/index");
    }
    
}))

app.post("/employers", upload.single("compImage"), validateEmployer, catchAsync(async (req, res) => {
    let isExistEmployer = await Employer.findOne({compName: req.body.compName});
    if(isExistEmployer){
        req.flash("error", "Company name already exist");
        return res.redirect("/employers");
    }

    let isExistEmail = await Employer.findOne({email: req.body.email});
    if(isExistEmail){
        req.flash("error", "Used email");
        return res.redirect("/employers");
    }

    let file = req.file;
    if( file.mimetype !== ('image/jpeg' || 'image/jpg' || 'image/png') ){
        req.flash("error", "Image type should be jpg, jpeg or png");
        return res.redirect("/employers");
    }

    if(req.body.password.length < 6){
        req.flash("error", "Password should be minimum 6 letters long");
        return res.redirect("/employers");
    }

    let employer = new Employer(req.body);
    let salt = await bcrypt.genSalt(12);
    let hashedPassword = await bcrypt.hash(req.body.password, salt);

    let result = await s3UploadImage(file);
    employer.compImage.location = result.Location;
    employer.compImage.key = result.Key;

    employer.password = hashedPassword;

    let geoData = await geocoder.forwardGeocode({query: req.body.location,limit: 1}).send();
    employer.geometry = geoData.body.features[0].geometry;

    await employer.save()
    req.session.user_id = employer._id;
    req.session.user_role = "employer";

    req.flash("success", "Created a new account! Welcome :)");
    res.redirect(`/employer/${employer._id}`);
}))

app.post("/login/comp", catchAsync(async (req, res) => {
    let email = req.body.email;
    let pw = req.body.password;
    let employer = await Employer.findOne({email: email});
    if(!employer){
        req.flash("error", "No account");
        return res.redirect("/login/comp");
    }
    let compare = await bcrypt.compare(pw, employer.password);
    if(!compare){
        req.flash("error", "No account");
        return res.redirect("/login/comp");
    }
    req.session.user_id = employer._id;
    req.session.user_role = "employer";

    req.flash("success", "Welcome!");
    res.redirect(`/employer/${employer._id}`);
}))

app.post("/employee", upload.single("cv"), validateEmployee, catchAsync(async(req, res) => {
    let isExistEmployee = await Employee.findOne({email: req.body.email});
    if(isExistEmployee){
        req.flash("error", "Used email");
        return res.redirect("/employee");
    }

    let file = req.file;
    if( file.mimetype !== 'application/pdf' ){
        req.flash("error", "File type should be pdf");
        return res.redirect("/employee");
    }

    if(req.body.password.length < 6){
        req.flash("error", "Password should be minimum 6 letters long");
        return res.redirect("/employee");
    }

    let employee = new Employee(req.body);
    let salt = await bcrypt.genSalt(12);
    let hashedPassword = await bcrypt.hash(req.body.password, salt);

    let result = await s3UploadPDF(file);
    employee.cv.location = result.Location;
    employee.cv.key = result.Key;

    employee.password = hashedPassword;
    await employee.save();
    req.session.user_id = employee._id;
    req.session.user_role = "employee";

    req.flash("success", "Created a new account! Welcome");
    res.redirect(`/employee/${employee._id}`);
}))

app.post("/login/emp", catchAsync(async(req, res) => {
    let email = req.body.email;
    let pw = req.body.password;
    let employee = await Employee.findOne({email: email});
    if(!employee){
        req.flash("error", "No account");
        return res.redirect("/login/comp");
    }
    let compare = await bcrypt.compare(pw, employee.password);
    if(!compare){
        req.flash("error", "No account");
        return res.redirect("/login/emp");
    }
    req.session.user_id = employee._id;
    req.session.user_role = "employee";

    req.flash("success", "Welcome");
    res.redirect(`/employee/${employee._id}`);
}))

app.post("/logout", (req, res) => {
    req.session.user_id = null;
    req.session.user_role = null;
    res.redirect("/index");
})

app.post("/pwchange", catchAsync(async (req, res) => {
    if(req.body.password.length < 6){
        req.flash("error", "Password should be minimum 6 letters long");
        return res.redirect("/pwchange");
    }

    let email = req.body.email;
    let password = req.body.password;
    let employee = await Employee.findOne({email: email});
    let employer = await Employer.findOne({email: email});

    if(employee){
        let token = await new Token({
        userId: employee._id,
        token: crypto.randomBytes(32).toString("hex"),
        createdAt: Date.now()
        }).save();
    
        const message = `${process.env.BASE_URL}/pwchange/${employee._id}/${token.token}/${password}`;
        await sendEmailPw(employee.email, `Change Password ${employee.fullname}`, message);
    
        req.flash("success","An email sent to your account");
        return res.redirect("/login/emp");
    }
    else if(employer){
        let token = await new Token({
        userId: employer._id,
        token: crypto.randomBytes(32).toString("hex"),
        createdAt: Date.now()
        }).save();
    
        const message = `${process.env.BASE_URL}/pwchange/${employer._id}/${token.token}/${password}`;
        await sendEmailPw(employer.email, `Change Password ${employer.compName}`, message);
    
        req.flash("success","An email sent to your account");
        return res.redirect("/login/comp");
    }
    else{
        req.flash("error","An error occured");
        return res.redirect("/index");
    }
}))

app.post("/sendCV/:id", isLogged, isVerifiedEmployee, catchAsync(async (req, res) => {
    let empid = req.session.user_id;
    let jobid = req.params.id;
    let employee = await Employee.findById(empid);
    let job = await Job.findById(jobid);

    let find = job.EmployeeId.includes(empid);
    if(find){
        req.flash("error","You have already submitted for this job!");
        return res.redirect(`/show/${jobid}`);
    }

    job.EmployeeId.push(employee);
    await job.save();

    req.flash("success", "Sent your CV");
    res.redirect(`/show/${jobid}`);
}))

app.post("/verify/:id", isLogged, catchAsync( async(req, res) => {
    let id = req.params.id;
    let employee = await Employee.findById(id);
    let employer = await Employer.findById(id);

    if(employee){
        if(req.session.user_id === id){
            let token = await new Token({
            userId: id,
            token: crypto.randomBytes(32).toString("hex"),
            createdAt: Date.now()
            }).save();
        
            const message = `${process.env.BASE_URL}/verify/${id}/${token.token}`;
            await sendEmail(employee.email, `Verify Email ${employee.fullname}`, message);
        
            req.flash("success","An email sent to your account");
            return res.redirect(`/employee/${id}`);
        }
        else{
            req.flash("error","You don't have permission for this action");
            return res.redirect("/index");
        }
    }
    else if(employer){
        if(req.session.user_id === id){
            let token = await new Token({
            userId: id,
            token: crypto.randomBytes(32).toString("hex"),
            createdAt: Date.now()
            }).save();
        
            const message = `${process.env.BASE_URL}/verify/${id}/${token.token}`;
            await sendEmail(employer.email, `Verify Email ${employer.compName}`, message);
        
            req.flash("success","An email sent to your account");
            return res.redirect(`/employer/${id}`);
        }
        else{
            req.flash("error","You don't have permission for this action");
            return res.redirect("/index");
        }
    }
    else{
        req.flash("error","An error occured");
        return res.redirect("/index");
    }
    
}))

app.get("/show/:id", catchAsync(async (req, res) => {
    let jobid = req.params.id;
    let jobAd = await Job.findById(jobid);
    let listOfParagraphs = jobAd.body.split("\r\n");
    let image = await s3GetImage(jobAd.compImage);
    jobAd.views++;
    await jobAd.save();
    res.render("Jobs/show", { jobAd, listOfParagraphs, jobid, image });
}))

app.get("/employee/:id", isLogged, isAuthEmployee, catchAsync(async (req, res) => {
    let id = req.params.id;
    let employee = await Employee.findById(id);
    let pdf = await s3GetPDF(employee.cv);
    res.render("Users/employee/employee", { employee, pdf });
}))

app.get("/employer/:id", isLogged, isAuthEmployer, catchAsync(async (req, res) => {
    let id = req.params.id;
    let employer = await Employer.findById(id).populate("jobAds");
    let image = await s3GetImage(employer.compImage);
    res.render("Users/employer/employer", { employer, image });
}))

app.get("/employee/:id/edit", isLogged, isAuthEmployee, catchAsync(async (req, res) => {
    let id = req.params.id;
    let employee = await Employee.findById(id);
    res.render("Users/employee/edit", { employee });
}))

app.put("/employee/:id/edit", isLogged, isAuthEmployee, upload.single("cv"), validateEmployeeEdit, catchAsync(async (req, res) => {
    let foundEmployee = await Employee.findById(req.params.id);

    let isEmptyEmail = foundEmployee.email === req.body.email;
    if(!isEmptyEmail){
        let isExistEmail = await Employee.findOne({email: req.body.email});
        if(isExistEmail){
            req.flash("error", "Used email");
            return res.redirect(`/employee/${req.params.id}/edit`);
        }
    }

    let file = req.file;
    if(file){
        if( file.mimetype !== 'application/pdf' ){
            req.flash("error", "File type should be pdf");
            return res.redirect(`/employee/${req.params.id}/edit`);
        }
        await s3DeletePDF(foundEmployee.cv);
        let result = await s3UploadPDF(file);
        foundEmployee.cv.location = result.Location;
        foundEmployee.cv.key = result.Key;
        await foundEmployee.save();
    }

    await Employee.findByIdAndUpdate(req.params.id, req.body);

    req.flash("success", "Succesfully edited your account");
    res.redirect(`/employee/${req.params.id}`);
}))

app.get("/employer/:id/edit", isLogged, isAuthEmployer, catchAsync(async (req, res) => {
    let id = req.params.id;
    let employer = await Employer.findById(id);
    res.render("Users/employer/edit", { employer });
}))

app.put("/employer/:id/edit", isLogged, isAuthEmployer, upload.single("compImage"), validateEmployerEdit, catchAsync(async (req, res) => {
    let foundEmployer = await Employer.findById(req.params.id);

    let isEmptyEmail = foundEmployer.email === req.body.email;
    if(!isEmptyEmail){
        let isExistEmail = await Employer.findOne({email: req.body.email});
        if(isExistEmail){
            req.flash("error", "Used email");
            return res.redirect(`/employer/${req.params.id}/edit`);
        }
    }

    let isEmptyEmployer = foundEmployer.compName === req.body.compName;
    if(!isEmptyEmployer){
        let isExistEmployer = await Employer.findOne({compName: req.body.compName});
        if(isExistEmployer){
            req.flash("error", "Company name already exist");
            return res.redirect(`/employer/${req.params.id}/edit`);
        }
    }

    let file = req.file;
    if(file){
        if( file.mimetype !== ('image/jpeg' || 'image/jpg' || 'image/png') ){
            req.flash("error", "Image type should be jpg, jpeg or png");
            return res.redirect(`/employer/${req.params.id}/edit`);
        }
        await s3DeleteImage(foundEmployer.compImage);
        let result = await s3UploadImage(file);
        foundEmployer.compImage.location = result.Location;
        foundEmployer.compImage.key = result.Key;
        await foundEmployer.save();
    }

    let geoData = await geocoder.forwardGeocode({query: req.body.location,limit: 1}).send();
    foundEmployer.geometry = geoData.body.features[0].geometry;
    await foundEmployer.save();

    await Employer.findByIdAndUpdate(req.params.id, req.body);

    req.flash("success", "Successfully edited your account");
    res.redirect(`/employer/${req.params.id}`);
}))

app.get("/verify/:id/:token", isLogged, catchAsync(async (req, res) => {
    let id = req.params.id;
    let token = req.params.token;
    let foundToken = await Token.findOne({userId: id, token: token});
    if(!foundToken){
        return res.redirect("/index");
    }

    let employee = await Employee.findById(id);
    let employer = await Employer.findById(id);

    if(employee){
        if(req.session.user_id === id){
            await Employee.findByIdAndUpdate(id, {verified: true} );
            await Token.findByIdAndRemove(foundToken._id);
            req.flash("success","Email verified!");
            res.redirect(`/employee/${id}`);
        }
        else{
            req.flash("error","You don't have permission for this action");
            return res.redirect("/index");
        }
    }

    else if(employer){
        if(req.session.user_id === id){
            await Employer.findByIdAndUpdate(id, {verified: true} );
            await Token.findByIdAndRemove(foundToken._id);
            req.flash("success","Email verified");
            return res.redirect(`/employer/${id}`);
        }
        else{
            req.flash("error","You don't have permission for this action");
            return res.redirect("/index");
        }
    }

}))

app.get("/employer/:id/applicants/:id2", isLogged, isVerifiedEmployer, isAuthEmployer, catchAsync(async (req, res) => {
    let employer = await Employer.findById(req.params.id)
    let job = await Job.findById(req.params.id2).populate("EmployeeId");
    let applicants = job.EmployeeId;
    res.render("Users/employer/applicants", { applicants, employer, job });
}))

app.get("/pwchange/:id/:token/:password", catchAsync(async (req, res) => {
    let id = req.params.id;
    let token = req.params.token;
    let password = req.params.password;
    let foundToken = await Token.findOne({userId: id, token: token});
    if(!foundToken){
        return res.redirect("/index");
    }

    let employee = await Employee.findById(id);
    let employer = await Employer.findById(id);

    if(employee){
        await Token.findByIdAndRemove(foundToken._id);
        let salt = await bcrypt.genSalt(12);
        let hashedPassword = await bcrypt.hash(password, salt);
        await Employee.findByIdAndUpdate(id, {password: hashedPassword});
        req.flash("success", "Password changed");
        return res.redirect("/login/emp");
    }
    else if(employer){
        await Token.findByIdAndRemove(foundToken._id);
        let salt = await bcrypt.genSalt(12);
        let hashedPassword = await bcrypt.hash(password, salt);
        await Employer.findByIdAndUpdate(id, {password: hashedPassword});
        req.flash("success", "Password changed");
        return res.redirect("/login/comp");
    }
    else{
        return res.redirect("/index");
    }
}))

app.get("/employer/:id/applicants/:id2/CV/:id3", isLogged, isVerifiedEmployer, isAuthEmployer, catchAsync(async (req, res) => {
    let employee = await Employee.findById(req.params.id3);
    let cv = await s3GetPDF(employee.cv);
    res.render("Users/employer/cv", { cv });
}))

app.use((err, req, res, next) => {
    let { status = 500 } = err;
    if (!err.message) {
        err.message = "Something Went Wrong";
    }
    res.status(status).render("error", { err });
})

app.listen(3000, () => {
    console.log("listening on port 3000");
})