import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MobileNotice from './components/MobileNotice';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover'
    const [difficulty, setDifficulty] = useState('medium');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    const handleLoadingComplete = () => {
        setIsLoading(false);
    };

    useEffect(() => {
        const saved = localStorage.getItem("laserBounceHighScore");
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const handleStart = (selectedDifficulty) => {
        setDifficulty(selectedDifficulty);
        setScore(0);
        setGameState('playing');
    };

    const handleRestart = () => {
        setScore(0);
        setGameState('playing');
    };

    const handleGameOver = (finalScore) => {
        setGameState('gameover');
        if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem("laserBounceHighScore", finalScore);
        }
    };

    const [showInstructions, setShowInstructions] = useState(false);

    const handleShowInstructions = () => {
        setShowInstructions(true);
    };

    const handleCloseInstructions = () => {
        setShowInstructions(false);
    };

    return (
        <div className="app-container">
            {isLoading ? (
                <LoadingScreen onComplete={handleLoadingComplete} />
            ) : (
                <div className="fade-in" style={{ width: '100%', height: '100%' }}>
                    <MobileNotice />

                    <UIOverlay
                        gameState={gameState}
                        score={score}
                        highScore={highScore}
                        onStart={handleStart}
                        onRestart={handleRestart}
                        onShowInstructions={handleShowInstructions}
                        showInstructions={showInstructions}
                        onCloseInstructions={handleCloseInstructions}
                    />

                    <GameCanvas
                        difficulty={difficulty}
                        gameRunning={gameState === 'playing'}
                        onGameOver={handleGameOver}
                        onScoreUpdate={setScore}
                    />
                </div>
            )}
        </div>
    );
}

export default App;
