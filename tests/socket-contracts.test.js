import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as Client } from 'socket.io-client';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Socket.IO Contract Tests', () => {
    let serverProcess;
    let clientSocket;
    const TEST_PORT = 3333;
    const SERVER_URL = `http://localhost:${TEST_PORT}`;

    beforeAll(async () => {
        // Start backend server
        return new Promise((resolve, reject) => {
            const serverPath = path.join(__dirname, '..', 'server', 'index.js');
            serverProcess = spawn('node', [serverPath], {
                stdio: 'pipe',
                env: { ...process.env, NODE_ENV: 'test', PORT: TEST_PORT }
            });

            serverProcess.stdout.on('data', (data) => {
                console.log(`[Server] ${data.toString().trim()}`);
                if (data.toString().includes('Server running')) {
                    resolve();
                }
            });

            serverProcess.stderr.on('data', (data) => {
                console.error(`[Server Error] ${data.toString()}`);
            });

            // Timeout after 5 seconds
            setTimeout(() => resolve(), 5000);
        });
    }, 15000);

    afterAll(() => {
        if (clientSocket) {
            clientSocket.disconnect();
        }
        if (serverProcess) {
            serverProcess.kill();
        }
    });

    describe('Connection Tests', () => {
        it('should connect to server', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            clientSocket.on('connect', () => {
                expect(clientSocket.connected).toBe(true);
                done();
            });

            clientSocket.on('connect_error', (error) => {
                done(error);
            });
        });

        it('should receive tournament-state after connection', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            clientSocket.on('tournament-state', (state) => {
                expect(state).toBeDefined();
                expect(state.groups).toBeDefined();
                expect(state.quarterFinals).toBeDefined();
                expect(state.semiFinals).toBeDefined();
                expect(state.final).toBeDefined();
                done();
            });

            clientSocket.on('connect_error', (error) => {
                done(error);
            });
        });
    });

    describe('Auth Contract Tests', () => {
        it('should register new user', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            const testUser = `test_${Date.now()}`;
            const testPass = 'test123';

            clientSocket.on('connect', () => {
                clientSocket.emit('register', { username: testUser, password: testPass }, (response) => {
                    expect(response).toBeDefined();
                    expect(response.success).toBe(true);
                    expect(response.username).toBe(testUser);
                    expect(response.bottles).toBe(20);
                    expect(response.isAdmin).toBe(false);
                    done();
                });
            });
        });

        it('should not register duplicate user', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            const testUser = 'duplicate_test';
            const testPass = 'test123';

            clientSocket.on('connect', () => {
                // First registration
                clientSocket.emit('register', { username: testUser, password: testPass }, (response1) => {
                    expect(response1.success).toBe(true);

                    // Try to register again
                    clientSocket.emit('register', { username: testUser, password: testPass }, (response2) => {
                        expect(response2.success).toBe(false);
                        expect(response2.message).toContain('існує');
                        done();
                    });
                });
            });
        });

        it('should login with correct credentials', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            const testUser = `login_test_${Date.now()}`;
            const testPass = 'test123';

            clientSocket.on('connect', () => {
                // Register first
                clientSocket.emit('register', { username: testUser, password: testPass }, (regResponse) => {
                    expect(regResponse.success).toBe(true);

                    // Disconnect and reconnect
                    clientSocket.disconnect();

                    const newSocket = Client(SERVER_URL, {
                        transports: ['websocket'],
                        forceNew: true
                    });

                    newSocket.on('connect', () => {
                        newSocket.emit('login', { username: testUser, password: testPass }, (loginResponse) => {
                            expect(loginResponse.success).toBe(true);
                            expect(loginResponse.username).toBe(testUser);
                            expect(loginResponse.bottles).toBe(20);
                            newSocket.disconnect();
                            done();
                        });
                    });
                });
            });
        });

        it('should not login with wrong password', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            const testUser = `wrong_pass_test_${Date.now()}`;
            const testPass = 'correct123';
            const wrongPass = 'wrong123';

            clientSocket.on('connect', () => {
                // Register first
                clientSocket.emit('register', { username: testUser, password: testPass }, () => {
                    // Try login with wrong password
                    clientSocket.emit('login', { username: testUser, password: wrongPass }, (response) => {
                        expect(response.success).toBe(false);
                        expect(response.message).toBeDefined();
                        done();
                    });
                });
            });
        });

        it('should login as admin with correct credentials', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('login', { username: 'admin', password: 'Whitepower1488' }, (response) => {
                    expect(response.success).toBe(true);
                    expect(response.isAdmin).toBe(true);
                    expect(response.username).toBe('admin');
                    done();
                });
            });
        });
    });

    describe('Tournament State Contract Tests', () => {
        it('tournament state should have correct structure', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            clientSocket.on('tournament-state', (state) => {
                // Check groups
                expect(state.groups).toBeDefined();
                expect(Object.keys(state.groups)).toHaveLength(4);
                expect(state.groups.A).toBeDefined();
                expect(state.groups.A.players).toHaveLength(3);

                // Check playoff rounds
                expect(state.quarterFinals).toHaveLength(4);
                expect(state.semiFinals).toHaveLength(2);
                expect(state.final).toBeDefined();
                expect(state.currentRound).toBeDefined();

                done();
            });
        });
    });

    describe('Betting Contract Tests', () => {
        it('should place bet successfully', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            const testUser = `bet_test_${Date.now()}`;
            const testPass = 'test123';

            clientSocket.on('connect', () => {
                clientSocket.emit('register', { username: testUser, password: testPass }, (regResponse) => {
                    expect(regResponse.success).toBe(true);

                    // Place bet on first player
                    const playerName = 'Черняк Юрій';
                    const betAmount = 5;

                    clientSocket.emit('place-bet', { playerName, amount: betAmount }, (betResponse) => {
                        expect(betResponse).toBeDefined();
                        expect(betResponse.success).toBe(true);
                        expect(betResponse.newBalance).toBe(20 - betAmount);
                        done();
                    });
                });
            });
        });

        it('should not allow bet more than balance', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            const testUser = `overbet_test_${Date.now()}`;
            const testPass = 'test123';

            clientSocket.on('connect', () => {
                clientSocket.emit('register', { username: testUser, password: testPass }, () => {
                    clientSocket.emit('place-bet', { playerName: 'Черняк Юрій', amount: 25 }, (response) => {
                        expect(response.success).toBe(false);
                        expect(response.message).toContain('коштів');
                        done();
                    });
                });
            });
        });

        it('should not allow bet more than 10 bottles', (done) => {
            clientSocket = Client(SERVER_URL, {
                transports: ['websocket'],
                forceNew: true
            });

            const testUser = `maxbet_test_${Date.now()}`;
            const testPass = 'test123';

            clientSocket.on('connect', () => {
                clientSocket.emit('register', { username: testUser, password: testPass }, () => {
                    clientSocket.emit('place-bet', { playerName: 'Черняк Юрій', amount: 11 }, (response) => {
                        expect(response.success).toBe(false);
                        expect(response.message).toContain('10');
                        done();
                    });
                });
            });
        });
    });
});
