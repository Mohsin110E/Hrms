import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createWriteStream,
  createReadStream,
  promises as fsPromises,
  existsSync,
} from 'fs';
import { join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { Readable } from 'stream';

const pipelineAsync = promisify(pipeline);

export interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StoredFileResult {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

@Injectable()
export class FileStorageService {
  private readonly basePath: string;

  constructor(config: ConfigService) {
    this.basePath = config.get<string>('app.storage.documentsPath') ?? './private-storage/documents';
    if (!existsSync(this.basePath)) {
      fsPromises.mkdir(this.basePath, { recursive: true }).catch(() => {
        // Ignore; runtime will fail clearly on write.
      });
    }
  }

  private filePath(storageKey: string): string {
    return join(this.basePath, storageKey);
  }

  async saveFile(
    file: UploadedFileLike,
  ): Promise<StoredFileResult> {
    const originalName = file.originalname;
    const mimeType = file.mimetype || 'application/octet-stream';
    const storageKey = randomUUID();
    const targetPath = this.filePath(storageKey);

    const sha256 = createHash('sha256').update(file.buffer).digest('hex');

    await fsPromises.writeFile(targetPath, file.buffer);

    return {
      storageKey,
      originalName,
      mimeType,
      sizeBytes: file.size,
      sha256,
    };
  }

  async saveStream(
    stream: Readable,
    originalName: string,
    mimeType: string,
  ): Promise<StoredFileResult> {
    const storageKey = randomUUID();
    const targetPath = this.filePath(storageKey);
    const hash = createHash('sha256');

    await fsPromises.mkdir(this.basePath, { recursive: true });

    const out = createWriteStream(targetPath);
    stream.on('data', (chunk) => hash.update(chunk));

    await pipelineAsync(stream, out);

    const stats = await fsPromises.stat(targetPath);

    return {
      storageKey,
      originalName,
      mimeType: mimeType || 'application/octet-stream',
      sizeBytes: stats.size,
      sha256: hash.digest('hex'),
    };
  }

  readFile(storageKey: string) {
    const path = this.filePath(storageKey);
    if (!existsSync(path)) {
      throw new Error('File not found');
    }
    return createReadStream(path);
  }

  async deleteFile(storageKey: string): Promise<void> {
    const path = this.filePath(storageKey);
    if (existsSync(path)) {
      await fsPromises.unlink(path);
    }
  }

  async fileExists(storageKey: string): Promise<boolean> {
    return existsSync(this.filePath(storageKey));
  }
}
