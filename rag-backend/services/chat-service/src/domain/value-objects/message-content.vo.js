class MessageContent {
    constructor(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Message content must be a non-empty string');
        }

        if (content.trim().length === 0) {
            throw new Error('Message content cannot be empty');
        }

        this.value = content.trim();
    }

    get length() {
        return this.value.length;
    }

    truncate(maxLength) {
        if (this.value.length <= maxLength) {
            return this.value;
        }
        return this.value.substring(0, maxLength) + '...';
    }

    toString() {
        return this.value;
    }

    toJSON() {
        return this.value;
    }
}

module.exports = MessageContent;
