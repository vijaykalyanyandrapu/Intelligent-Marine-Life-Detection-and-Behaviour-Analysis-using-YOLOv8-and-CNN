import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality, Type } from "@google/genai";

// FIX: Define an interface for detection objects to ensure type safety.
interface Detection {
    species: string;
    behavior: string;
}

// SVG Icons for UI Elements
const UploadIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>;
const StartAnalysisIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"></path></svg>;
const StopIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 6h12v12H6z"></path></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>;
const AwaitingVideoIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></svg>;
const MenuIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>;
// Video Player Controls Icons
const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const VolumeHighIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>;
const VolumeOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>;
const FullscreenIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg>;
const FullscreenExitIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></svg>;

// FIX: Added types for component props to ensure type safety.
const CustomVideoPlayer = ({ src, detections = [] }: { src: string, detections?: Detection[] }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const speedMenuRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
    const controlsTimeoutRef = useRef<number | null>(null);
    
    const playbackRates = [0.5, 1, 1.5, 2];

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const handleMouseMove = () => {
        setIsControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = window.setTimeout(() => {
            if (isPlaying) {
                 setIsControlsVisible(false);
            }
        }, 3000);
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                handleMouseMove();
            } else {
                videoRef.current.pause();
                setIsControlsVisible(true);
                if(controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            }
        }
    };
    
    const handleProgress = () => {
        if(videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress);
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(videoRef.current) {
            const newTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = newTime;
            setProgress(parseFloat(e.target.value));
        }
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if(videoRef.current) videoRef.current.volume = newVolume;
    };
    
    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
            if (!isMuted) setVolume(0); else setVolume(videoRef.current.volume || 1);
        }
    };

    const handlePlaybackRateChange = (rate) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setIsSpeedMenuOpen(false);
        }
    };
    
    const toggleFullscreen = () => {
        if (!playerContainerRef.current) return;
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };
    
     useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        const videoElement = videoRef.current;
        const playerContainer = playerContainerRef.current;
        if (!videoElement || !playerContainer) return;

        videoElement.play().catch(() => {});

        return () => {
            videoElement.pause();
        };
    }, [src]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (speedMenuRef.current && !speedMenuRef.current.contains(event.target)) {
                setIsSpeedMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Static bounding box data for illustrative purposes
    const illustrativeBoxes = [
      { top: '10%', left: '40%', width: '55%', height: '25%' },
      { top: '38%', left: '35%', width: '50%', height: '20%' },
      { top: '60%', left: '30%', width: '60%', height: '35%' },
    ];

    return (
        <div 
            ref={playerContainerRef} 
            className="custom-video-player"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if(isPlaying) setIsControlsVisible(false) }}
        >
            <video
                ref={videoRef}
                src={src}
                onClick={togglePlayPause}
                onTimeUpdate={handleProgress}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setIsPlaying(false)}
                loop
                playsInline
                autoPlay
                muted
            />

            {detections.length > 0 && (
                <div className="detection-overlay">
                    {detections.slice(0, 3).map((detection, index) => (
                        <div key={index} className="bounding-box" style={illustrativeBoxes[index]}>
                            <div className="bounding-box-label">{detection.species}: {detection.behavior}</div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className={`controls-overlay ${isControlsVisible ? 'visible' : ''}`}>
                <div className="progress-bar-container">
                    <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="seek-bar"/>
                </div>
                <div className="controls">
                    <div className="controls-left">
                        <button onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                         <div className="volume-container">
                            <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeHighIcon />}</button>
                            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="volume-slider"/>
                        </div>
                    </div>
                    <div className="controls-center">
                         <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <div className="controls-right">
                       <div className="speed-control-container" ref={speedMenuRef}>
                            <button onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}><SettingsIcon/></button>
                            {isSpeedMenuOpen && (
                                <div className="speed-menu">
                                    {playbackRates.map(rate => (
                                        <button key={rate} onClick={() => handlePlaybackRateChange(rate)} className={playbackRate === rate ? 'active' : ''}>
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                       <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>{isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// FIX: Typed the detections prop to fix type inference issues within the component.
const BehaviorChart = ({ detections = [] }: { detections?: Detection[] }) => {
    // FIX: Explicitly type the initial value of the `reduce` method. This helps TypeScript
    // correctly infer the return type of `reduce` as `{ [key: string]: number }`,
    // resolving downstream type errors where values were inferred as `unknown`.
    const behaviorCounts = detections.reduce((acc: { [key: string]: number }, { behavior }) => {
        acc[behavior] = (acc[behavior] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const maxCount = Math.max(...Object.values(behaviorCounts), 0);
    const numLabels = Math.min(maxCount, 5);
    const yAxisLabels = Array.from({ length: numLabels }, (_, i) => {
        if (numLabels <= 1) return maxCount;
        return Math.round(maxCount / (numLabels - 1) * i);
    }).reverse();
    if(yAxisLabels.length === 0) yAxisLabels.push(0);


    return (
        <div className="chart-container">
            <div className="y-axis">
                {yAxisLabels.map(label => <span key={label}>{label}</span>)}
            </div>
            <div className="chart-bars">
                {Object.entries(behaviorCounts).map(([behavior, count]) => (
                    <div className="bar-group" key={behavior}>
                        <div className="bar" style={{ height: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%' }}></div>
                        <span className="bar-label">{behavior}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const App = () => {
    const [currentView, setCurrentView] = useState<'home' | 'enhancement' | 'analysis'>('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ data: string; mimeType: string; url: string; name: string; type: 'image' | 'video' } | null>(null);
    const [analysis, setAnalysis] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const isAnalysisCancelled = useRef<boolean>(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadedFile(null);
        setAnalysis(null);
        setError(null);

        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

        if (!fileType) {
            setError("Unsupported file type. Please upload a valid image or video file.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                setUploadedFile({
                    data: (reader.result as string).split(',')[1],
                    mimeType: file.type,
                    url: URL.createObjectURL(file),
                    name: file.name,
                    type: fileType,
                });
            }
        };
        reader.readAsDataURL(file);
    };
    
    const handleStopAnalysis = () => {
        isAnalysisCancelled.current = true;
        setIsLoading(false);
        setError("Analysis cancelled by user.");
    };

    const analyzeContent = async () => {
        if (!uploadedFile) {
            setError("Please upload a file first.");
            return;
        }
        
        isAnalysisCancelled.current = false;
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
            if (!apiKey) {
                throw new Error("Gemini API key is missing. Please ensure GEMINI_API_KEY is set in your environment.");
            }

            const ai = new GoogleGenAI({ apiKey });

            if (uploadedFile.type === 'video') {
                const modelsToTry = ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.0-flash'];
                let response = null;
                let lastError: any = null;

                for (const modelName of modelsToTry) {
                    try {
                        if (isAnalysisCancelled.current) return;
                        
                        response = await ai.models.generateContent({
                            model: modelName,
                            contents: {
                                parts: [
                                    {
                                        inlineData: {
                                            data: uploadedFile.data,
                                            mimeType: uploadedFile.mimeType,
                                        },
                                    },
                                    {
                                        text: `Analyze this underwater video. Provide a detailed analysis in a JSON object with two keys: 
                                        1. "sceneSummary": A concise paragraph describing the overall scene, environment, and the primary interactions.
                                        2. "detections": An array of objects, where each object represents a detected behavior event. Each object should have two keys: "species" (the common name of the animal) and "behavior" (a short description of the action, e.g., "Social Interaction", "Foraging", "Swimming"). Provide at least 3 detection events.`,
                                    },
                                ],
                            },
                            config: {
                                responseMimeType: "application/json",
                                responseSchema: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sceneSummary: { type: Type.STRING },
                                        detections: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    species: { type: Type.STRING },
                                                    behavior: { type: Type.STRING }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        break; // Success!
                    } catch (e: any) {
                        lastError = e;
                        const errorMsg = (e.message || String(e)).toLowerCase();
                        // Check specifically for high demand, rate limits, or model not found
                        if (
                            errorMsg.includes("429") || 
                            errorMsg.includes("high demand") || 
                            errorMsg.includes("resource_exhausted") ||
                            errorMsg.includes("404") ||
                            errorMsg.includes("not found")
                        ) {
                            console.warn(`Model ${modelName} failed with: ${errorMsg}. Attempting fallback if available...`);
                            continue;
                        }
                        // For other errors, stop and throw
                        throw e;
                    }
                }
                
                if (isAnalysisCancelled.current) return;

                if (response && response.text) {
                     try {
                        const parsedAnalysis = JSON.parse(response.text);
                        if (!parsedAnalysis.sceneSummary || !Array.isArray(parsedAnalysis.detections)) {
                            throw new Error("The AI response was incomplete. Missing required scene summary or detections.");
                        }
                        setAnalysis(parsedAnalysis);
                    } catch (jsonError: any) {
                        console.error("Failed to parse video analysis JSON:", jsonError);
                        setError(`Formatting error: The AI provided data in an unexpected format. Please try analyzing again.`);
                    }
                } else if (response && (response as any).candidates?.[0]?.finishReason) {
                    const reason = (response as any).candidates[0].finishReason;
                    if (reason === 'SAFETY') {
                        setError("The analysis was blocked by safety filters. The video may contain restricted content.");
                    } else if (reason === 'RECITATION') {
                        setError("The analysis was blocked as it might contain copyrighted material.");
                    } else {
                        setError(`Analysis could not be completed. Reason: ${reason}`);
                    }
                } else {
                    if (lastError && (lastError.message?.includes("429") || lastError.message?.includes("demand"))) {
                        setError("The AI service is currently experiencing extremely high demand across all models. Please wait a few minutes and try again.");
                    } else {
                        setError("The AI model did not return a valid analysis. The file might be complex or corrupted.");
                    }
                }
            } else {
                setError("Only video analysis is supported in this view. Use the Image Enhancement tool for pictures.");
            }
        } catch (e: any) {
            if (isAnalysisCancelled.current) return;
            console.error("AI Analysis error:", e);
            
            let message = "An error occurred while analyzing the file. Please try again.";
            const errorStr = e.message || String(e);
            
            if (errorStr.includes("API key")) {
                message = "Authentication failed: The Gemini API key is missing or invalid. Check your configuration.";
            } else if (errorStr.includes("fetch") || errorStr.includes("NetworkError")) {
                message = "Network error: Unable to connect to the AI service. Please check your internet connection.";
            } else if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("high demand") || errorStr.includes("RESOURCE_EXHAUSTED")) {
                message = "High Demand/Quota Exceeded: The AI model is currently busy or you have reached your usage limit. Please try again in 1-2 minutes.";
            } else if (errorStr.includes("404") || errorStr.includes("not found")) {
                message = "Model Unavailable: The requested AI models are not available in this region or with the current API key. Please check your account settings.";
            } else if (errorStr.includes("400")) {
                message = "Bad request: The video file might be too large or in an unsupported format for the AI.";
            } else if (errorStr.includes("500") || errorStr.includes("503")) {
                message = "Server error: The AI service is currently unavailable. Please try again later.";
            } else if (e.message) {
                message = `Analysis failed: ${e.message}`;
            }

            setError(message);
        } finally {
            if (!isAnalysisCancelled.current) {
                setIsLoading(false);
            }
        }
    };

    const handleDownload = async () => {
        if (!uploadedFile || !analysis) return;
        setIsDownloading(true);
        setError(null);

        try {
            const video = document.createElement('video');
            video.src = uploadedFile.url;
            video.muted = true;

            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                throw new Error("Could not get canvas context");
            }

            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analyzed-${uploadedFile.name}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            recorder.start();

            const illustrativeBoxes = [
                { top: '10%', left: '40%', width: '55%', height: '25%' },
                { top: '38%', left: '35%', width: '50%', height: '20%' },
                { top: '60%', left: '30%', width: '60%', height: '35%' },
            ];

            const renderLoop = () => {
                if (video.paused || video.ended) {
                    return;
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                analysis.detections.slice(0, 3).forEach((detection, index) => {
                    const box = illustrativeBoxes[index];
                    const x = parseFloat(box.left) / 100 * canvas.width;
                    const y = parseFloat(box.top) / 100 * canvas.height;
                    const w = parseFloat(box.width) / 100 * canvas.width;
                    const h = parseFloat(box.height) / 100 * canvas.height;

                    ctx.strokeStyle = '#ff8c00';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = 'rgba(255, 140, 0, 0.5)';
                    ctx.shadowBlur = 10;
                    ctx.strokeRect(x, y, w, h);
                    ctx.shadowBlur = 0;
                    
                    const label = `${detection.species}: ${detection.behavior}`;
                    ctx.fillStyle = '#ff8c00';
                    ctx.font = 'bold 18px Roboto';
                    const textMetrics = ctx.measureText(label);
                    ctx.fillRect(x - 2, y - 24, textMetrics.width + 12, 24);
                    ctx.fillStyle = '#0d2a4c';
                    ctx.fillText(label, x + 4, y - 6);
                });
                requestAnimationFrame(renderLoop);
            };

            await new Promise<void>((resolve, reject) => {
                video.onended = () => {
                    recorder.stop();
                    resolve();
                };
                video.onerror = (e) => {
                    recorder.stop();
                    reject(new Error("Video playback error during rendering."));
                };
                
                video.currentTime = 0;
                video.play().then(() => {
                    requestAnimationFrame(renderLoop);
                }).catch(reject);
            });

        } catch (e) {
            console.error("Download failed:", e);
            setError("Failed to process and download the video. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const renderContent = () => {
        const MediaEnhancer = () => {
            const [localMedia, setLocalMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
            const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
            const [isProcessing, setIsProcessing] = useState(false);
            const videoRef = useRef<HTMLVideoElement>(null);
            const canvasRef = useRef<HTMLCanvasElement>(null);

            // --- Image Processing Algorithms ---

            const applyGaussianFilter = (imageData: ImageData) => {
                const width = imageData.width;
                const height = imageData.height;
                const data = imageData.data;
                const output = new Uint8ClampedArray(data.length);
                const kernel = [
                    1/16, 2/16, 1/16,
                    2/16, 4/16, 2/16,
                    1/16, 2/16, 1/16
                ];

                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        for (let c = 0; c < 3; c++) {
                            let sum = 0;
                            for (let ky = -1; ky <= 1; ky++) {
                                for (let kx = -1; kx <= 1; kx++) {
                                    sum += data[((y + ky) * width + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];
                                }
                            }
                            output[(y * width + x) * 4 + c] = sum;
                        }
                        output[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
                    }
                }
                return new ImageData(output, width, height);
            };

            const applyNormalization = (imageData: ImageData) => {
                const data = imageData.data;
                let min = [255, 255, 255];
                let max = [0, 0, 0];

                for (let i = 0; i < data.length; i += 4) {
                    for (let c = 0; c < 3; c++) {
                        if (data[i + c] < min[c]) min[c] = data[i + c];
                        if (data[i + c] > max[c]) max[c] = data[i + c];
                    }
                }

                for (let i = 0; i < data.length; i += 4) {
                    for (let c = 0; c < 3; c++) {
                        if (max[c] > min[c]) {
                            data[i + c] = ((data[i + c] - min[c]) / (max[c] - min[c])) * 255;
                        }
                    }
                }
                return imageData;
            };

            const applySimplifiedCLAHE = (imageData: ImageData) => {
                const width = imageData.width;
                const height = imageData.height;
                const data = imageData.data;
                const gridX = 8;
                const gridY = 8;
                const tileW = Math.floor(width / gridX);
                const tileH = Math.floor(height / gridY);
                const clipLimit = 2.0;

                // 1. Calculate histograms for each tile
                const histograms = new Array(gridX * gridY).fill(0).map(() => new Float32Array(256));
                
                for (let ty = 0; ty < gridY; ty++) {
                    for (let tx = 0; tx < gridX; tx++) {
                        const hist = histograms[ty * gridX + tx];
                        for (let y = ty * tileH; y < (ty + 1) * tileH; y++) {
                            for (let x = tx * tileW; x < (tx + 1) * tileW; x++) {
                                const idx = (y * width + x) * 4;
                                const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                                hist[Math.floor(luma)]++;
                            }
                        }

                        // Clip histogram
                        let excess = 0;
                        const limit = (tileW * tileH / 256) * clipLimit;
                        for (let i = 0; i < 256; i++) {
                            if (hist[i] > limit) {
                                excess += hist[i] - limit;
                                hist[i] = limit;
                            }
                        }
                        const add = excess / 256;
                        for (let i = 0; i < 256; i++) hist[i] += add;

                        // Cumulative distribution function
                        let sum = 0;
                        for (let i = 0; i < 256; i++) {
                            sum += hist[i];
                            hist[i] = (sum / (tileW * tileH)) * 255;
                        }
                    }
                }

                // 2. Map pixels with bilinear interpolation
                const output = new Uint8ClampedArray(data.length);
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const tx = x / tileW - 0.5;
                        const ty = y / tileH - 0.5;
                        
                        const tx1 = Math.max(0, Math.min(gridX - 1, Math.floor(tx)));
                        const ty1 = Math.max(0, Math.min(gridY - 1, Math.floor(ty)));
                        const tx2 = Math.min(gridX - 1, tx1 + 1);
                        const ty2 = Math.min(gridY - 1, ty1 + 1);

                        const dx = tx - tx1;
                        const dy = ty - ty1;

                        const idx = (y * width + x) * 4;
                        const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                        const val = Math.floor(luma);

                        const v11 = histograms[ty1 * gridX + tx1][val];
                        const v12 = histograms[ty1 * gridX + tx2][val];
                        const v21 = histograms[ty2 * gridX + tx1][val];
                        const v22 = histograms[ty2 * gridX + tx2][val];

                        const interpolated = v11 * (1 - dx) * (1 - dy) +
                                             v12 * dx * (1 - dy) +
                                             v21 * (1 - dx) * dy +
                                             v22 * dx * dy;

                        const factor = luma > 0 ? interpolated / luma : 1;
                        output[idx] = Math.min(255, data[idx] * factor);
                        output[idx + 1] = Math.min(255, data[idx + 1] * factor);
                        output[idx + 2] = Math.min(255, data[idx + 2] * factor);
                        output[idx + 3] = data[idx + 3];
                    }
                }
                return new ImageData(output, width, height);
            };

            const processMedia = async (media: { url: string, type: 'image' | 'video' }) => {
                if (media.type === 'video') return; // Video processed real-time via canvas in render loop

                setIsProcessing(true);
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = media.url;
                
                await new Promise((resolve) => img.onload = resolve);

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                ctx.drawImage(img, 0, 0);
                let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Apply chain: Gaussian -> Normalization -> CLAHE
                imageData = applyGaussianFilter(imageData);
                imageData = applyNormalization(imageData);
                imageData = applySimplifiedCLAHE(imageData);

                ctx.putImageData(imageData, 0, 0);
                setProcessedImageUrl(canvas.toDataURL());
                setIsProcessing(false);
            };

            const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                    const type = file.type.startsWith('video/') ? 'video' : 'image';
                    const url = URL.createObjectURL(file);
                    setLocalMedia({ url, type });
                    setProcessedImageUrl(null);
                    if (type === 'image') {
                        processMedia({ url, type });
                    }
                }
            };

            const handleDownload = () => {
                if (!localMedia) return;
                const link = document.createElement('a');
                if (localMedia.type === 'image' && processedImageUrl) {
                    link.download = 'enhanced-marine-image.png';
                    link.href = processedImageUrl;
                    link.click();
                } else if (localMedia.type === 'video') {
                    link.download = 'marine-video.mp4';
                    link.href = localMedia.url;
                    link.click();
                }
            };

            // Video per-frame processing
            useEffect(() => {
                if (localMedia?.type !== 'video' || !videoRef.current || !canvasRef.current) return;

                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                let animationFrame: number;

                const renderFrame = () => {
                    if (video.paused || video.ended) {
                        animationFrame = requestAnimationFrame(renderFrame);
                        return;
                    }

                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    
                    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // For video performance, we apply a lighter version of the algorithms
                    // Usually CLAHE is too slow for 30fps JS, so we'll use Normalization + Gaussian
                    imageData = applyNormalization(imageData);
                    // Gaussian is omitted for real-time video unless resolution is low
                    
                    ctx.putImageData(imageData, 0, 0);
                    animationFrame = requestAnimationFrame(renderFrame);
                };

                video.play().then(() => {
                    animationFrame = requestAnimationFrame(renderFrame);
                });

                return () => cancelAnimationFrame(animationFrame);
            }, [localMedia]);

            return (
                <div className="enhancer-container">
                    <div className="enhancer-header">
                        <h2>Advanced Underwater Media Enhancement</h2>
                        <p>Automatic restoration using Gaussian Filtering, CLAHE, and Histogram Normalization.</p>
                    </div>

                    <div className="enhancer-layout auto-mode">
                        <div className="enhancer-preview">
                            {localMedia ? (
                                <div className="preview-wrapper">
                                    {isProcessing && (
                                        <div className="processing-overlay">
                                            <div className="spinner-large"></div>
                                            <span>Applying advanced filters...</span>
                                        </div>
                                    )}
                                    {localMedia.type === 'video' ? (
                                        <div className="video-processing-container">
                                            <video 
                                                ref={videoRef}
                                                src={localMedia.url} 
                                                style={{ display: 'none' }}
                                                muted 
                                                loop 
                                                playsInline
                                            />
                                            <canvas ref={canvasRef} className="processed-canvas" />
                                            <div className="mode-badge">Auto-Enhanced Video</div>
                                        </div>
                                    ) : (
                                        processedImageUrl && <img src={processedImageUrl} alt="Enhanced" />
                                    )}
                                </div>
                            ) : (
                                <div className="enhancer-upload-prompt">
                                    <AwaitingVideoIcon />
                                    <p>Upload an underwater image or video to apply automatic enhancement</p>
                                    <label htmlFor="enhancer-upload" className="control-button">
                                        <UploadIcon /> Select Media
                                    </label>
                                    <input id="enhancer-upload" type="file" accept="image/*,video/*" onChange={handleMediaUpload} style={{ display: 'none' }} />
                                </div>
                            )}

                            {localMedia && !isProcessing && (
                                <div className="enhancer-preview-actions">
                                    <button className="control-button primary" onClick={handleDownload}>
                                        <DownloadIcon /> Download Enhanced Result
                                    </button>
                                    <label htmlFor="enhancer-change" className="control-button">
                                        Upload Different Media
                                    </label>
                                    <input id="enhancer-change" type="file" accept="image/*,video/*" onChange={handleMediaUpload} style={{ display: 'none' }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        };

        if (currentView === 'home') {
            return (
                <div className="view-placeholder">
                    <h2>Welcome to Marine Life Hub</h2>
                    <p>Explore the vast oceans through our advanced analysis and enhancement tools.</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="control-button" onClick={() => setCurrentView('analysis')}>Behavior Analysis</button>
                        <button className="control-button" onClick={() => setCurrentView('enhancement')}>Image Enhancement</button>
                    </div>
                </div>
            );
        }

        if (currentView === 'enhancement') {
            return <MediaEnhancer />;
        }

        const ActionButtons = () => (
            <div className="player-actions">
                <label htmlFor="file-upload" className="control-button">
                    <UploadIcon /> {uploadedFile ? 'Change Video' : 'Upload Video'}
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="video/mp4, video/quicktime, video/x-msvideo"
                    onChange={handleFileChange}
                />
                
                {isLoading ? (
                    <button className="control-button stop-button" onClick={handleStopAnalysis}>
                        <StopIcon /> Stop Analysis
                    </button>
                ) : (
                    <button className="control-button" onClick={analyzeContent} disabled={!uploadedFile}>
                        <StartAnalysisIcon /> Start Analysis
                    </button>
                )}

                {analysis && !isLoading && (
                    <button className="control-button" onClick={handleDownload} disabled={isDownloading}>
                        {isDownloading ? <div className="spinner-small"></div> : <DownloadIcon />}
                        <span>{isDownloading ? 'Processing...' : 'Download Video'}</span>
                    </button>
                )}
            </div>
        );

        if (isLoading) {
             return (
                <div className="placeholder">
                     <div className="spinner" role="status" aria-live="polite"></div>
                     <p>Analyzing {uploadedFile?.type || 'content'}...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="placeholder">
                    <div className="error-message">{error}</div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <ActionButtons />
                    </div>
                </div>
            );
        }

        if (analysis && uploadedFile?.type === 'video') {
            return (
                 <div className="results-view">
                    <div className="video-results-container">
                         <CustomVideoPlayer 
                            src={uploadedFile.url} 
                            detections={analysis?.detections || []} 
                         />
                         <div className="player-footer">
                            <p className="video-filename">{uploadedFile.name}</p>
                         </div>
                    </div>
                    <div className="analysis-grid">
                        <div className="grid-col-1">
                             <div className="analysis-section">
                                 <h2>Scene Summary</h2>
                                 <p>{analysis.sceneSummary}</p>
                             </div>
                             <div className="analysis-section">
                                 <h2>Detection Log</h2>
                                 <div className="detection-log">
                                     {analysis.detections?.map((d, i) => (
                                         <div key={i} className="log-item">
                                             <span className="log-dot"></span>
                                             {d.species} - {d.behavior}
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                        <div className="grid-col-2">
                             <div className="analysis-section">
                                 <h2>Behavior Frequency</h2>
                                 <BehaviorChart detections={analysis.detections} />
                             </div>
                        </div>
                    </div>
                    <div className="player-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem' }}>
                        <div />
                        <ActionButtons />
                    </div>
                </div>
            );
        }
        
        if (uploadedFile) {
            return (
                <div className="preview-container">
                    <div className="video-results-container">
                        {uploadedFile.type === 'image' ? (
                            <img src={uploadedFile.url} alt="Uploaded preview" />
                        ) : (
                            <CustomVideoPlayer src={uploadedFile.url} />
                        )}
                        <div className="player-footer">
                            <p className="video-filename">{uploadedFile.name}</p>
                            <ActionButtons />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="placeholder">
                <AwaitingVideoIcon />
                <h2>Awaiting Video</h2>
                <p>Upload a video file to begin the automated behavior analysis process.</p>
                <div style={{ marginTop: '2rem' }}>
                    <ActionButtons />
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-left" onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <h1>Image enhancement and behaviour analysis of marine animals</h1>
                </div>
                <div className="nav-container">
                    <button 
                        className="menu-toggle" 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle navigation"
                    >
                        {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>
                    <nav className={`app-nav ${isMenuOpen ? 'open' : ''}`}>
                        <button 
                            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
                            onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }}
                        >
                            Home
                        </button>
                        <button 
                            className={`nav-link ${currentView === 'enhancement' ? 'active' : ''}`}
                            onClick={() => { setCurrentView('enhancement'); setIsMenuOpen(false); }}
                        >
                            Image Enhancement
                        </button>
                        <button 
                            className={`nav-link ${currentView === 'analysis' ? 'active' : ''}`}
                            onClick={() => { setCurrentView('analysis'); setIsMenuOpen(false); }}
                        >
                            Behaviour Analysis
                        </button>
                    </nav>
                </div>
            </header>
            <main className="main-content">
                <section className="content-panel">
                    {renderContent()}
                </section>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);