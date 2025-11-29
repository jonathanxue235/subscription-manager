/**
 * authentication services which does all authentication business login. information hiding: hides password hashing, jwt token generation, validation rules, does not know about database implementation and http requests/responses
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor(userRepository, jwtSecret) {
    this.userRepo = userRepository;
    this.jwtSecret = jwtSecret;
  }

  async register(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepo.create({
      email: email,
      password: hashedPassword,
      created_at: new Date().toISOString()
    });

    const token = this._generateToken(user);

    return {
      user: this._sanitizeUser(user),
      token
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = this._generateToken(user);

    return {
      user: this._sanitizeUser(user),
      token
    };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  _generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  _sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email
    };
  }
}

module.exports = AuthService;
