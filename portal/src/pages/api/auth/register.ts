import { NextApiRequest, NextApiResponse } from 'next';
import {
  validateRegisterData,
  hashPassword,
  createUserObject,
  generateToken,
} from '@/lib/auth';
import { compose, withMethod, withLogging, withCORS } from '@/lib/middleware';

// Mock database - Replace with real DynamoDB calls
const mockUsers: Record<string, any> = {};

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clubId?: string;
}

interface RegisterResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  error?: string;
}

async function registerHandler(req: NextApiRequest, res: NextApiResponse<RegisterResponse>) {
  try {
    // Validate request body
    const data = validateRegisterData(req.body as RegisterRequest);

    // Check if user already exists
    if (mockUsers[data.email]) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user object
    const user = createUserObject(data, passwordHash);

    // Save user to database (mock)
    // TODO: Replace with real DynamoDB save
    mockUsers[data.email] = user;

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
    });

    // Set secure HTTP-only cookie
    res.setHeader(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`
    );

    // Send welcome email
    // TODO: Implement email service with SendGrid
    console.log(`Sending welcome email to ${data.email}`);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Registration failed';

    return res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
}

export default compose(withMethod('POST'), withLogging, withCORS)(registerHandler);
