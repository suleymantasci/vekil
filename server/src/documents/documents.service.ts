import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Allowed file types and their magic bytes
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['%PDF'],
  'image/jpeg': ['FFD8FF'],
  'image/png': ['89504E47'],
  'image/webp': ['52494646'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504B0304'], // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['504B0304'], // .xlsx
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/vekil-uploads';

export interface UploadedFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Validate file magic bytes to prevent extension spoofing
   */
  private validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const signatures: Record<string, string[]> = {
      'application/pdf': ['25504446'],
      'image/jpeg': ['FFD8FF'],
      'image/png': ['89504E470D0A1A0A'],
      'image/webp': ['52494646'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504B0304'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['504B0304'],
    };

    const signaturesToCheck = signatures[mimeType];
    if (!signaturesToCheck) return false;

    const hexBuffer = buffer.toString('hex').toUpperCase();
    return signaturesToCheck.some(sig => hexBuffer.startsWith(sig));
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  private sanitizeFilename(filename: string): string {
    // Remove any path components, keep only basename
    const basename = path.basename(filename);
    // Remove any characters that are not alphanumeric, hyphen, underscore, or dot
    return basename.replace(/[^a-zA-Z0-9\-_.]/g, '');
  }

  /**
   * Save uploaded file to local storage
   * SECURITY: validates magic bytes, prevents path traversal, enforces size limits
   */
  async saveFile(
    file: Express.Multer.File,
    organizationId: string,
    category: string,
  ): Promise<UploadedFile> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`Dosya boyutu ${MAX_FILE_SIZE / 1024 / 1024}MB'ı aşamaz`);
    }

    // Validate MIME type
    const allowedTypes = Object.keys(ALLOWED_MIME_TYPES);
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('İzin verilmeyen dosya türü');
    }

    // Validate magic bytes (signature)
    const buffer = file.buffer;
    if (!this.validateMagicBytes(buffer, file.mimetype)) {
      throw new BadRequestException('Dosya içeriği türü ile eşleşmiyor');
    }

    // Generate unique filename and sanitize
    const ext = path.extname(file.originalname).toLowerCase();
    const storedName = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, organizationId, category);

    // Ensure directory exists
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    // Full path with filename
    const fullPath = path.join(filePath, storedName);

    // Write file
    await fs.promises.writeFile(fullPath, buffer);

    // Return file info
    const stat = await fs.promises.stat(fullPath);
    return {
      id: uuidv4(),
      originalName: this.sanitizeFilename(file.originalname),
      storedName,
      mimeType: file.mimetype,
      size: stat.size,
      url: `/files/${organizationId}/${category}/${storedName}`,
    };
  }

  /**
   * Create document record in database
   */
  async create(organizationId: string, dto: {
    name: string;
    category: string;
    mimeType: string;
    size: number;
    storedPath: string;
    originalName: string;
    buildingId?: string;
  }) {
    return this.prisma.document.create({
      data: {
        organizationId,
        name: dto.name,
        category: dto.category,
        mimeType: dto.mimeType,
        size: dto.size,
        storedPath: dto.storedPath,
        originalName: dto.originalName,
        buildingId: dto.buildingId || null,
      },
    });
  }

  /**
   * List documents for organization
   */
  async findAll(organizationId: string, filter?: {
    category?: string;
    buildingId?: string;
  }) {
    const where: any = { organizationId };

    if (filter?.category) {
      where.category = filter.category;
    }
    if (filter?.buildingId) {
      where.buildingId = filter.buildingId;
    }

    return this.prisma.document.findMany({
      where,
      include: {
        building: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single document
   */
  async findOne(organizationId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, organizationId },
      include: {
        building: { select: { id: true, name: true } },
      },
    });

    if (!document) {
      throw new NotFoundException('Döküman bulunamadı');
    }

    return document;
  }

  /**
   * Delete document (and file)
   */
  async delete(organizationId: string, id: string) {
    const document = await this.findOne(organizationId, id);

    // Delete physical file
    try {
      if (fs.existsSync(document.storedPath)) {
        await fs.promises.unlink(document.storedPath);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    // Delete database record
    await this.prisma.document.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Get file stream for download
   * SECURITY: checks ownership before serving
   */
  async getFileStream(organizationId: string, id: string): Promise<{ stream: fs.ReadStream; document: any }> {
    const document = await this.findOne(organizationId, id);

    if (!fs.existsSync(document.storedPath)) {
      throw new NotFoundException('Dosya bulunamadı');
    }

    const stream = fs.createReadStream(document.storedPath);
    return { stream, document };
  }

  /**
   * Get document categories with counts
   */
  async getCategories(organizationId: string) {
    const result = await this.prisma.document.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: true,
    });

    return result.map((r: { category: string; _count: number }) => ({
      category: r.category,
      count: r._count,
    }));
  }
}