import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;
const server = createServer();
const wss = new WebSocketServer({ server });

// Game state
let rooms = new Map(); // roomId -> Room object
let players = new Map(); // playerId -> Player object
let roomIdCounter = 1;

class Player {
    constructor(ws, playerData) {
        this.id = generatePlayerId();
        this.ws = ws;
        this.name = playerData.med_name || 'Unknown Player';
        this.data = playerData;
        this.roomId = null;
        this.isReady = false;
        this.isAlive = true;
        this.hp = this.calculateHP(playerData.streak || 0);
        this.maxHp = this.hp;
        this.attack = this.calculateAttack(playerData.streak || 0);
        this.wins = 0;
    }

    calculateHP(streakDays) {
        const streakMonths = streakDays / 30;
        if (streakMonths < 3) return Math.floor(Math.random() * 151) + 50;
        else if (streakMonths < 6) return Math.floor(Math.random() * 301) + 200;
        else return Math.floor(Math.random() * 501) + 500;
    }

    calculateAttack(streakDays) {
        const streakMonths = streakDays / 30;
        if (streakMonths < 2) return 10;
        else if (streakMonths < 4) return Math.floor(Math.random() * 41) + 30;
        else if (streakMonths < 8) return Math.floor(Math.random() * 31) + 70;
        else if (streakMonths < 12) return Math.floor(Math.random() * 51) + 100;
        else return 175;
    }

    send(message) {
        if (this.ws.readyState === this.ws.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    reset() {
        this.isReady = false;
        this.isAlive = true;
        this.hp = this.maxHp;
    }
}

class Room {
    constructor(id, name, creator) {
        this.id = id;
        this.name = name;
        this.creator = creator;
        this.players = [];
        this.status = 'waiting'; // waiting, starting, playing, finished
        this.currentRound = 1;
        this.maxRounds = 3;
        this.roundWinners = [];
        this.gameStartTime = null;
        this.lastActivity = Date.now();
    }

    addPlayer(player) {
        if (this.players.length >= 4) return false;
        
        this.players.push(player);
        player.roomId = this.id;
        this.lastActivity = Date.now();
        
        // Auto-start game when 1 player joins (for testing)
        if (this.players.length === 1 && this.status === 'waiting') {
            console.log(`🎮 1 player joined! Auto-starting game in room: ${this.name}`);
            setTimeout(() => {
                this.startGame();
            }, 3000); // Give time for client to fully connect
        }
        
        return true;
    }

    removePlayer(player) {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.players.splice(index, 1);
            player.roomId = null;
            player.reset();
            
            // If room is empty, it will be cleaned up later
            if (this.players.length === 0) {
                this.status = 'finished';
            }
            
            this.lastActivity = Date.now();
            return true;
        }
        return false;
    }

    canStart() {
        return this.players.length >= 1 && this.players.length <= 4 && this.status === 'waiting';
    }

    startGame() {
        if (!this.canStart()) return false;
        
        this.status = 'starting';
        this.gameStartTime = Date.now();
        
        // Reset all players
        this.players.forEach(player => player.reset());
        
        // Start 5-second countdown
        this.startCountdown();
        return true;
    }

    startCountdown() {
        let count = 5;
        
        const countdownInterval = setInterval(() => {
            this.broadcast({
                type: 'game_starting',
                countdown: count,
                room: this.getPublicData()
            });
            
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                this.status = 'playing';
                this.currentRound = 1;
                
                this.broadcast({
                    type: 'game_started',
                    roomId: this.id,
                    players: this.players.map(p => ({
                        id: p.id,
                        name: p.name,
                        hp: p.hp,
                        maxHp: p.maxHp,
                        attack: p.attack,
                        features: [p.data.feature_1, p.data.feature_2, p.data.feature_3],
                        sprite_url: p.data.sprite_url
                    })),
                    round: this.currentRound,
                    maxRounds: this.maxRounds
                });
            }
        }, 1000);
    }

    handlePlayerAction(playerId, action) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.isAlive || this.status !== 'playing') return;

        // Broadcast player action to all players in room
        this.broadcast({
            type: 'player_action',
            playerId: playerId,
            action: action,
            timestamp: Date.now()
        });
    }

    handlePlayerDamage(playerId, damage, attackerId) {
        const player = this.players.find(p => p.id === playerId);
        const attacker = this.players.find(p => p.id === attackerId);
        
        if (!player || !player.isAlive) return;

        player.hp = Math.max(0, player.hp - damage);
        
        if (player.hp <= 0) {
            player.isAlive = false;
            
            this.broadcast({
                type: 'player_defeated',
                playerId: playerId,
                attackerId: attackerId,
                round: this.currentRound
            });
            
            // Check if round is over
            this.checkRoundEnd();
        } else {
            this.broadcast({
                type: 'player_damage',
                playerId: playerId,
                damage: damage,
                newHp: player.hp,
                attackerId: attackerId
            });
        }
    }

    checkRoundEnd() {
        const alivePlayers = this.players.filter(p => p.isAlive);
        
        if (alivePlayers.length <= 1) {
            // Round is over
            const winner = alivePlayers[0] || null;
            
            if (winner) {
                winner.wins++;
                this.roundWinners.push(winner.id);
            }
            
            this.broadcast({
                type: 'round_ended',
                round: this.currentRound,
                winner: winner ? {
                    id: winner.id,
                    name: winner.name
                } : null,
                standings: this.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    wins: p.wins,
                    isAlive: p.isAlive
                })).sort((a, b) => b.wins - a.wins)
            });
            
            // Check if game is over
            if (this.currentRound >= this.maxRounds) {
                this.endGame();
            } else {
                // Start next round after 5 seconds
                setTimeout(() => {
                    this.startNextRound();
                }, 5000);
            }
        }
    }

    startNextRound() {
        this.currentRound++;
        
        // Reset all players for next round
        this.players.forEach(player => {
            player.isAlive = true;
            player.hp = player.maxHp;
        });
        
        this.broadcast({
            type: 'round_starting',
            round: this.currentRound,
            maxRounds: this.maxRounds,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                hp: p.hp,
                maxHp: p.maxHp,
                wins: p.wins
            }))
        });
    }

    endGame() {
        this.status = 'finished';
        
        // Determine final winner (most round wins)
        const sortedPlayers = this.players
            .map(p => ({ id: p.id, name: p.name, wins: p.wins }))
            .sort((a, b) => b.wins - a.wins);
        
        const winner = sortedPlayers[0];
        
        this.broadcast({
            type: 'game_ended',
            winner: winner,
            finalStandings: sortedPlayers,
            roundWinners: this.roundWinners,
            gameStats: {
                totalRounds: this.maxRounds,
                gameTime: Date.now() - this.gameStartTime,
                playersCount: this.players.length
            }
        });
        
        // Return players to lobby after 10 seconds
        setTimeout(() => {
            this.broadcast({
                type: 'return_to_lobby'
            });
            
            // Clean up room
            this.players.forEach(player => {
                player.roomId = null;
                player.reset();
            });
            
            rooms.delete(this.id);
        }, 10000);
    }

    broadcast(message) {
        console.log(`📡 Broadcasting ${message.type} to ${this.players.length} players in room ${this.name}`);
        this.players.forEach(player => {
            try {
                player.send(message);
            } catch (error) {
                console.error(`❌ Failed to send ${message.type} to ${player.name}:`, error);
            }
        });
    }

    getPublicData() {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                isReady: p.isReady
            })),
            currentRound: this.currentRound,
            maxRounds: this.maxRounds
        };
    }
}

function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

function generateRoomId() {
    return 'room_' + (roomIdCounter++);
}

function broadcastRoomsUpdate() {
    const roomsArray = Array.from(rooms.values())
        .filter(room => room.status !== 'finished')
        .map(room => room.getPublicData());
    
    const message = {
        type: 'rooms_update',
        rooms: roomsArray
    };
    
    players.forEach(player => {
        if (player.ws.readyState === player.ws.OPEN) {
            player.send(message);
        }
    });
}

function cleanupInactiveRooms() {
    const now = Date.now();
    const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    for (const [roomId, room] of rooms.entries()) {
        const timeSinceActivity = now - room.lastActivity;
        
        if (timeSinceActivity > INACTIVE_TIMEOUT || 
            (room.players.length === 0 && room.status === 'finished')) {
            
            console.log(`🧹 Cleaning up inactive room: ${room.name}`);
            rooms.delete(roomId);
        }
    }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('🔌 New client connected');
    let player = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'register':
                    player = new Player(ws, data.playerData);
                    players.set(player.id, player);
                    console.log(`👤 Player registered: ${player.name} (${player.id})`);
                    
                    // Send player their own ID
                    player.send({
                        type: 'registered',
                        playerId: player.id,
                        playerName: player.name
                    });
                    
                    // Check if any room is already playing and this player should be in it
                    for (const [roomId, room] of rooms.entries()) {
                        if (room.status === 'playing') {
                            console.log(`🎮 Active game found! Sending state to ${player.name}`);
                            player.send({
                                type: 'game_started',
                                roomId: room.id,
                                players: room.players.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    hp: p.hp,
                                    maxHp: p.maxHp,
                                    attack: p.attack,
                                    features: [p.data.feature_1, p.data.feature_2, p.data.feature_3],
                                    sprite_url: p.data.sprite_url
                                })),
                                round: room.currentRound,
                                maxRounds: room.maxRounds
                            });
                            break;
                        }
                    }
                    
                    // Send current rooms
                    broadcastRoomsUpdate();
                    break;

                case 'create_room':
                    if (!player) return;
                    
                    const roomId = generateRoomId();
                    const room = new Room(roomId, data.roomName, player.id);
                    room.addPlayer(player);
                    rooms.set(roomId, room);
                    
                    console.log(`🚪 Room created: ${data.roomName} by ${player.name}`);
                    
                    player.send({
                        type: 'joined_room',
                        roomId: roomId,
                        room: room.getPublicData()
                    });
                    
                    broadcastRoomsUpdate();
                    break;

                case 'join_room':
                    if (!player) return;
                    
                    const targetRoom = rooms.get(data.roomId);
                    if (targetRoom && targetRoom.addPlayer(player)) {
                        console.log(`🚪 ${player.name} joined room: ${targetRoom.name}`);
                        
                        player.send({
                            type: 'joined_room',
                            roomId: data.roomId,
                            room: targetRoom.getPublicData()
                        });
                        
                        // Notify other players in room
                        targetRoom.broadcast({
                            type: 'player_joined',
                            player: {
                                id: player.id,
                                name: player.name
                            },
                            room: targetRoom.getPublicData()
                        });

                        // If game is already in progress, send the game state to the new player
                        if (targetRoom.status === 'playing') {
                            console.log(`🎮 Game in progress. Sending state to ${player.name}`);
                            player.send({
                                type: 'game_started',
                                roomId: targetRoom.id,
                                players: targetRoom.players.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    hp: p.hp,
                                    maxHp: p.maxHp,
                                    attack: p.attack,
                                    features: [p.data.feature_1, p.data.feature_2, p.data.feature_3],
                                    sprite_url: p.data.sprite_url
                                })),
                                round: targetRoom.currentRound,
                                maxRounds: targetRoom.maxRounds
                            });
                        }
                        
                        broadcastRoomsUpdate();
                    } else {
                        player.send({
                            type: 'error',
                            message: 'Could not join room (full or does not exist)'
                        });
                    }
                    break;

                case 'leave_room':
                    if (!player || !player.roomId) return;
                    
                    const currentRoom = rooms.get(player.roomId);
                    if (currentRoom) {
                        currentRoom.removePlayer(player);
                        console.log(`🚪 ${player.name} left room: ${currentRoom.name}`);
                        
                        player.send({
                            type: 'left_room'
                        });
                        
                        // Notify other players
                        currentRoom.broadcast({
                            type: 'player_left',
                            playerId: player.id,
                            room: currentRoom.getPublicData()
                        });
                        
                        broadcastRoomsUpdate();
                    }
                    break;

                case 'start_game':
                    if (!player || !player.roomId) return;
                    
                    const gameRoom = rooms.get(player.roomId);
                    if (gameRoom && gameRoom.creator === player.id) {
                        if (gameRoom.startGame()) {
                            console.log(`🎮 Game starting in room: ${gameRoom.name}`);
                            broadcastRoomsUpdate();
                        } else {
                            player.send({
                                type: 'error',
                                message: 'Cannot start game (need 2-4 players)'
                            });
                        }
                    }
                    break;

                case 'player_action':
                    if (!player || !player.roomId) return;
                    
                    const actionRoom = rooms.get(player.roomId);
                    if (actionRoom) {
                        actionRoom.handlePlayerAction(player.id, data.action);
                    }
                    break;

                case 'player_damage':
                    if (!player || !player.roomId) return;
                    
                    const damageRoom = rooms.get(player.roomId);
                    if (damageRoom) {
                        damageRoom.handlePlayerDamage(data.targetId, data.damage, player.id);
                    }
                    break;

                case 'get_rooms':
                    broadcastRoomsUpdate();
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    ws.on('close', (code, reason) => {
        if (player) {
            console.log(`👤 Player disconnected: ${player.name} (Code: ${code}, Reason: ${reason})`);
            
            // Remove from room if in one
            if (player.roomId) {
                const room = rooms.get(player.roomId);
                if (room) {
                    room.removePlayer(player);
                    
                    // Notify other players
                    room.broadcast({
                        type: 'player_disconnected',
                        playerId: player.id,
                        room: room.getPublicData()
                    });
                }
            }
            
            players.delete(player.id);
            broadcastRoomsUpdate();
        }
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for ${player?.name || 'unknown'}:`, error);
    });
});

// Cleanup inactive rooms every 5 minutes
setInterval(cleanupInactiveRooms, 5 * 60 * 1000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Multiplayer Server running on ws://10.5.0.2:${PORT}`);
    console.log(`🎮 Ready for medication monster battles!`);
    console.log(`🏥 Lobby: http://10.5.0.2:3000/join-lobby.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    
    // Notify all connected players
    players.forEach(player => {
        player.send({
            type: 'server_shutdown',
            message: 'Server is shutting down. Please reconnect later.'
        });
    });
    
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

export { rooms, players };