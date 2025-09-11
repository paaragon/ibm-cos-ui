import * as AWS from 'ibm-cos-sdk';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import type { 
  Connection, 
  Bucket, 
  ObjectItem, 
  ListObjectsParams, 
  ListObjectsResult, 
  ApiResult 
} from '../shared/types';

export class CosService {
  private createS3Client(connection: Connection): AWS.S3 {
    const config = {
      endpoint: connection.endpoint,
      apiKeyId: connection.apiKey,
      serviceInstanceId: connection.instanceId,
      signatureVersion: 'iam' as const,
    };

    return new AWS.S3(config);
  }

  private handleError(error: unknown): string {
    console.error('COS Service Error:', error);
    
    if (error instanceof Error) {
      // Handle specific AWS errors
      const awsError = error as AWS.AWSError;
      
      switch (awsError.code) {
        case 'NoSuchBucket':
          return 'Bucket not found';
        case 'BucketAlreadyExists':
          return 'Bucket already exists';
        case 'BucketNotEmpty':
          return 'Cannot delete non-empty bucket';
        case 'NoSuchKey':
          return 'Object not found';
        case 'AccessDenied':
          return 'Access denied - check your credentials and permissions';
        case 'InvalidAccessKeyId':
          return 'Invalid API key';
        case 'SignatureDoesNotMatch':
          return 'Invalid credentials';
        case 'NetworkingError':
          return 'Network error - check your endpoint and internet connection';
        default:
          return awsError.message || 'Unknown error occurred';
      }
    }
    
    return 'An unexpected error occurred';
  }

  async listBuckets(connection: Connection): Promise<ApiResult<Bucket[]>> {
    try {
      const s3 = this.createS3Client(connection);
      const result = await s3.listBuckets().promise();
      
      const buckets: Bucket[] = (result.Buckets || []).map(bucket => ({
        name: bucket.Name || '',
        ...(bucket.CreationDate && { creationDate: bucket.CreationDate.toISOString() }),
      }));

      return { ok: true, data: buckets };
    } catch (error) {
      return { ok: false, error: this.handleError(error) };
    }
  }

  async createBucket(connection: Connection, name: string, region = 'us-standard'): Promise<ApiResult<void>> {
    try {
      const s3 = this.createS3Client(connection);
      
      const params: AWS.S3.CreateBucketRequest = {
        Bucket: name,
      };
      
      // Add LocationConstraint if not us-standard
      if (region !== 'us-standard') {
        params.CreateBucketConfiguration = {
          LocationConstraint: region,
        };
      }

      await s3.createBucket(params).promise();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: this.handleError(error) };
    }
  }

  async deleteBucket(connection: Connection, name: string): Promise<ApiResult<void>> {
    try {
      const s3 = this.createS3Client(connection);
      await s3.deleteBucket({ Bucket: name }).promise();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: this.handleError(error) };
    }
  }

  async listObjects(
    connection: Connection, 
    bucket: string, 
    params?: ListObjectsParams
  ): Promise<ApiResult<ListObjectsResult>> {
    try {
      const s3 = this.createS3Client(connection);
      
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: bucket,
        Delimiter: '/',
        ...(params?.prefix && { Prefix: params.prefix }),
        ...(params?.continuationToken && { ContinuationToken: params.continuationToken }),
        ...(params?.maxKeys && { MaxKeys: params.maxKeys }),
      };

      const result = await s3.listObjectsV2(listParams).promise();
      
      const objects: ObjectItem[] = (result.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified?.toISOString() || '',
        etag: obj.ETag || '',
        ...(obj.StorageClass && { storageClass: obj.StorageClass }),
      }));

      const commonPrefixes = (result.CommonPrefixes || []).map(prefix => prefix.Prefix || '');

      return {
        ok: true,
        data: {
          objects,
          isTruncated: result.IsTruncated || false,
          ...(result.NextContinuationToken && { nextContinuationToken: result.NextContinuationToken }),
          commonPrefixes,
        },
      };
    } catch (error) {
      return { ok: false, error: this.handleError(error) };
    }
  }

  async uploadObject(
    connection: Connection, 
    bucket: string, 
    key: string, 
    filePath: string
  ): Promise<ApiResult<void>> {
    try {
      const s3 = this.createS3Client(connection);
      
      // Read file stats to get size
      const stats = await fs.stat(filePath);
      const fileStream = createReadStream(filePath);

      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentLength: stats.size,
      };

      await s3.upload(uploadParams).promise();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: this.handleError(error) };
    }
  }

  async downloadObject(
    connection: Connection, 
    bucket: string, 
    key: string, 
    destinationPath?: string
  ): Promise<ApiResult<string>> {
    try {
      const s3 = this.createS3Client(connection);
      
      const getParams: AWS.S3.GetObjectRequest = {
        Bucket: bucket,
        Key: key,
      };

      const result = await s3.getObject(getParams).promise();
      
      if (!result.Body) {
        return { ok: false, error: 'No data received from object' };
      }

      // If no destination path provided, return the data as base64
      if (!destinationPath) {
        const buffer = result.Body as Buffer;
        const base64Data = buffer.toString('base64');
        return { ok: true, data: base64Data };
      }

      // Write to file
      await fs.writeFile(destinationPath, result.Body as Buffer);
      return { ok: true, data: destinationPath };
    } catch (error) {
      return { ok: false, error: this.handleError(error) };
    }
  }

  async deleteObject(
    connection: Connection, 
    bucket: string, 
    key: string
  ): Promise<ApiResult<void>> {
    try {
      const s3 = this.createS3Client(connection);
      
      await s3.deleteObject({
        Bucket: bucket,
        Key: key,
      }).promise();

      return { ok: true };
    } catch (error) {
      return { ok: false, error: this.handleError(error) };
    }
  }

  async renameObject(
    connection: Connection, 
    bucket: string, 
    fromKey: string, 
    toKey: string
  ): Promise<ApiResult<void>> {
    try {
      const s3 = this.createS3Client(connection);
      
      // Copy object to new key
      await s3.copyObject({
        Bucket: bucket,
        CopySource: `${bucket}/${fromKey}`,
        Key: toKey,
      }).promise();

      // Delete original object
      await s3.deleteObject({
        Bucket: bucket,
        Key: fromKey,
      }).promise();

      return { ok: true };
    } catch (error) {
      return { ok: false, error: this.handleError(error) };
    }
  }
}