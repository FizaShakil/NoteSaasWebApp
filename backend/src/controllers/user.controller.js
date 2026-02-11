import fs from 'fs'
import path from 'path'
import {ApiResponse } from '../utils/ApiResponse.js'
import {ApiError } from '../utils/ApiError.js'
import {asyncHandler } from '../utils/asyncHandler.js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import prisma from '../config/prisma.js'
import logger from '../config/logger.js'
import sendEmail from '../utils/sendEmail.js'


//generate access and refresh token

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const payload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    // Store refresh token in DB
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating tokens');
  }
};

//Signup User
const signupUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  //  Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(400, 'User already exists');
  }

  //  Hash password
  const hashedPassword = await bcryptjs.hash(password, 10);

  //  Create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  logger.info(
    {
      userId: newUser.id,
    },
    'User registered successfully'
  );

  return res
    .status(201)
    .json(new ApiResponse(201, {}, 'User registered successfully'));
});

//Login User

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //  Find user by email
  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) {
    throw new ApiError(401, 'Incorrect username or password');
  }

  //  Compare password
  const isPasswordValid = await bcryptjs.compare(password, dbUser.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Incorrect username or password');
  }

  //  Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(dbUser.id);

  logger.info(
    {
      userId: dbUser.id,
    },
    'User logged in successfully'
  );

  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };


  return res.status(200)
   .cookie("accessToken", accessToken, cookieOptions)
   .cookie("refreshToken", refreshToken, cookieOptions)
  .json(
    new ApiResponse(
      200,
      {
        user: {
          id: dbUser.id,
          email: dbUser.email,
        },
        accessToken,
        refreshToken
      },
      'User logged in successfully'
    )
  );
});


//Logout User

const logoutUser = asyncHandler(async (req, res) => {

  //  Remove refresh token from DB
  await prisma.user.update({
    where: {
      id: req.user.id, // set in auth middleware
    },
    data: {
      refreshToken: null,
    },
  });

  // Cookie options (same as your logic)
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  // Clear cookies and respond
  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(
      new ApiResponse(200, {}, 'User Logged out successfully!')
    );
});


//Change Name and Password 

const changeUserDetails = asyncHandler(async (req, res) => {
  const { email, oldPassword, newPassword, name } = req.body;

  // Step 1: Fetch user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new ApiError(400, 'User not found');
  }

  // Step 2: Compare old password
  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new ApiError(400, 'Incorrect old password');
  }

  // Step 3: Hash new password
  const newHashedPassword = await bcryptjs.hash(newPassword, 10);

  // Step 4: Update user details
  await prisma.user.update({
    where: { email },
    data: {
      password: newHashedPassword,
      ...(name && { name }), // update name only if provided
    },
  });

  logger.info(
    {
      userId: user.id,
    },
    'Password changed successfully'
  );

  return res.status(200).json(
    new ApiResponse(200, {}, 'User Password updated successfully')
  );
});

//Forgot Password

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  // Security: Always return same response to prevent email enumeration attacks
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, {}, 'If the email exists, a reset link has been sent')
    );
  }

  // Generate cryptographically secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Security: Hash token before storing to prevent token theft from database
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Security: Set expiry time to limit token validity window (15 minutes)
  const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);

  // Store only hashed token and expiry in database (never store raw token)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: resetExpiry,
    },
  });

  // Create reset URL using frontend URL for better user experience
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Email HTML content
    const templatePath = path.join(
      process.cwd(),
     'src/templates/resetPasswordEmail.html'
    )

let htmlContent = fs.readFileSync(templatePath, 'utf-8')

htmlContent = htmlContent
  .replace('{{name}}', user.name)
  .replace('{{resetLink}}', resetUrl)

  try {
    // Send reset email containing raw token (only sent via secure email)
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: htmlContent,
    });

    logger.info(
      {
        userId: user.id,
      },
      'Password reset email sent successfully'
    );
  } catch (error) {
    // Clear reset token if email fails to prevent orphaned tokens
    console.log("Error: ", error)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    throw new ApiError(500, 'Failed to send reset email. Please try again.');
  }

  // Security: Same response regardless of user existence
  return res.status(200).json(
    new ApiResponse(200, {}, 'If the email exists, a reset link has been sent')
  );
});

//Reset Password

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, 'Token and new password are required');
  }

  // Security: Hash incoming token to match stored hashed version
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Security: Find user with valid token and check expiry in single query
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: {
        gt: new Date(), // Ensure token hasn't expired
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  // Security: Generic error message for invalid/expired tokens
  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Hash new password before storing
  const hashedPassword = await bcryptjs.hash(newPassword, 10);

  // Security: Update password and clear reset fields in single transaction
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null, // Clear token for single-use security
      resetPasswordExpiry: null, // Clear expiry
    },
  });

  logger.info(
    {
      userId: user.id,
    },
    'Password reset successfully'
  );

  return res.status(200).json(
    new ApiResponse(200, {}, 'Password reset successfully')
  );
});

//get user details

const getUserDetails = asyncHandler(async (req, res) => {
  // Get logged-in user id from auth middleware
  const userId = req.user.id;

  // Fetch user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt : true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not exist');
  }

  logger.info(
    {
      userId: user.id,
    },
    'User profile fetched successfully'
  );

  // Respond
  return res.status(200).json(
    new ApiResponse(200, user, 'User data fetched successfully')
  );
});


export {generateAccessAndRefreshToken, signupUser, loginUser , logoutUser, changeUserDetails, forgotPassword, resetPassword, getUserDetails}