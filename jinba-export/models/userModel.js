const db = require('../database/connection');
const bcrypt = require('bcryptjs');

const userModel = {
    findByUsername(username) {
        return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    },

    verifyPassword(user, password) {
        return bcrypt.compareSync(password, user.password_hash);
    },

    changePassword(username, oldPassword, newPassword) {
        const user = this.findByUsername(username);
        if (!user) return { success: false, message: 'User not found' };
        if (!this.verifyPassword(user, oldPassword)) return { success: false, message: 'Wrong old password' };

        const hash = bcrypt.hashSync(newPassword, 10);
        db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?')
            .run(hash, username);
        return { success: true };
    },

    updateCredentials(oldUsername, newUsername, newPassword) {
        const user = this.findByUsername(oldUsername);
        if (!user) return { success: false };

        const hash = bcrypt.hashSync(newPassword, 10);
        db.prepare('UPDATE users SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(newUsername, hash, user.id);
        return { success: true };
    }
};

module.exports = userModel;
