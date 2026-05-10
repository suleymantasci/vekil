import { VotesService, CreateVoteDto } from './votes.service';

describe('VotesService', () => {
  let service: VotesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      vote: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      voteParticipant: { upsert: jest.fn(), findMany: jest.fn() },
      meeting: { findFirst: jest.fn() },
    };
    service = new VotesService(prisma);
  });

  describe('create', () => {
    it('should create a vote attached to a meeting', async () => {
      prisma.meeting.findFirst.mockResolvedValue({ id: 'mtg-1' });
      prisma.vote.create.mockResolvedValue({ id: 'vote-1', title: 'Aidat Artışı', status: 'OPEN' });

      const dto: CreateVoteDto = {
        meetingId: 'mtg-1',
        title: 'Aidat Artışı',
        options: ['Evet', 'Hayır', 'Çekimser'],
      };

      const result = await service.create('org-1', dto);

      expect(result).toEqual({ id: 'vote-1', title: 'Aidat Artışı', status: 'OPEN' });
    });

    it('should throw NotFoundException if meeting not found', async () => {
      prisma.meeting.findFirst.mockResolvedValue(null);

      await expect(service.create('org-1', { meetingId: 'nonexistent', title: 'Test', options: ['A', 'B'] }))
        .rejects.toThrow('Toplantı bulunamadı.');
    });
  });

  describe('vote', () => {
    it('should record a vote for an option', async () => {
      prisma.vote.findFirst.mockResolvedValue({
        id: 'vote-1',
        status: 'OPEN',
        options: ['Evet', 'Hayır', 'Çekimser'],
      });
      prisma.voteParticipant.upsert.mockResolvedValue({ option: 'Evet', weight: 1 });

      const result = await service.vote('org-1', 'vote-1', 'apt-1', 'user-1', 'Evet');

      expect(result).toEqual({ option: 'Evet', weight: 1 });
    });

    it('should throw for invalid option', async () => {
      prisma.vote.findFirst.mockResolvedValue({
        id: 'vote-1',
        status: 'OPEN',
        options: ['Evet', 'Hayır'],
      });

      await expect(service.vote('org-1', 'vote-1', 'apt-1', 'user-1', 'Geçersiz'))
        .rejects.toThrow('Geçersiz oy seçeneği.');
    });

    it('should throw for closed vote', async () => {
      prisma.vote.findFirst.mockResolvedValue(null);

      await expect(service.vote('org-1', 'vote-1', 'apt-1', 'user-1', 'Evet'))
        .rejects.toThrow('Aktif oylama bulunamadı.');
    });
  });

  describe('getResults', () => {
    it('should aggregate vote results', async () => {
      prisma.vote.findFirst.mockResolvedValue({
        id: 'vote-1',
        title: 'Test',
        status: 'OPEN',
        voteType: 'OPEN',
        options: ['Evet', 'Hayır', 'Çekimser'],
      });

      prisma.voteParticipant.findMany.mockResolvedValue([
        { option: 'Evet', weight: 1 },
        { option: 'Evet', weight: 1 },
        { option: 'Hayır', weight: 1 },
        { option: 'Çekimser', weight: 1 },
      ]);

      const result = await service.getResults('org-1', 'vote-1');

      expect(result.results).toEqual({ 'Evet': 2, 'Hayır': 1, 'Çekimser': 1 });
      expect(result.totalVotes).toBe(4);
    });
  });

  describe('close', () => {
    it('should close an open vote', async () => {
      prisma.vote.findFirst.mockResolvedValue({ id: 'vote-1', status: 'OPEN' });
      prisma.vote.update.mockResolvedValue({ id: 'vote-1', status: 'CLOSED' });

      const result = await service.close('org-1', 'vote-1');

      expect(result).toEqual({ id: 'vote-1', status: 'CLOSED' });
    });

    it('should throw for already closed vote', async () => {
      prisma.vote.findFirst.mockResolvedValue(null);

      await expect(service.close('org-1', 'vote-1')).rejects.toThrow('Kapatılacak oylama bulunamadı.');
    });
  });
});
