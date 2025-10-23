import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

interface FullscreenToggleProps {
  collapsed?: boolean;
}

const FullscreenToggle: React.FC<FullscreenToggleProps> = ({ collapsed = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={toggleFullscreen}
        className="flex justify-center p-2 hover:bg-slate-100 rounded-lg transition-colors group"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
        ) : (
          <Maximize className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleFullscreen}
      className="w-full px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
    >
      {isFullscreen ? (
        <>
          <Minimize className="w-4 h-4" />
          <span>Exit Fullscreen</span>
        </>
      ) : (
        <>
          <Maximize className="w-4 h-4" />
          <span>Fullscreen</span>
        </>
      )}
    </button>
  );
};

export default FullscreenToggle;

