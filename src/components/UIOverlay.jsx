import React from 'react';
import './UIOverlay.css';

const UIOverlay = ({
    gameState,
    score,
    highScore,
    onStart,
    onRestart,
    onShowInstructions,
    showInstructions,
    onCloseInstructions
}) => {
    // gameState: 'menu', 'playing', 'gameover'

    return (
        <>
            {/* SCORE HUD */}
            {(gameState === 'playing' || gameState === 'gameover') && (
                <>
                    <div id="score">Score: {score}</div>
                    <div id="highScore">High Score: {highScore}</div>
                </>
            )}

            {/* MAIN MENU */}
            <div id="menu" className={gameState === 'menu' ? 'visible' : ''} style={{ zIndex: gameState === 'menu' ? 20 : 0 }}>
                <h1>Laser Bounce Madness</h1>
                <p style={{ marginTop: '-20px' }}>Move with Arrow Keys • Shoot with Space</p>

                <div className="button-row">
                    <button onClick={() => onStart('easy')}>Easy</button>
                    <button onClick={() => onStart('medium')}>Medium</button>
                    <button onClick={() => onStart('hard')}>Hard</button>
                </div>

                <div style={{ marginTop: '15px' }}>
                    <button onClick={onShowInstructions}>Instructions</button>
                </div>
            </div>

            {/* GAME OVER */}
            <div id="gameOver" className={gameState === 'gameover' ? 'visible' : ''}>
                <div id="gameOverContent">
                    <div id="gameOverText">GAME OVER</div>
                    <div id="finalScore">Score: {score}</div>

                    <button onClick={onRestart}>Restart</button>

                    <p id="difficultyLabel">Select Difficulty:</p>
                    <div className="button-row">
                        <button onClick={() => onStart('easy')}>Easy</button>
                        <button onClick={() => onStart('medium')}>Medium</button>
                        <button onClick={() => onStart('hard')}>Hard</button>
                    </div>
                </div>
            </div>

            {/* INSTRUCTIONS MODAL */}
            <div className={`modal-overlay ${showInstructions ? 'visible' : ''}`}>
                <div className="modal-content">
                    <h2>How to Play</h2>
                    <p>Eat small green static drops to score 50 points.</p>
                    <p>Shoot moving dots while avoiding them to score 100 points.</p>
                    <p><strong>Objective:</strong> Achieve the highest possible score.</p>
                    <p className="warning">Be aware: As your score increases, speed and number of moving dots also increase!</p>
                    <button onClick={onCloseInstructions}>Close</button>
                </div>
            </div>
        </>
    );
};

export default UIOverlay;
