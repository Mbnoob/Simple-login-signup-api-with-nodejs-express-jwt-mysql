const joi = require("joi");

const schema = joi.object({
  First_name: joi.string().min(3).max(10).required(),
  Last_name: joi.string().min(3).max(10).required(),
  dob: joi.date().iso().required(),
  email_id: joi
    .string()
    .lowercase()
    .regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
    .required()
    .label('email_id')
    .messages({
      "string.pattern.base": "{{#label}} Must Match The Required Patterns",
    }),
  passwords: joi
    .string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .required(),
   conforn_passwords: joi.any().equal(joi.ref('passwords'))
    .required()
    .label('conforn_passwords')
    .messages({ 'any.only': '{{#label}} does not match' })
});

module.exports = schema;
