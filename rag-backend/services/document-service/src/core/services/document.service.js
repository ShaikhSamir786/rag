const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { QueueManager } = require('@rag-platform/queue');
const { Document } = require('../../domain/models/document.model');

class DocumentService {
    constructor() {
        this.s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
        this.bucket = process.env.S3_BUCKET || 'rag-documents';
        this.queue = QueueManager.getInstance().createQueue('document-processing');
    }

    async upload(file, userId, tenantId) {
        const key = \`\${tenantId}/\${userId}/\${Date.now()}-\${file.originalname}\`;
    
    // Upload to S3
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    // Save to DB
    const document = await Document.create({
      tenantId,
      userId,
      filename: file.originalname,
      s3Key: key,
      status: 'pending'
    });

    // Add to processing queue
    await this.queue.add('process', {
      documentId: document.id,
      tenantId,
      s3Key: key
    });

    return document;
  }
}

module.exports = { DocumentService };
