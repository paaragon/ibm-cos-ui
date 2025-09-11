// Shared types between main and renderer processes

export interface Connection {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  instanceId: string;
  isDefault?: boolean;
}

export interface Bucket {
  name: string;
  creationDate?: string;
  region?: string;
}

export interface ObjectItem {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
  storageClass?: string;
}

export interface ListObjectsParams {
  prefix?: string;
  continuationToken?: string;
  maxKeys?: number;
}

export interface ListObjectsResult {
  objects: ObjectItem[];
  isTruncated: boolean;
  nextContinuationToken?: string;
  commonPrefixes: string[];
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// IPC Channel definitions
export interface CosApi {
  listBuckets: (connection: Connection) => Promise<ApiResult<Bucket[]>>;
  createBucket: (connection: Connection, name: string, region?: string) => Promise<ApiResult<void>>;
  deleteBucket: (connection: Connection, name: string) => Promise<ApiResult<void>>;
  listObjects: (
    connection: Connection,
    bucket: string,
    params?: ListObjectsParams
  ) => Promise<ApiResult<ListObjectsResult>>;
  uploadObject: (
    connection: Connection,
    bucket: string,
    key: string,
    filePath: string
  ) => Promise<ApiResult<void>>;
  downloadObject: (
    connection: Connection,
    bucket: string,
    key: string,
    destinationPath?: string
  ) => Promise<ApiResult<string>>;
  deleteObject: (
    connection: Connection,
    bucket: string,
    key: string
  ) => Promise<ApiResult<void>>;
  renameObject: (
    connection: Connection,
    bucket: string,
    fromKey: string,
    toKey: string
  ) => Promise<ApiResult<void>>;
}

// Global API interface exposed to renderer
declare global {
  interface Window {
    cos: CosApi;
    platform: {
      showSaveDialog: () => Promise<string | null>;
      showOpenDialog: () => Promise<string[] | null>;
    };
  }
}