import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { VotesService } from './votes.service';
import { GetCurrentUser } from '../common/decorators/current-user.decorator';

@Controller('votes')
export class VotesController {
  constructor(private readonly service: VotesService) {}

  @Post()
  create(@GetCurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.organizationId, dto);
  }

  @Post(':id/vote')
  vote(
    @GetCurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { apartmentId: string; option: string },
  ) {
    return this.service.vote(user.organizationId, id, dto.apartmentId, user.id, dto.option);
  }

  @Get(':id/results')
  getResults(@GetCurrentUser() user: any, @Param('id') id: string) {
    return this.service.getResults(user.organizationId, id);
  }

  @Put(':id/close')
  close(@GetCurrentUser() user: any, @Param('id') id: string) {
    return this.service.close(user.organizationId, id);
  }
}
