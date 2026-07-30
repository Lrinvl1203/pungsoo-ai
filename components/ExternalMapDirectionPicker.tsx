import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Compass, Crosshair, Loader2, MapPin, Navigation, RotateCcw } from 'lucide-react';
import { normalizedMapPointToCoordinates } from '../server/map-image';
import { bearingFromNormalizedOffset } from '../utils/bearing';

type EditMode = 'pin' | 'direction';

interface ExternalMapDirectionPickerProps {
    latitude: number;
    longitude: number;
    locationConfirmed: boolean;
    bearingDegrees: number | null;
    onLocationChange: (latitude: number, longitude: number) => void;
    onLocationConfirmedChange: (confirmed: boolean) => void;
    onBearingChange: (bearingDegrees: number | null) => void;
}

const clamp = (value: number, min: number, max: number) => (
    Math.min(max, Math.max(min, value))
);

const getCardinalLabel = (bearing: number) => {
    const labels = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
    return labels[Math.round(bearing / 45) % labels.length];
};

export default function ExternalMapDirectionPicker({
    latitude,
    longitude,
    locationConfirmed,
    bearingDegrees,
    onLocationChange,
    onLocationConfirmedChange,
    onBearingChange,
}: ExternalMapDirectionPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [editMode, setEditMode] = useState<EditMode>('pin');
    const [previewCenter, setPreviewCenter] = useState({ latitude, longitude });
    const [pinPosition, setPinPosition] = useState({ x: 0.5, y: 0.5 });
    const [dragging, setDragging] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setPreviewCenter({ latitude, longitude });
        setPinPosition({ x: 0.5, y: 0.5 });
    }, [latitude, longitude]);

    const previewUrl = useMemo(() => (
        `/api/map-preview?lat=${previewCenter.latitude.toFixed(6)}&lng=${previewCenter.longitude.toFixed(6)}`
    ), [previewCenter]);

    useEffect(() => {
        setImageLoading(true);
        setImageFailed(false);
    }, [previewUrl]);

    const getPointerPosition = (event: React.PointerEvent<HTMLDivElement>) => {
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return null;
        return {
            x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
            y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
        };
    };

    const updateDirection = (position: { x: number; y: number }) => {
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return;
        const dx = position.x - pinPosition.x;
        const dy = position.y - pinPosition.y;
        const aspectRatio = rect.width / rect.height;
        const correctedDx = dx * aspectRatio;
        if (Math.hypot(correctedDx, dy) < 0.04) return;
        const bearing = bearingFromNormalizedOffset(dx, dy, aspectRatio);
        onBearingChange(Math.round(bearing));
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        const position = getPointerPosition(event);
        if (!position) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        if (editMode === 'pin') {
            setPinPosition(position);
            onLocationConfirmedChange(false);
        } else {
            updateDirection(position);
        }
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        const position = getPointerPosition(event);
        if (!position) return;
        if (editMode === 'pin') {
            setPinPosition(position);
        } else {
            updateDirection(position);
        }
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        const position = getPointerPosition(event);
        setDragging(false);
        if (!position || editMode !== 'pin') return;

        const nextCoordinate = normalizedMapPointToCoordinates(position, previewCenter);
        onLocationChange(
            Math.round(nextCoordinate.latitude * 1_000_000) / 1_000_000,
            Math.round(nextCoordinate.longitude * 1_000_000) / 1_000_000,
        );
    };

    const normalizedBearing = bearingDegrees == null
        ? null
        : ((bearingDegrees % 360) + 360) % 360;

    return (
        <div className="mt-5 space-y-4 rounded-xl border border-primary/25 bg-black/25 p-4">
            <div>
                <div className="flex items-center gap-2 text-sm font-black text-white">
                    <Compass className="h-4 w-4 text-primary" />
                    지도 위치와 추정 방위 확인
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                    위쪽은 진북입니다. 먼저 핀을 대상 건물로 맞춘 뒤, 필요하면 대문·현관이 바깥을 바라보는 방향을 화살표로 지정하세요.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setEditMode('pin')}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${editMode === 'pin' ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-black/20 text-slate-300'}`}
                >
                    <Crosshair className="mr-1 inline h-4 w-4" /> 핀 위치 조정
                </button>
                <button
                    type="button"
                    onClick={() => setEditMode('direction')}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${editMode === 'direction' ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-black/20 text-slate-300'}`}
                >
                    <Navigation className="mr-1 inline h-4 w-4" /> 방향 화살표
                </button>
            </div>

            <div
                ref={mapRef}
                role="application"
                aria-label={editMode === 'pin' ? '분석 위치 핀 조정 지도' : '현관 추정 방위 지정 지도'}
                className="relative aspect-[3/2] touch-none overflow-hidden rounded-xl border border-white/15 bg-[#13110c] select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => setDragging(false)}
            >
                <img
                    src={previewUrl}
                    alt="분석 대상 위치의 진북 기준 위성 지도"
                    draggable={false}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                        setImageLoading(false);
                        setImageFailed(true);
                    }}
                    className="h-full w-full object-cover"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/20" />
                <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded bg-black/65 px-2 py-1 text-[10px] font-black text-white">N · 진북</div>
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/80">남</div>
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/80">서</div>
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/80">동</div>

                {normalizedBearing != null && (
                    <div
                        className="pointer-events-none absolute z-20 h-[30%] w-1 origin-bottom rounded-full bg-gradient-to-t from-[#d4af37] to-red-500 shadow-[0_0_12px_rgba(212,175,55,0.9)]"
                        style={{
                            left: `${pinPosition.x * 100}%`,
                            top: `${pinPosition.y * 100}%`,
                            transform: `translate(-50%, -100%) rotate(${normalizedBearing}deg)`,
                        }}
                    >
                        <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-red-400" />
                    </div>
                )}

                <div
                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full"
                    style={{ left: `${pinPosition.x * 100}%`, top: `${pinPosition.y * 100}%` }}
                >
                    <MapPin className="h-9 w-9 fill-[#8f1f1f] text-white drop-shadow-xl" />
                </div>

                {imageLoading && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                )}
                {imageFailed && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 px-8 text-center text-xs text-slate-200">
                        위성 지도를 불러오지 못했습니다. 잠시 후 주소를 다시 선택해 주세요.
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[11px] text-slate-300">
                좌표: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>

            {editMode === 'pin' ? (
                <button
                    type="button"
                    onClick={() => onLocationConfirmedChange(!locationConfirmed)}
                    className={`w-full rounded-lg border px-4 py-3 text-sm font-black transition-all ${locationConfirmed ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200' : 'border-primary/50 bg-primary/15 text-white'}`}
                >
                    <Check className="mr-2 inline h-4 w-4" />
                    {locationConfirmed ? '이 위치로 확인됨' : '이 위치가 맞습니다'}
                </button>
            ) : (
                <div className="space-y-3">
                    {normalizedBearing == null ? (
                        <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100">
                            지도에서 대문·현관이 바깥을 바라보는 쪽을 누르거나 드래그하세요. 선택하지 않으면 초견 분석으로 진행됩니다.
                        </p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">
                                <span className="text-xs font-bold text-white">추정 방위</span>
                                <span className="text-sm font-black text-primary">{normalizedBearing}° · {getCardinalLabel(normalizedBearing)}</span>
                            </div>
                            <input
                                aria-label="추정 방위각"
                                type="range"
                                min={0}
                                max={359}
                                value={normalizedBearing}
                                onChange={event => onBearingChange(Number(event.target.value))}
                                className="w-full accent-[#d4af37]"
                            />
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => onBearingChange(null)}
                        disabled={normalizedBearing == null}
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <RotateCcw className="mr-1 inline h-4 w-4" /> 방위 입력 지우기
                    </button>
                    <p className="text-[10px] leading-relaxed text-slate-400">
                        지도 화살표는 사용자가 위성 이미지를 보고 지정한 추정치이며, 현장 나침반 실측을 대체하지 않습니다. 신뢰도는 ‘낮음’으로 기록됩니다.
                    </p>
                </div>
            )}
        </div>
    );
}
