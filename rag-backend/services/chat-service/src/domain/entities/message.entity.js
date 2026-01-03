class MessageEntity {
    constructor({ id, sessionId, role, content, metadata, feedback, createdAt, updatedAt }) {
        this.id = id;
        this.sessionId = sessionId;
        this.role = role;
        this.content = content;
        this.metadata = metadata || {};
        this.feedback = feedback || null;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }

    addFeedback(rating, comment = null) {
        this.feedback = {
            rating,
            comment,
            createdAt: new Date()
        };
        this.updatedAt = new Date();
    }

    updateFeedback(rating, comment = null) {
        if (this.feedback) {
            this.feedback.rating = rating;
            this.feedback.comment = comment;
            this.updatedAt = new Date();
        } else {
            this.addFeedback(rating, comment);
        }
    }

    addCitation(citation) {
        if (!this.metadata.citations) {
            this.metadata.citations = [];
        }
        this.metadata.citations.push(citation);
    }

    toJSON() {
        return {
            id: this.id,
            sessionId: this.sessionId,
            role: this.role,
            content: this.content,
            metadata: this.metadata,
            feedback: this.feedback,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = MessageEntity;
