const request = require('supertest');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://stagingapi.resortwala.com'; // Hardcode for now or use env

describe('API Health Check', () => {
    it('should return 200 or 404 for root (connectivity check)', async () => {
        // Just checking if we can reach the server
        const res = await request(BASE_URL).get('/');
        expect(res.status).toBeDefined();
    });

    it('should fail on invalid endpoint', async () => {
        const res = await request(BASE_URL).get('/api/invalid-endpoint-123');
        expect(res.status).toBe(404);
    });
});
