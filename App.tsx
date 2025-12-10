
import React, { useState } from 'react';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';

const App: React.FC = () => {
  const [lightsOn, setLightsOn] = useState<boolean>(true);
  const [isAssembled, setIsAssembled] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.2);

  const toggleLights = () => {
    setLightsOn(prev => !prev);
  };

  const toggleAssemble = () => {
    setIsAssembled(prev => !prev);
  };

  return (
    <div className="relative w-full h-screen bg-[#000502] overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene 
          lightsOn={lightsOn} 
          rotationSpeed={rotationSpeed} 
          isAssembled={isAssembled}
        />
      </div>

      {/* UI Layer */}
      <Overlay 
        lightsOn={lightsOn} 
        toggleLights={toggleLights}
        isAssembled={isAssembled}
        toggleAssemble={toggleAssemble}
        rotationSpeed={rotationSpeed}
        setRotationSpeed={setRotationSpeed}
      />
      
      {/* Decorative Border Frame */}
      <div className="absolute inset-0 border-[1px] border-[#FFD700]/20 pointer-events-none m-4 md:m-8 z-20"></div>
      <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-[#FFD700] z-20 hidden md:block"></div>
      <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-[#FFD700] z-20 hidden md:block"></div>
      <div className="absolute bottom-8 left-8 w-4 h-4 border-b border-l border-[#FFD700] z-20 hidden md:block"></div>
      <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-[#FFD700] z-20 hidden md:block"></div>
    </div>
  );
};

export default App;
