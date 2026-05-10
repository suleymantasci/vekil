import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../auth/prisma.service';

export interface CreateVoteDto {
  meetingId: string;
  title: string;
  description?: string;
  voteType?: 'OPEN' | 'SECRET' | 'BINDING' | 'CONSULTATIVE';
  options: string[];
  closesAt?: Date;
}

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateVoteDto) {
    // Verify meeting belongs to org
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: dto.meetingId, organizationId },
    });
    if (!meeting) throw new NotFoundException('Toplantı bulunamadı.');

    return this.prisma.vote.create({
      data: {
        meetingId: dto.meetingId,
        organizationId: organizationId,
        description: dto.description,
        voteType: dto.voteType || 'OPEN',
        options: dto.options,
        closesAt: dto.closesAt,
        status: 'OPEN',
      },
    });
  }

  async vote(
    organizationId: string,
    voteId: string,
    apartmentId: string,
    userId: string,
    option: string,
  ) {
    const vote = await this.prisma.vote.findFirst({
      where: { id: voteId, status: 'OPEN' },
    });
    if (!vote) throw new NotFoundException('Aktif oylama bulunamadı.');

    // Validate option
    const validOptions = vote.options as string[];
    if (!validOptions.includes(option)) {
      throw new NotFoundException('Geçersiz oy seçeneği.');
    }

    return this.prisma.voteParticipant.upsert({
      where: { voteId_apartmentId: { voteId, apartmentId } },
      create: {
        voteId,
        apartmentId,
        userId,
        option,
        weight: 1,
      },
      update: { option },
    });
  }

  async getResults(organizationId: string, voteId: string) {
    const vote = await this.prisma.vote.findFirst({
      where: { id: voteId, meeting: { organizationId } },
      include: { meeting: true },
    });
    if (!vote) throw new NotFoundException('Oy bulunamadı.');

    const participants = await this.prisma.voteParticipant.findMany({
      where: { voteId },
    });

    const validOptions = vote.options as string[];
    const results: Record<string, number> = {};
    validOptions.forEach((opt) => (results[opt] = 0));
    participants.forEach((p: any) => {
      if (results[p.option] !== undefined) results[p.option] += p.weight;
    });

    return {
      vote: { id: vote.id, title: vote.title, status: vote.status, voteType: vote.voteType },
      results,
      totalVotes: participants.length,
      turnout: participants.length,
    };
  }

  async close(organizationId: string, voteId: string) {
    const vote = await this.prisma.vote.findFirst({
      where: { id: voteId, meeting: { organizationId }, status: 'OPEN' },
    });
    if (!vote) throw new NotFoundException('Kapatılacak oylama bulunamadı.');

    return this.prisma.vote.update({
      where: { id: voteId },
      data: { status: 'CLOSED' },
    });
  }
}
