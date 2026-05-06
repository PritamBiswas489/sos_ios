import React from 'react';
import { GoogleFitProvider } from './GoogleFitContext';
import { BleProvider } from './BleContext';
import { StressProvider } from './StressContext';

export default function HealthProvider({
  children,
  userAge = 30,
  criticalThreshold = 76,
  gfRefreshMs = 30_000, //
   
}) {
  return (
    <GoogleFitProvider refreshIntervalMs={gfRefreshMs}>
      <BleProvider>
        <StressProvider
          userAge={userAge}
          criticalThreshold={criticalThreshold}
          
        >
          {children}
        </StressProvider>
      </BleProvider>
    </GoogleFitProvider>
  );
}
