import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [text, setText] = useState("INITIALIZING...");

    useEffect(() => {
        // Progress Bar Animation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + Math.random() * 5;
            });
        }, 100);

        // Text Sequence
        setTimeout(() => setText("LOADING ASSETS..."), 1000);
        setTimeout(() => setText("CALIBRATING LASERS..."), 2000);
        setTimeout(() => setText("SYSTEM READY"), 2800);

        // Completion
        setTimeout(() => {
            onComplete();
        }, 3200);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="loading-container">
            <div className="scanlines"></div>

            <div className="loading-content">
                <h1 className="glitch" data-text="LASER BOUNCE">LASER BOUNCE</h1>
                <h2 className="subtitle">MADNESS</h2>

                <div className="loader-box">
                    <div className="loader-bar" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="terminal-text">
                    [{progress < 100 ? "BUSY" : "OK"}] :: {text}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
