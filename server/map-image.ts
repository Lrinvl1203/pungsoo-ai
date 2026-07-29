export const MAP_IMAGE_WIDTH = 600;
export const MAP_IMAGE_HEIGHT = 400;
export const MAP_LONGITUDE_DELTA = 0.008;
export const MAP_LATITUDE_DELTA = MAP_LONGITUDE_DELTA * 0.7;

export type ArcGisMapService = 'World_Imagery' | 'World_Street_Map';

export const isValidMapCoordinate = (latitude: number, longitude: number) => (
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -85
    && latitude <= 85
    && longitude >= -180
    && longitude <= 180
);

export const buildArcGisMapUrl = (
    latitude: number,
    longitude: number,
    service: ArcGisMapService,
) => {
    if (!isValidMapCoordinate(latitude, longitude)) {
        throw new Error('Invalid map coordinates.');
    }

    const bbox = [
        longitude - MAP_LONGITUDE_DELTA,
        latitude - MAP_LATITUDE_DELTA,
        longitude + MAP_LONGITUDE_DELTA,
        latitude + MAP_LATITUDE_DELTA,
    ].join(',');

    return `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/export`
        + `?bbox=${bbox}&bboxSR=4326&imageSR=4326`
        + `&size=${MAP_IMAGE_WIDTH},${MAP_IMAGE_HEIGHT}&f=image&format=jpg`;
};

export const fetchArcGisMapImage = async (
    latitude: number,
    longitude: number,
    service: ArcGisMapService,
): Promise<Buffer> => {
    const response = await fetch(buildArcGisMapUrl(latitude, longitude, service));
    if (!response.ok) {
        throw new Error(`Map image fetch failed (${service}, ${response.status}).`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
        throw new Error(`Map provider returned a non-image response (${service}).`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > 8 * 1024 * 1024) {
        throw new Error(`Map provider returned an invalid image size (${service}).`);
    }
    return buffer;
};
