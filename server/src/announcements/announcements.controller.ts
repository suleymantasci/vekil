import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  /**
   * Duyuru oluştur
   * POST /announcements
   */
  @Post()
  async create(@Body() dto: any) {
    return this.announcementsService.create(dto);
  }

  /**
   * Tüm duyuruları listele
   * GET /announcements?organizationId=xxx&buildingId=xxx
   */
  @Get()
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('buildingId') buildingId?: string,
    @Query('type') type?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const filter: any = {};
    if (buildingId) filter.buildingId = buildingId;
    if (type) filter.type = type;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    return this.announcementsService.findAll(organizationId, filter);
  }

  /**
   * Aktif duyuruları getir
   * GET /announcements/active?organizationId=xxx
   */
  @Get('active')
  async getActive(
    @Query('organizationId') organizationId: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.announcementsService.getActive(organizationId, buildingId);
  }

  /**
   * Tek duyuru getir
   * GET /announcements/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.announcementsService.findOne(organizationId, id);
  }

  /**
   * Duyuru güncelle
   * PATCH /announcements/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() data: any,
  ) {
    return this.announcementsService.update(organizationId, id, data);
  }

  /**
   * Duyuru yayınla
   * PATCH /announcements/:id/publish
   */
  @Patch(':id/publish')
  async publish(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.announcementsService.publish(organizationId, id);
  }

  /**
   * Duyuru sil
   * DELETE /announcements/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.announcementsService.delete(organizationId, id);
  }
}