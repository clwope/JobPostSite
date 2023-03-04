const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

module.exports.employerSchema = Joi.object({
    compName: Joi.string().required().escapeHTML(),
    email: Joi.string().required().escapeHTML(),
    location: Joi.string().required().escapeHTML(),
    password: Joi.string().required().escapeHTML()
})

module.exports.jobSchema = Joi.object({
    body: Joi.string().required().escapeHTML(),
    position: Joi.string().required().escapeHTML(),
    pay: Joi.string().required(),
    subPosition: Joi.string().required().escapeHTML(),
    location: Joi.string().required().escapeHTML(),
    type: Joi.string().required().escapeHTML(),
    age: Joi.string().required().escapeHTML(),
    gender: Joi.string().required().escapeHTML(),
    education: Joi.string().required().escapeHTML(),
    experience: Joi.string().required().escapeHTML(),
    phone: Joi.string().required().escapeHTML()
})

module.exports.employeeSchema = Joi.object({
    email: Joi.string().required().escapeHTML(),
    fullname: Joi.string().required().escapeHTML(),
    password: Joi.string().required().escapeHTML(),
    age: Joi.string().required().escapeHTML(),
    gender: Joi.string().required().escapeHTML()
})

module.exports.employerSchemaEdit = Joi.object({
    compName: Joi.string().required().escapeHTML(),
    email: Joi.string().required().escapeHTML(),
    location: Joi.string().required().escapeHTML(),
})

module.exports.employeeSchemaEdit = Joi.object({
    email: Joi.string().required().escapeHTML(),
    fullname: Joi.string().required().escapeHTML(),
    age: Joi.string().required().escapeHTML(),
    gender: Joi.string().required().escapeHTML()
})