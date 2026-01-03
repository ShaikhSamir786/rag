class SessionEntity {
    constructor({ id, userId, title, metadata, isActive, lastMessageAt, createdAt, updatedAt }) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.metadata = metadata || {};
        this.isActive = isActive !== undefined ? isActive : true;
        this.lastMessageAt = lastMessageAt || new Date();
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }

    updateTitle(newTitle) {
        this.title = newTitle;
        this.updatedAt = new Date();
    }

    updateLastMessageTime() {
        this.lastMessageAt = new Date();
        this.updatedAt = new Date();
    }

    archive() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    restore() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            metadata: this.metadata,
            isActive: this.isActive,
            lastMessageAt: this.lastMessageAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = SessionEntity;
