const asyncHendler = require("express-async-handler")
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
    const secretKey = process.env.JWT_SECRET || "defaultSecretKey";
    return jwt.sign({id}, secretKey, {expiresIn: "1d"});
};

// Register User

const registerUser = asyncHendler( async (req, res) => {
    const {name, email, password} = req.body

    // Validation
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please fill in all required fileds");
    }
    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must be up to 6 characters");
    }

    // Check if user email already exists
    const userExists = await User.findOne({email})

    if (userExists) {
        res.status(400);
        throw new Error("Email has already been registered");  
    }

    // Create new User
    const user = await User.create({
        name,
        email,
        password,
    });

    // Genrate Token
    const token = generateToken(user._id)

    // Send HTTP-only cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        secure: true,
    });

    if (user) {
        const {_id, name, email, photo, phone, bio} = user;
        res.status(201).json({
            _id,
            name, 
            email, 
            photo, 
            phone, 
            bio,
            token,
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

// Login User
const loginUser = asyncHendler( async (req, res) => {
    //res.send("Login");
    const {email, password} = req.body

    ///console.log(email);
    //console.log(password);
    // Validate Request
    if (!email || !password) {
        res.status(400);
        throw new Error("Please add email and password");
    }
    
    // Check if user exists
    const user = await User.findOne({email})
    //console.log(user);
    

    if (!user) {
        res.status(400);
        throw new Error("User not found, please singup");
    }

    // User exists, check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);
    //console.log(passwordIsCorrect);

    // Genrate Token
    const token = generateToken(user._id)

    // Send HTTP-only cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        secure: true,
    });
    
    if (user && passwordIsCorrect) {
        const {_id, name, email, photo, phone, bio} = user;
        res.status(200).json({
            _id,
            name, 
            email, 
            photo, 
            phone, 
            bio,
            token,
        });
    } else {
        res.status(400);
        throw new Error("Invalid email or password");
    }
});

// Logout User
const logout = asyncHendler (async (req, res) => {
    //res.send("Logout user");
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0), // 1 day
        sameSite: "none",
        secure: true,
    });
    return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get User Data
const getUser = asyncHendler(async (req, res) => {
    //res.send("Get user Data");
    const user =  await User.findById(req.user._id);

    if (user) {
        const {_id, name, email, photo, phone, bio} = user;
        res.status(200).json({
            _id,
            name, 
            email, 
            photo, 
            phone, 
            bio,
        });
    } else {
        res.status(400);
        throw new Error("User Not Found");
    }
});

// Get Login status
const loginStatus = asyncHendler (async (req, res) => {
    //res.send("Login Status");
    const token = req.cookies.token;
    if (!token) {
        return res.json(false);
    }
    // Verify Token
    const secretKey = process.env.JWT_SECRET || "defaultSecretKey";
    const verified = jwt.verify(token, secretKey);
    if (verified) {
        return res.json(true);
    }
    return res.json(false);
});

// Update User
const updateUser = asyncHendler (async (req, res) => {
    //res.send("User updated");
    const user = await User.findById(req.user._id);

    if (user) {
        const { name, email, photo, phone, bio} = user;
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;
        user.photo = req.body.photo || photo;

        const updatedUser = await user.save()
        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name, 
            email: updatedUser.email, 
            photo: updatedUser.photo, 
            phone: updatedUser.phone, 
            bio: updatedUser.bio,
        })
    } else {
        res.status(404);
        throw new Error("User Not Found");
    }
});

// Change Password
const changePassword = asyncHendler (async (req, res) => {
    //res.send("Password Change");
    const user = await User.findById(req.user._id);
    const {oldPassword, password} = req.body;

    if(!user) {
        res.status(400);
        throw new Error("User Not Found, pleas signup");
    }
    // Validate
    if(!oldPassword || !password) {
        res.status(400);
        throw new Error("Please ad and new pasword");
    }

    // Check if old password matches password in DB
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    // Save new password
    if ( user && passwordIsCorrect) {
        user.password = password;
        await user.save();
        res.status(200).send("Password change successful");
    } else {
        res.status(400);
        throw new Error("Old pasword is incorrect");
    }
});

// Forgot Password
const forgotPassword = asyncHendler (async (req, res) => {
    //res.send("Forgot Password");
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user) {
        res.status(404);
        throw new Error("User does not exist");
    }

    // Delete token if it exists in DB
    let token = await Token.findOne({userID: user._id});
    if (token) {
        await token.deleteOne();
    }

    // Create Reste Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    console.log("Generated Reset Token:", resetToken);
    
    // Hash token befor saving to DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    //console.log("Hashed Token:", hashedToken);
    
    // Save Token to DB
    await new Token({
        userID: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000), // 30 minutes
    }).save();

    // Construct Reset URL 
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
    //console.log("Reset URL:", resetUrl);

    // Reset Email
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the url below to reset your password</p>
        <p>This reset link is valid for only 30 minutes.</p>

        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

        <p>Regards...</p>
        <p>Pinvent Team</p>
    `;
    const subject = "Password Reset Request"
    const send_to = user.email
    const send_from = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, send_to, send_from);
        res.status(200).json({success: true, message: "Reset Email Sent"});
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again");
    }
});

// Reset Password
const resetPassword = asyncHendler (async (req, res) => {
   // res.send("Reset Password");
   const {password} = req.body;
   const {resetToken} = req.params;

   // Hash token, then compare to Token in DB
   const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

   // Find token in DB
   const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: new Date() },
   })

   if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
   }

   // Find user
   const user = await User.findOne({_id: userToken.userID});
   user.password = password;
   await user.save();
   res.status(200).json({
    message: "Password Reset Successful, Please Login",
   });
});

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
};