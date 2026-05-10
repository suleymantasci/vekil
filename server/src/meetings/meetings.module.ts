import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { VotesService } from '../votes/votes.service';
import { VotesController } from '../votes/votes.controller';
import { PrismaModule } from '../auth/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MeetingsController, VotesController],
  providers: [MeetingsService, VotesService],
  exports: [MeetingsService, VotesService],
})
export class MeetingsModule {}
