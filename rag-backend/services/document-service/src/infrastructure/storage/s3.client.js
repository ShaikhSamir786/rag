const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const storageConfig = require('../../config/storage');
const { logger } = require('@rag-platform/logger');

class S3StorageClient {
  constructor() {
    const config = storageConfig.s3;
    this.client = new S3Client({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      } : undefined,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
    });
    this.bucket = config.bucket;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(filePath, key, metadata = {}) {
    try {
      const fs = require('fs');
      const fileContent = fs.readFileSync(filePath);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileContent,
        Metadata: metadata,
      });

      await this.client.send(command);
      logger.info('File uploaded to S3', { key, bucket: this.bucket });
      return { key, bucket: this.bucket };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Upload buffer to S3
   */
  async uploadBuffer(buffer, key, contentType, metadata = {}) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.client.send(command);
      logger.info('Buffer uploaded to S3', { key, bucket: this.bucket });
      return { key, bucket: this.bucket };
    } catch (error) {
      logger.error('S3 buffer upload error:', error);
      throw new Error(`Failed to upload buffer to S3: ${error.message}`);
    }
  }

  /**
   * Download file from S3
   */
  async downloadFile(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      return response.Body;
    } catch (error) {
      logger.error('S3 download error:', error);
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      logger.info('File deleted from S3', { key, bucket: this.bucket });
      return true;
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL
   */
  async getPresignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('S3 presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }
}

module.exports = S3StorageClient;

