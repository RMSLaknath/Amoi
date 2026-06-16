import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import userModel from "../models/userModel.js";


const createToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET)
}

const createMailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Route for user login
const loginUser = async (req,res) => {
  try {
    const {email, password} = req.body;
    const user = await userModel.findOne({email});

    if(!user) {
      return res.json({success:false, message: "User doesn't exist"})
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(isMatch) {
      const token = createToken(user._id)
      res.json({success:true, token})
    }

    else {
      res.json({success:false, message: "Invalid credentials"})
    }
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }

}



// Route for user registration
const registerUser = async (req,res) => {
  try {
   const { name, email, password } = req.body;

   // Checking user already exists or not
   const exists = await userModel.findOne({email});
   if(exists) {
      return res.json({success:false, message: "User already exists"})
   }

   // Validating email format & strong password
   if(!validator.isEmail(email)) {
    return res.json({success:false, message: "Please enter a valid email"})
   }

   if(password.length < 8) {
    return res.json({success:false, message: "Password must be at least 8 characters long"})
   }

   // Hashing User password
   const salt = await bcrypt.genSalt(10);
   const hashedpassword = await bcrypt.hash(password, salt);

   const newUser = new userModel({
    name,
    email,
    password: hashedpassword
   })

   const user = await newUser.save()

   const token = createToken(user._id)

   res.json({success:true, token})

  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}



// Route for Admin login
const adminLogin = async (req,res) => {
  try {
    const {email, password} = req.body;

    if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(email+password, process.env.JWT_SECRET);
      res.json({success:true, token})
    } else {
      res.json({success:false, message: "Invalid credentials"});
    }
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}


// Send password reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await userModel.findOne({ email })

    // Always return success to avoid exposing which emails are registered
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    user.resetToken = token
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)
    await user.save()

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`

    const transporter = createMailTransporter()
    await transporter.sendMail({
      from: `"Amoi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your Amoi password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
          <h2 style="font-weight:400;margin-bottom:8px">Password Reset</h2>
          <p style="color:#666;font-size:14px;line-height:1.6;margin-bottom:24px">
            We received a request to reset the password for your Amoi account.<br/>
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:12px;letter-spacing:0.15em;padding:14px 28px">
            RESET PASSWORD
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


// Reset password using the token from email
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!password || password.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters long.' })
    }

    const user = await userModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    })

    if (!user) {
      return res.json({ success: false, message: 'Reset link is invalid or has expired.' })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    user.resetToken = undefined
    user.resetTokenExpiry = undefined
    await user.save()

    res.json({ success: true, message: 'Password updated. You can now sign in.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


export { loginUser, registerUser, adminLogin, forgotPassword, resetPassword }
