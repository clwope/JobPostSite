let { employerSchema, jobSchema, employeeSchema, employerSchemaEdit, employeeSchemaEdit } = require("./schemas");
let Employer = require("./models/employer");
let Employee = require("./models/employee");
let Job = require("./models/job");
let ExpressError = require('./utils/ExpressError');
let catchAsync = require("./utils/catchAsync");

module.exports.validateEmployer = (req, res, next) => {
    let { error } = employerSchema.validate(req.body);
    if(error){
      let msg = error.details.map(el => el.message).join(",");
      throw new ExpressError(msg, 400);
    }else{
      next();
    }
}

module.exports.validateEmployerEdit = (req, res, next) => {
  let { error } = employerSchemaEdit.validate(req.body);
  if(error){
    let msg = error.details.map(el => el.message).join(",");
    throw new ExpressError(msg, 400);
  }else{
    next();
  }
}

module.exports.validateJob = (req, res, next) => {
    let { error } = jobSchema.validate(req.body);
    if(error){
      let msg = error.details.map(el => el.message).join(",");
      throw new ExpressError(msg, 400);
    }else{
      next();
    }
}

module.exports.validateEmployee = (req, res, next) => {
    let { error } = employeeSchema.validate(req.body);
    if(error){
      let msg = error.details.map(el => el.message).join(",");
      throw new ExpressError(msg, 400);
    }else{
      next();
    }
}

module.exports.validateEmployeeEdit = (req, res, next) => {
  let { error } = employeeSchemaEdit.validate(req.body);
  if(error){
    let msg = error.details.map(el => el.message).join(",");
    throw new ExpressError(msg, 400);
  }else{
    next();
  }
}

module.exports.isLogged = (req, res, next) => {
  if(req.session.user_id){
    next();
  }
  else{
    req.flash("error", "You should login");
    res.redirect("/index");
  }
}

module.exports.isAuthEmployee = catchAsync(async (req, res, next) => {
  let employee = await Employee.findById(req.params.id);
  if(employee._id.equals(req.session.user_id)){
    next();
  }
  else{
    req.flash("error", "You don't have permission for this action");
    res.redirect("/index");
  }
})

module.exports.isAuthEmployer = catchAsync(async (req, res, next) => {
  let employer = await Employer.findById(req.params.id);
  if(employer._id.equals(req.session.user_id)){
    next();
  }
  else{
    req.flash("error", "You don't have permission for this action");
    res.redirect("/index");
  }
})

module.exports.isVerifiedEmployee = catchAsync(async (req, res, next) => {
  let employee = await Employee.findById(req.session.user_id);
  if(employee.verified){
    next();
  }else{
    req.flash("error", "Confirm your email account");
    res.redirect(`/employee/${req.session.user_id}`);
  }
})

module.exports.isVerifiedEmployer = catchAsync(async (req, res, next) => {
  let employer = await Employer.findById(req.session.user_id);
  if(employer.verified){
    next();
  }else{
    req.flash("error", "Confirm your email account");
    res.redirect(`/employer/${req.session.user_id}`);
  }
})