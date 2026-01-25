import React, { useRef, useEffect, useState } from 'react';

const GameCanvas = ({
    difficulty,
    onGameOver,
    onScoreUpdate,
    gameRunning
}) => {
    const canvasRef = useRef(null);

    // Game State Refs (Mutable for loop performance)
    const gameState = useRef({
        width: 0,
        height: 0,
        frames: 0,
        score: 0,
        difficultyLevel: 0,
        laserAmmo: 0,
        laserUnlockCount: 0,
        laserUnlocked: false,
        laserUnlockMessageTimer: 0,
        speedScale: 1,
        gameOverTriggered: false
    });

    const entities = useRef({
        player: { x: 0, y: 0, radius: 18, speed: 6, dx: 0, dy: 0 },
        enemies: [],
        lasers: [],
        powerOrbs: []
    });

    const keys = useRef({});
    const animationFrameId = useRef(null);
    const orbInterval = useRef(null);

    // Audio Refs
    const audioRefs = useRef({});

    // Constants
    const BASE_WIDTH = 1600;
    const DIFFICULTY_SETTINGS = {
        easy: { enemyCount: 6, speedMultiplier: 0.8, scoreStep: 400 },
        medium: { enemyCount: 8, speedMultiplier: 1, scoreStep: 400 },
        hard: { enemyCount: 10, speedMultiplier: 1.3, scoreStep: 250 }
    };
    const LASER_AMMO_PER_UNLOCK = 30;

    // Initialize Audio
    useEffect(() => {
        audioRefs.current = {
            laser: new Audio('/laser.mp3'),
            hit: new Audio('/hit.mp3'),
            bounce: new Audio('/bounce.wav'),
            bg: new Audio('/bg.mp3'),
            death: new Audio('/death.mp3')
        };
        // audioRefs.current.bg.loop = true; // Removed looping as it causes stuttering on short files
        audioRefs.current.bg.volume = 0.4;

        return () => {
            // Cleanup audio on unmount
            if (audioRefs.current.bg) audioRefs.current.bg.pause();
        };
    }, []);

    // Handle Resize
    const handleResize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const oldScale = gameState.current.speedScale;

        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.8;

        gameState.current.width = canvas.width;
        gameState.current.height = canvas.height;

        // Speed Scaling Logic
        const newScale = Math.max(canvas.width / BASE_WIDTH, 0.7);
        const ratio = oldScale > 0 ? newScale / oldScale : 1;
        gameState.current.speedScale = newScale;

        const { width, height } = gameState.current;
        const { player, enemies, powerOrbs, lasers } = entities.current;

        // Scale Entities
        if (player) {
            player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
            player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));
            player.radius *= ratio;
            player.speed *= ratio;
        }

        enemies.forEach(e => {
            e.x = Math.max(e.radius, Math.min(width - e.radius, e.x));
            e.y = Math.max(e.radius, Math.min(height - e.radius, e.y));
            e.dx *= ratio;
            e.dy *= ratio;
            e.radius *= ratio;
        });

        powerOrbs.forEach(p => {
            p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
            p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));
            p.radius *= ratio;
        });

        lasers.forEach(l => {
            l.dx *= ratio;
            l.dy *= ratio;
            l.length *= ratio;
        });
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial resize
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update GameRunning state
    useEffect(() => {
        if (gameRunning) {
            startGame();
        } else {
            // Pause or Game Over
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (orbInterval.current) clearInterval(orbInterval.current);
            audioRefs.current.bg.pause();
        }
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (orbInterval.current) clearInterval(orbInterval.current);
        };
    }, [gameRunning, difficulty]);

    // Input Listeners
    useEffect(() => {
        const handleKeyDown = (e) => {
            keys.current[e.key] = true;
            // Shoot
            if (e.key === " " && gameRunning) {
                const { laserUnlocked, laserAmmo } = gameState.current;
                const { player } = entities.current;
                if (laserUnlocked && laserAmmo > 0 && (player.dx !== 0 || player.dy !== 0)) {
                    entities.current.lasers.push({
                        x: player.x,
                        y: player.y,
                        dx: player.dx * 14 * gameState.current.speedScale, // approx laser speed
                        dy: player.dy * 14 * gameState.current.speedScale,
                        length: 40 * gameState.current.speedScale
                    });
                    const s = audioRefs.current.laser;
                    s.volume = 0.5; s.currentTime = 0; s.play().catch(() => { });
                    gameState.current.laserAmmo--;
                }
            }
        };
        const handleKeyUp = (e) => keys.current[e.key] = false;

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameRunning]);


    // Game Logic Helper
    const randomVel = () => Math.random() * 1.7 + 3;
    const spawnEnemy = () => {
        const { width, height, speedScale } = gameState.current;
        const setting = DIFFICULTY_SETTINGS[difficulty];
        const speedBase = randomVel() * setting.speedMultiplier * speedScale;

        const corner = Math.floor(Math.random() * 4);
        let x, y;
        const offset = 50;

        switch (corner) {
            case 0: x = Math.random() * offset + 15; y = Math.random() * offset + 15; break;
            case 1: x = width - Math.random() * offset - 15; y = Math.random() * offset + 15; break;
            case 2: x = Math.random() * offset + 15; y = height - Math.random() * offset - 15; break;
            case 3: x = width - Math.random() * offset - 15; y = height - Math.random() * offset - 15; break;
            default: x = 0; y = 0;
        }

        entities.current.enemies.push({
            x, y,
            radius: 12 * speedScale,
            dx: (Math.random() < 0.5 ? -1 : 1) * speedBase,
            dy: (Math.random() < 0.5 ? -1 : 1) * speedBase,
            color: `hsl(${Math.random() * 360},70%,50%)`,
            active: true
        });
    };

    const startOrbSpawner = () => {
        if (orbInterval.current) clearInterval(orbInterval.current);
        orbInterval.current = setInterval(() => {
            if (!gameRunning) return;
            const { width, height, speedScale } = gameState.current;
            const orb = {
                x: Math.random() * (width - 20) + 10,
                y: Math.random() * (height - 20) + 10,
                radius: 8 * speedScale
            };
            entities.current.powerOrbs.push(orb);
            setTimeout(() => {
                const idx = entities.current.powerOrbs.indexOf(orb);
                if (idx >= 0) entities.current.powerOrbs.splice(idx, 1);
            }, 10000);
        }, 3000);
    };

    const startGame = () => {
        const { width, height } = gameState.current;

        // Reset State
        gameState.current.score = 0;
        gameState.current.frames = 0;
        gameState.current.difficultyLevel = 0;
        gameState.current.laserUnlocked = false;
        gameState.current.laserAmmo = 0;
        gameState.current.laserUnlockCount = 0;
        gameState.current.laserUnlockMessageTimer = 0;
        gameState.current.gameOverTriggered = false;

        // Reset Entities
        entities.current.player.x = width / 2;
        entities.current.player.y = height / 2;
        entities.current.enemies = [];
        entities.current.lasers = [];
        entities.current.powerOrbs = [];

        // Spawn Enemies
        const count = DIFFICULTY_SETTINGS[difficulty].enemyCount;
        for (let i = 0; i < count; i++) spawnEnemy();

        // Start Audio
        audioRefs.current.bg.currentTime = 0;
        audioRefs.current.bg.play().catch(e => console.log("Audio play failed", e));

        startOrbSpawner();

        // Start Loop
        loop();
    };

    const collide = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;

    const update = () => {
        const { width, height, speedScale } = gameState.current;

        // Player Move
        const p = entities.current.player;
        p.dx = 0; p.dy = 0;
        if (keys.current["ArrowUp"]) p.dy = -p.speed;
        if (keys.current["ArrowDown"]) p.dy = p.speed;
        if (keys.current["ArrowLeft"]) p.dx = -p.speed;
        if (keys.current["ArrowRight"]) p.dx = p.speed;

        p.x = Math.max(p.radius, Math.min(width - p.radius, p.x + p.dx));
        p.y = Math.max(p.radius, Math.min(height - p.radius, p.y + p.dy));

        // Enemies
        entities.current.enemies.forEach(e => {
            if (!e.active) return;
            e.x += e.dx; e.y += e.dy;
            if (e.x < e.radius || e.x > width - e.radius) e.dx *= -1;
            if (e.y < e.radius || e.y > height - e.radius) e.dy *= -1;

            if (collide(e, p)) {
                // GAME OVER
                if (!gameState.current.gameOverTriggered) {
                    gameState.current.gameOverTriggered = true;
                    audioRefs.current.death.play();
                    onGameOver(gameState.current.score); // Call Parent
                }
            }
        });

        // Lasers
        const lasers = entities.current.lasers;
        for (let i = lasers.length - 1; i >= 0; i--) {
            const l = lasers[i];
            l.x += l.dx; l.y += l.dy;
            if (l.x < 0 || l.x > width || l.y < 0 || l.y > height) {
                lasers.splice(i, 1); continue;
            }
            // Collision with Enemies
            const enemies = entities.current.enemies;
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (e.active && collide({ x: l.x, y: l.y, radius: 5 }, e)) {
                    e.active = false;
                    audioRefs.current.hit.currentTime = 0;
                    audioRefs.current.hit.play();
                    gameState.current.score += 100;
                    onScoreUpdate(gameState.current.score); // Optional update
                    lasers.splice(i, 1);
                    break;
                }
            }
        }

        // Power Orbs
        const orbs = entities.current.powerOrbs;
        for (let i = orbs.length - 1; i >= 0; i--) {
            const o = orbs[i];
            if (collide(p, o)) {
                gameState.current.score += 50;
                orbs.splice(i, 1);
                audioRefs.current.hit.currentTime = 0;
                audioRefs.current.hit.play();
                onScoreUpdate(gameState.current.score);
            }
        }

        // Difficulty and Unlocks logic similar to original...
        const step = DIFFICULTY_SETTINGS[difficulty].scoreStep;
        if (gameState.current.score >= (gameState.current.difficultyLevel + 1) * step) {
            gameState.current.difficultyLevel++;
            entities.current.enemies.forEach(e => { e.dx *= 1.1; e.dy *= 1.1; });
            spawnEnemy();
        }

        // Laser Unlocks
        if (gameState.current.score >= 200 && !gameState.current.laserUnlocked) {
            gameState.current.laserUnlocked = true;
            gameState.current.laserAmmo = LASER_AMMO_PER_UNLOCK;
            gameState.current.laserUnlockMessageTimer = 180;
            audioRefs.current.laser.play();
            audioRefs.current.bg.volume = 0.2;
            gameState.current.laserUnlockCount = 1;
        }
        if (gameState.current.laserUnlocked) {
            const timesToGive = Math.floor((gameState.current.score - 200) / 200) + 1;
            if (timesToGive > gameState.current.laserUnlockCount) {
                gameState.current.laserAmmo += LASER_AMMO_PER_UNLOCK;
                audioRefs.current.bg.volume = 0.2;
                gameState.current.laserUnlockCount = timesToGive;
            }
        }

        if (gameState.current.laserUnlockMessageTimer > 0) gameState.current.laserUnlockMessageTimer--;

        // Update displayed score immediately if onGameOver wasn't deferred
        onScoreUpdate(gameState.current.score);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = gameState.current;

        ctx.fillStyle = "#111"; ctx.fillRect(0, 0, width, height);

        // Player
        const p = entities.current.player;
        ctx.fillStyle = "yellow"; ctx.shadowColor = "yellow"; ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.radius);
        ctx.lineTo(p.x + p.radius, p.y);
        ctx.lineTo(p.x, p.y + p.radius);
        ctx.lineTo(p.x - p.radius, p.y);
        ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;

        // Message
        if (gameState.current.laserUnlockMessageTimer > 0) {
            ctx.fillStyle = "#0ff"; ctx.font = "48px Segoe UI"; ctx.textAlign = "center";
            ctx.shadowColor = "#0ff"; ctx.shadowBlur = 20;
            ctx.fillText("Laser Unlocked!", width / 2, height / 2 - 100);
            ctx.shadowBlur = 0;
        }

        // Enemies
        entities.current.enemies.forEach(e => {
            if (!e.active) return;
            ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        });

        // Lasers
        entities.current.lasers.forEach(l => {
            const nx = l.dx / Math.hypot(l.dx, l.dy);
            const ny = l.dy / Math.hypot(l.dx, l.dy);
            const endX = l.x - nx * l.length; const endY = l.y - ny * l.length;

            ctx.strokeStyle = "rgba(255,0,0,0.6)"; ctx.lineWidth = 10; ctx.shadowColor = "red"; ctx.shadowBlur = 30;
            ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(endX, endY); ctx.stroke();

            ctx.strokeStyle = "#ff5555"; ctx.lineWidth = 4; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(endX, endY); ctx.stroke();
        });

        // Orbs
        ctx.fillStyle = "lime"; ctx.shadowColor = "lime"; ctx.shadowBlur = 25;
        entities.current.powerOrbs.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;
    };

    const loop = () => {
        if (gameState.current.gameOverTriggered) return; // Stop loop if game over
        update();
        draw();
        animationFrameId.current = requestAnimationFrame(loop);
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    background: '#111',
                    border: '3px solid #0ff',
                    boxShadow: '0 0 25px #0ff',
                    borderRadius: '10px'
                }}
            />
        </div>
    );
};

export default GameCanvas;
