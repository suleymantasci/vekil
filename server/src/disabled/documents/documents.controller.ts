import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

// Custom storage to sanitize filenames
const storage = diskStorage({
  destination: '/tmp/vekil-uploads',
  filename: (req, file, cb) => {
    // Sanitize filename - remove path components
    const basename = path.basename(file.originalname);
    const sanitized = basename.replace(/[^a-zA-Z0-9\-_.]/g, '');
    const ext = path.extname(sanitized).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  /**
   * Upload document
   * POST /documents/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(pdf|jpeg|jpg|png|webp|docx|xlsx)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('organizationId') organizationId: string,
    @Body('category') category: string,
    @Body('name') name: string,
    @Body('buildingId') buildingId?: string,
  ) {
    // Save file
    const fileInfo = await this.documentsService.saveFile(
      file,
      organizationId,
      category,
    );

    // Create database record
    const document = await this.documentsService.create(organizationId, {
      name,
      category,
      mimeType: file.mimetype,
      size: file.size,
      storedPath: `/tmp/vekil-uploads/${organizationId}/${category}/${fileInfo.storedName}`,
      originalName: file.originalname,
      buildingId,
    });

    return { ...fileInfo, document };
  }

  /**
   * List documents
   * GET /documents?organizationId=xxx&category=xxx
   */
  @Get()
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('category') category?: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.documentsService.findAll(organizationId, { category, buildingId });
  }

  /**
   * Get document details
   * GET /documents/:id?organizationId=xxx
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.documentsService.findOne(organizationId, id);
  }

  /**
   * Get file for download
   * GET /documents/:id/download?organizationId=xxx
   */
  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    const { stream, document } = await this.documentsService.getFileStream(organizationId, id);
    return { stream, document };
  }

  /**
   * Delete document
   * DELETE /documents/:id?organizationId=xxx
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.documentsService.delete(organizationId, id);
  }

  /**
   * Get categories with counts
   * GET /documents/categories?organizationId=xxx
   */
  @Get('categories/list')
  async getCategories(@Query('organizationId') organizationId: string) {
    return this.documentsService.getCategories(organizationId);
  }
}