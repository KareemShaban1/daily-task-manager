import { Response } from 'express';
import pool from '../database/connection.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { email, password, firstName, lastName, timezone } = req.body;

		if (!email || !password) {
			res.status(400).json({ error: 'Email and password are required' });
			return;
		}

		// Check if user exists
		const [existingUsers] = await pool.execute(
			'SELECT id FROM users WHERE email = ?',
			[email]
		);

		if (Array.isArray(existingUsers) && existingUsers.length > 0) {
			res.status(409).json({ error: 'Email already registered' });
			return;
		}

		// Hash password
		const passwordHash = await hashPassword(password);

		// Generate verification token
		const verificationToken = crypto.randomBytes(32).toString('hex');

		// Create user
		const [result] = await pool.execute(
			`INSERT INTO users (email, password_hash, first_name, last_name, timezone, email_verification_token)
       VALUES (?, ?, ?, ?, ?, ?)`,
			[
				email,
				passwordHash,
				firstName || null,
				lastName || null,
				timezone || 'UTC',
				verificationToken,
			]
		);

		const insertResult = result as { insertId: number };
		const userId = insertResult.insertId;

		// Create default user settings
		await pool.execute(
			`INSERT INTO user_settings (user_id) VALUES (?)`,
			[userId]
		);

		// Send verification email
		await sendVerificationEmail(email, verificationToken);

		// Generate JWT token
		const token = generateToken({
			userId,
			email,
			subscriptionTier: 'free',
		});

		res.status(201).json({
			message: 'User created successfully. Please check your email to verify your account.',
			token,
			user: {
				id: userId,
				email,
				firstName,
				lastName,
				timezone: timezone || 'UTC',
				emailVerified: false,
			},
		});
	} catch (error) {
		console.error('Signup error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			res.status(400).json({ error: 'Email and password are required' });
			return;
		}

		// Find user
		const [users] = await pool.execute(
			`SELECT id, email, password_hash, first_name, last_name, timezone, 
              email_verified, subscription_tier, subscription_status
       FROM users WHERE email = ?`,
			[email]
		);

		if (!Array.isArray(users) || users.length === 0) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		}

		const user = users[0] as {
			id: number;
			email: string;
			password_hash: string;
			first_name: string | null;
			last_name: string | null;
			timezone: string;
			email_verified: boolean;
			subscription_tier: string;
			subscription_status: string;
		};

		// Verify password
		const isValid = await comparePassword(password, user.password_hash);

		if (!isValid) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		}

		// Generate JWT token
		const token = generateToken({
			userId: user.id,
			email: user.email,
			subscriptionTier: user.subscription_tier,
		});

		res.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				firstName: user.first_name,
				lastName: user.last_name,
				timezone: user.timezone,
				emailVerified: user.email_verified,
				subscriptionTier: user.subscription_tier,
				subscriptionStatus: user.subscription_status,
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { token } = req.query;

		if (!token || typeof token !== 'string') {
			res.status(400).json({ error: 'Verification token is required' });
			return;
		}

		const [users] = await pool.execute(
			'SELECT id FROM users WHERE email_verification_token = ?',
			[token]
		);

		if (!Array.isArray(users) || users.length === 0) {
			res.status(404).json({ error: 'Invalid verification token' });
			return;
		}

		await pool.execute(
			`UPDATE users 
       SET email_verified = TRUE, email_verification_token = NULL 
       WHERE email_verification_token = ?`,
			[token]
		);

		res.json({ message: 'Email verified successfully' });
	} catch (error) {
		console.error('Email verification error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { email } = req.body;

		if (!email) {
			res.status(400).json({ error: 'Email is required' });
			return;
		}

		const [users] = await pool.execute(
			'SELECT id, email FROM users WHERE email = ?',
			[email]
		);

		// Don't reveal if email exists or not (security best practice)
		if (Array.isArray(users) && users.length > 0) {
			const resetToken = crypto.randomBytes(32).toString('hex');
			const resetExpires = new Date(Date.now() + 3600000); // 1 hour

			await pool.execute(
				`UPDATE users 
         SET password_reset_token = ?, password_reset_expires = ? 
         WHERE email = ?`,
				[resetToken, resetExpires, email]
			);

			await sendPasswordResetEmail(email, resetToken);
		}

		res.json({
			message: 'If an account exists with this email, a password reset link has been sent.',
		});
	} catch (error) {
		console.error('Forgot password error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { token, password } = req.body;

		if (!token || !password) {
			res.status(400).json({ error: 'Token and password are required' });
			return;
		}

		if (password.length < 8) {
			res.status(400).json({ error: 'Password must be at least 8 characters' });
			return;
		}

		const [users] = await pool.execute(
			`SELECT id FROM users 
       WHERE password_reset_token = ? 
       AND password_reset_expires > NOW()`,
			[token]
		);

		if (!Array.isArray(users) || users.length === 0) {
			res.status(400).json({ error: 'Invalid or expired reset token' });
			return;
		}

		const passwordHash = await hashPassword(password);

		await pool.execute(
			`UPDATE users 
       SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL 
       WHERE password_reset_token = ?`,
			[passwordHash, token]
		);

		res.json({ message: 'Password reset successfully' });
	} catch (error) {
		console.error('Reset password error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({ error: 'Unauthorized' });
			return;
		}

		const [users] = await pool.execute(
			`SELECT id, email, first_name, last_name, timezone, email_verified, 
              subscription_tier, subscription_status, created_at
       FROM users WHERE id = ?`,
			[req.userId]
		);

		if (!Array.isArray(users) || users.length === 0) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		const user = users[0] as {
			id: number;
			email: string;
			first_name: string | null;
			last_name: string | null;
			timezone: string;
			email_verified: boolean;
			subscription_tier: string;
			subscription_status: string;
			created_at: Date;
		};

		res.json({
			id: user.id,
			email: user.email,
			firstName: user.first_name,
			lastName: user.last_name,
			timezone: user.timezone,
			emailVerified: user.email_verified,
			subscriptionTier: user.subscription_tier,
			subscriptionStatus: user.subscription_status,
			createdAt: user.created_at,
		});
	} catch (error) {
		console.error('Get profile error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({ error: 'Unauthorized' });
			return;
		}

		const { firstName, lastName, timezone } = req.body;

		// Build update query dynamically
		const updates: string[] = [];
		const params: any[] = [];

		if (firstName !== undefined) {
			updates.push('first_name = ?');
			params.push(firstName || null);
		}

		if (lastName !== undefined) {
			updates.push('last_name = ?');
			params.push(lastName || null);
		}

		if (timezone !== undefined) {
			updates.push('timezone = ?');
			params.push(timezone || 'UTC');
		}

		if (updates.length === 0) {
			res.status(400).json({ error: 'No fields to update' });
			return;
		}

		params.push(req.userId);

		await pool.execute(
			`UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
			params
		);

		// Fetch updated user
		const [users] = await pool.execute(
			`SELECT id, email, first_name, last_name, timezone, email_verified, 
              subscription_tier, subscription_status, created_at
       FROM users WHERE id = ?`,
			[req.userId]
		);

		if (!Array.isArray(users) || users.length === 0) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		const user = users[0] as {
			id: number;
			email: string;
			first_name: string | null;
			last_name: string | null;
			timezone: string;
			email_verified: boolean;
			subscription_tier: string;
			subscription_status: string;
			created_at: Date;
		};

		res.json({
			id: user.id,
			email: user.email,
			firstName: user.first_name,
			lastName: user.last_name,
			timezone: user.timezone,
			emailVerified: user.email_verified,
			subscriptionTier: user.subscription_tier,
			subscriptionStatus: user.subscription_status,
			createdAt: user.created_at,
		});
	} catch (error) {
		console.error('Update profile error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

