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
        .pattern(/^\+?[0-9]{10}$/)
        .required(),

    productName: Joi.string()
        .trim()
        .min(1)
        .max(255)
        .required()
});

export {
    enquirySchema,
    loginSchema,
    registerSchema
}