const sessionService = require('../../../src/core/services/session.service');
const sessionRepository = require('../../../src/core/repositories/session.repository');

jest.mock('../../../src/core/repositories/session.repository');

describe('SessionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createSession', () => {
        it('should create a new session', async () => {
            const mockSession = {
                id: '123',
                userId: 'user1',
                title: 'Test Chat',
                metadata: {},
                isActive: true
            };

            sessionRepository.create.mockResolvedValue(mockSession);

            const result = await sessionService.createSession({
                userId: 'user1',
                title: 'Test Chat'
            });

            expect(result).toEqual(mockSession);
            expect(sessionRepository.create).toHaveBeenCalled();
        });
    });

    describe('getSession', () => {
        it('should get a session by ID', async () => {
            const mockSession = {
                id: '123',
                userId: 'user1',
                title: 'Test Chat'
            };

            sessionRepository.findById.mockResolvedValue(mockSession);

            const result = await sessionService.getSession('123');

            expect(result).toEqual(mockSession);
            expect(sessionRepository.findById).toHaveBeenCalledWith('123');
        });

        it('should throw error if session not found', async () => {
            sessionRepository.findById.mockResolvedValue(null);

            await expect(sessionService.getSession('123')).rejects.toThrow('Session not found');
        });
    });
});
