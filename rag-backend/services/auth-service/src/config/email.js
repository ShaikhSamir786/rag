module.exports = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    },
    from: {
        email: process.env.SMTP_FROM_EMAIL || 'noreply@rag-platform.com',
        name: process.env.SMTP_FROM_NAME || 'RAG Platform'
    }
};

