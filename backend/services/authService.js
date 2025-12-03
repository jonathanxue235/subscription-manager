/**
 * authentication services which does all authentication business login. information hiding: hides password hashing, jwt token generation, validation rules, does not know about database implementation and http requests/responses
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class AuthService {
  constructor(userRepository, jwtSecret) {
    this.userRepo = userRepository;
    this.jwtSecret = jwtSecret;
  }

  async register(email, password, additionalData = {}) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use provided username or generate from email (part before @)
    const username = additionalData.username || email.split("@")[0];

    const user = await this.userRepo.create({
      email: email,
      password: hashedPassword,
      username: username,
      monthly_budget: additionalData.monthly_budget || null,
      location: additionalData.location || null,
      primary_curr: additionalData.primary_curr || "USD",
      created_at: new Date().toISOString(),
    });

    const token = this._generateToken(user);

    return {
      user: this._sanitizeUser(user),
      token,
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    const token = this._generateToken(user);

    return {
      user: this._sanitizeUser(user),
      token,
    };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch {
      throw new Error("Invalid or expired token");
    }
  }

  async updateProfile(userId, updates) {
    const allowedFields = ['username', 'monthly_budget', 'location', 'primary_curr'];
    const filteredUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error("No valid fields to update");
    }

    const updatedUser = await this.userRepo.update(userId, filteredUpdates);
    return this._sanitizeUser(updatedUser);
  }

  _generateToken(user) {
    return jwt.sign({ userId: user.id, email: user.email }, this.jwtSecret, {
      expiresIn: "24h",
    });
  }

  _sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      monthly_budget: user.monthly_budget || 0,
      location: user.location || null,
      primary_curr: user.primary_curr || "USD",
      created_at: user.created_at,
    };
  }
}

module.exports = AuthService;
