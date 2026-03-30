"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";

interface AudioTrack {
  id: string;
  language: string;
  languageCode: string;
  filePath: string;
}

interface MultiLangPlayerProps {
  videoPath: string;
  audioTracks: AudioTrack[];
  defaultLanguage?: string;
  onProgress?: (time: number, duration: number) => void;
  onComplete?: () => void;
  startTime?: number;
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  'english': 'en',
  'en-us': 'en',
  'en-uk': 'en',
  'eng': 'en',
  'hindi': 'hi',
  'hin': 'hi',
  'marathi': 'mr',
  'mar': 'mr',
  'tamil': 'ta',
  'tam': 'ta',
  'telugu': 'te',
  'tel': 'te',
  'kannada': 'kn',
  'kan': 'kn',
  'malayalam': 'ml',
  'mal': 'ml',
  'gujarati': 'gu',
  'guj': 'gu',
  'punjabi': 'pa',
  'pan': 'pa',
  'bengali': 'bn',
  'ben': 'bn',
};

function normalizeLanguageCode(code: string): string {
  const normalized = code.toLowerCase().trim();
  return LANGUAGE_CODE_MAP[normalized] || normalized;
}

function findBestTrack(audioTracks: AudioTrack[], targetCode: string): AudioTrack | null {
  if (!audioTracks || audioTracks.length === 0) return null;
  
  const normalizedTarget = normalizeLanguageCode(targetCode);
  
  const exactMatch = audioTracks.find(t => normalizeLanguageCode(t.languageCode) === normalizedTarget);
  if (exactMatch) return exactMatch;
  
  const langMatch = audioTracks.find(t => 
    normalizeLanguageCode(t.language) === normalizedTarget || 
    normalizeLanguageCode(t.language) === LANGUAGE_CODE_MAP[normalizedTarget]
  );
  if (langMatch) return langMatch;
  
  return audioTracks[0];
}

export function MultiLangPlayer({
  videoPath,
  audioTracks,
  defaultLanguage = "en",
  onProgress,
  onComplete,
  startTime = 0,
}: MultiLangPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const isAudioReadyRef = useRef(false);

  useEffect(() => {
    const track = findBestTrack(audioTracks, defaultLanguage);
    if (track) {
      setCurrentTrack(track);
      setAudioError(null);
    }
  }, [audioTracks, defaultLanguage]);

  useEffect(() => {
    if (audioRef.current && videoRef.current && currentTrack) {
      const audio = audioRef.current;
      const video = videoRef.current;
      
      isAudioReadyRef.current = false;
      
      audio.src = currentTrack.filePath;
      audio.load();
      audio.currentTime = video.currentTime || 0;
      
      const handleCanPlay = () => {
        isAudioReadyRef.current = true;
        audio.currentTime = video.currentTime || 0;
        if (isPlaying) {
          audio.play().catch(console.error);
        }
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
      
      const handleError = (e: Event) => {
        console.error('[MultiLangPlayer] Audio load error:', (e.target as HTMLAudioElement)?.error);
        setAudioError(`Failed to load audio: ${currentTrack.language}`);
        isAudioReadyRef.current = false;
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (startTime > 0) {
        video.currentTime = startTime;
        audio.currentTime = startTime;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (Math.abs(video.currentTime - audio.currentTime) > 0.5) {
        audio.currentTime = video.currentTime;
      }
      if (onProgress) {
        onProgress(video.currentTime, video.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [onProgress, onComplete, startTime]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    if (isPlaying) {
      video.pause();
      audio.pause();
    } else {
      video.play().catch(console.error);
      if (isAudioReadyRef.current) {
        audio.play().catch(console.error);
      }
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;
    video.currentTime = time;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !duration) return;
    const newTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    video.currentTime = newTime;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleLanguageChange = useCallback((track: AudioTrack) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const currentVideoTime = video.currentTime;
    
    isAudioReadyRef.current = false;
    audio.src = track.filePath;
    audio.load();
    audio.currentTime = currentVideoTime;
    
    const handleCanPlay = () => {
      isAudioReadyRef.current = true;
      audio.currentTime = currentVideoTime;
      setCurrentTrack(track);
      setAudioError(null);
      
      if (isPlaying) {
        audio.play().catch(console.error);
      }
      
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
    
    const handleError = (e: Event) => {
      console.error('[MultiLangPlayer] Language change error:', (e.target as HTMLAudioElement)?.error);
      setAudioError(`Failed to switch to: ${track.language}`);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
  }, [isPlaying]);

  const handleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  }, []);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div 
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoPath}
        className="w-full h-full object-contain"
        playsInline
        muted
        onClick={togglePlay}
      />

      <audio ref={audioRef} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      )}

      {audioError && (
        <div className="absolute top-4 left-4 right-4 bg-red-600/80 text-white text-sm px-4 py-2 rounded-lg">
          {audioError}
        </div>
      )}

      <div 
        className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${isPlaying && !showControls ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        onClick={togglePlay}
      >
        {!isPlaying && (
          <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
            <Play className="h-10 w-10 text-white ml-1" fill="white" />
          </div>
        )}
      </div>

      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white text-sm">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <span className="text-white text-sm">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => handleSkip(-10)} className="text-white hover:text-primary transition-colors" title="Back 10s">
              <SkipBack className="h-5 w-5" />
            </button>
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>
            <button onClick={() => handleSkip(10)} className="text-white hover:text-primary transition-colors" title="Forward 10s">
              <SkipForward className="h-5 w-5" />
            </button>
            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentTrack && audioTracks.length > 0 && (
              <select
                value={currentTrack.languageCode}
                onChange={(e) => {
                  const track = audioTracks.find(t => t.languageCode === e.target.value || normalizeLanguageCode(t.languageCode) === normalizeLanguageCode(e.target.value));
                  if (track) handleLanguageChange(track);
                }}
                className="bg-white/20 text-white text-sm px-3 py-1 rounded-md border-none outline-none cursor-pointer"
              >
                {audioTracks.map((track) => (
                  <option key={track.id} value={track.languageCode} className="text-black">
                    {track.language}
                  </option>
                ))}
              </select>
            )}
            <button onClick={handleFullscreen} className="text-white hover:text-primary transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
