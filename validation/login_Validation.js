const joi = require("joi");

const log_schema = joi.object({
    log_email: joi
    .string()
    .lowercase()
    .regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
    .required()
    .label("Email ID")
    .messages({
      "string.pattern.base": "{{#label}} Must Match The Required Patterns",
    }),
    log_passwords: joi
    .string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .required()
    .label("Password")
    .messages({
      "string.pattern.base": "{{#label}} Must Have 8 Characters Longs, With One Upper Case, Letter & Special Characters",
    }),
}).unknown(true);

module.exports = log_schema;
