export const bearingFromNormalizedOffset = (
    dxNorm: number,
    dyNorm: number,
    aspectRatio: number,
): number => (
    (Math.atan2(dxNorm * aspectRatio, -dyNorm) * 180 / Math.PI + 360) % 360
);
