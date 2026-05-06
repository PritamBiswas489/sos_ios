export function buildStressRecord({
  stress,
  activeSource,
  bleData,
  googleFitData,
}) {
  // const hasBleData =
  //   activeSource === 'ble' &&
  //   Array.isArray(bleData?.hrBuffer) &&
  //   bleData.hrBuffer.length > 0;

  // const hasGoogleFitData =
  //   activeSource === 'googlefit' &&
  //   Array.isArray(googleFitData?.hrReadings) &&
  //   googleFitData.hrReadings.length > 0;

  if (stress?.currentHR == null) {
    return null;
  }

  return {
    created_at: new Date().toISOString(),
    source: activeSource,
    current_hr: Number(stress.currentHR),
    avg_hr: stress.avgHR == null ? null : Number(stress.avgHR),
    stress_score: Number(stress.score ?? 0),
    stress_state: stress.state?.label ?? 'Unknown',
    stress_level: Number(stress.state?.level ?? -1),
    rmssd: Number(stress.rmssd ?? 0),
    hr_intensity: Number(stress.hrIntensity ?? 0),
    hr_score: Number(stress.hrScore ?? 0),
    rmssd_score: Number(stress.rmssdScore ?? 0),
  };
}
