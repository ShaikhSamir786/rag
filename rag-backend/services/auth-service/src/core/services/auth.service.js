const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../domain/models/user.model');
const { BaseError, ErrorCode } = require('@rag-platform/common');

class AuthService {
    async login(email, password, tenantId) {
        const user = await User.findOne({ where: { email, tenantId } });

        if (!user) {
            throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid credentials', 401);
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new BaseError(ErrorCode.UNAUTHORIZED, 'Invalid credentials', 401);
        }

        const token = this.generateToken(user);
        return { user, token };
    }

    async register(userData, tenantId) {
        const existing = await User.findOne({ where: { email: userData.email, tenantId } });
        if (existing) {
            throw new BaseError(ErrorCode.VALIDATION_ERROR, 'User already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
            ...userData,
            password: hashedPassword,
            tenantId
        });

        const token = this.generateToken(user);
        return { user, token };
    }

    generateToken(user) {
        return jwt.sign(
            { id: user.id, tenantId: user.tenantId, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );
    }
}

module.exports = { AuthService };
