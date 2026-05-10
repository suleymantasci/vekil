import { MeetingsService, CreateMeetingDto } from './meetings.service';

describe('MeetingsService', () => {
  let service: MeetingsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      meeting: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      meetingAttendance: { create: jest.fn(), upsert: jest.fn() },
    };
    service = new MeetingsService(prisma);
  });

  describe('create', () => {
    it('should create a meeting', async () => {
      const dto: CreateMeetingDto = {
        buildingId: 'bld-1',
        title: '2026 Olağan Genel Kurul',
        meetingDate: new Date('2026-06-15T14:00:00'),
        location: 'Site Yönetim Ofisi',
      };

      prisma.meeting.create.mockResolvedValue({ id: 'mtg-1', status: 'DRAFT', ...dto });

      const result = await service.create('org-1', dto);

      expect(result).toHaveProperty('id', 'mtg-1');
      expect(prisma.meeting.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ title: '2026 Olağan Genel Kurul', status: 'DRAFT' }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return meetings for organization', async () => {
      const mockMeetings = [
        { id: 'mtg-1', title: 'Toplantı 1', status: 'SCHEDULED' },
        { id: 'mtg-2', title: 'Toplantı 2', status: 'DRAFT' },
      ];

      prisma.meeting.findMany.mockResolvedValue(mockMeetings);

      const result = await service.findAll('org-1');

      expect(result).toEqual(mockMeetings);
    });
  });

  describe('recordAttendance', () => {
    it('should upsert attendance record', async () => {
      prisma.meeting.findFirst.mockResolvedValue({ id: 'mtg-1' });
      prisma.meetingAttendance.upsert.mockResolvedValue({ meetingId: 'mtg-1', apartmentId: 'apt-1', present: true });

      const result = await service.recordAttendance('org-1', 'mtg-1', { apartmentId: 'apt-1', present: true });

      expect(result.present).toBe(true);
      expect(prisma.meetingAttendance.upsert).toHaveBeenCalledWith({
        where: { meetingId_apartmentId: { meetingId: 'mtg-1', apartmentId: 'apt-1' } },
        create: expect.objectContaining({ present: true }),
        update: { present: true },
      });
    });
  });
});
