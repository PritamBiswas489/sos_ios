import React from 'react';
 
import { BleProvider } from './BleContext';
import { StressProvider } from './StressContext';

export default function HealthProvider({
  children,
  userAge = 30,
  criticalThreshold = 76,
  gfRefreshMs = 30_000, //
   
}) {
  return (
    
      <BleProvider>
        <StressProvider
          userAge={userAge}
          criticalThreshold={criticalThreshold}
          
        >
          {children}
        </StressProvider>
      </BleProvider>
     
  );
}
