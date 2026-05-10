import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * Kullanıcının bildirimlerini listele
   * GET /notifications
   */
  @Get()
  async findAll(
    @Query('userId') userId: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
  ) {
    const filter: any = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type) filter.type = type;

    return this.notificationsService.findAll(userId, filter);
  }

  /**
   * Okunmamış bildirim sayısı
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  /**
   * Bildirimi okundu işaretle
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  /**
   * Tüm bildirimleri okundu işaretle
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  async markAllAsRead(@Query('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Bildirim sil
   * DELETE /notifications/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.notificationsService.delete(userId, id);
  }
}