import Joi from "joi";

const registerSchema = Joi.object({
    organizationName: Joi.string().trim().min(2).max(150).required(),
    fullName: Joi.string().trim().min(2).max(150).required(),
    email: Joi.string().trim().email().max(255).required(),
    password: Joi.string().min(8).max(72).required()
});

const loginSchema = Joi.object({
    email: Joi.string().trim().email().max(255).required(),
    password: Joi.string().required()
});

const enquirySchema = Joi.object({
    customerName: Joi.string()
        .trim()
        .min(2)
        .max(150)
        .required(),

    email: Joi.string()
        .trim()
        .email()
        .max(255)
        .required(),

    phone: Joi.string()
        .trim()
        .pattern(/^\+?[0-9]{10,15}$/)
        .required(),

    productName: Joi.string()
        .trim()
        .min(1)
        .max(255)
        .required()
});

const employeeSchema = Joi.object({
    fullName: Joi.string().trim().min(2).max(150).required(),
    email: Joi.string().trim().email().max(255).required(),
    password: Joi.string().min(8).max(72).required(),
    role: Joi.string().valid("manager", "salesperson").required()
});

const leadSchema = Joi.object({
    customerName: Joi.string().trim().min(2).max(150).required(),
    email: Joi.string().trim().email().allow(""),
    phone: Joi.string().trim().min(7).max(30).required(),
    productInterest: Joi.string().trim().max(255).allow(""),
    status: Joi.string().valid("new", "contacted", "qualified", "won", "lost").default("new")
});

export {
    enquirySchema,
    loginSchema,
    registerSchema,
    employeeSchema,
    leadSchema
}
