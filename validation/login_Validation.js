const joi = require("joi");

const log_schema = joi.object({
    log_email: joi
    .string()
    .lowercase()
    .regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
    .required()
    .label("email_id")
    .messages({
      "string.pattern.base": "{{#label}} Must Match The Required Patterns",
    }),
    log_passwords: joi
    .string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .required(),
}).unknown(true);

module.exports = log_schema;
