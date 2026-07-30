export const MAP_IMAGE_WIDTH = 600;
export const MAP_IMAGE_HEIGHT = 400;
export const MAP_LONGITUDE_DELTA = 0.008;

const KILOMETERS_PER_LONGITUDE_DEGREE_AT_EQUATOR = 111.320;
const KILOMETERS_PER_LATITUDE_DEGREE = 110.574;

export interface NormalizedMapPoint {
    x: number;
    y: number;
}

export interface MapCoordinate {
    latitude: number;
    longitude: number;
}

export interface MapBounds {
    west: number;
    south: number;
    east: number;
    north: number;
}

export const calculateMapLatitudeDelta = (
    centerLatitude: number,
    longitudeDelta = MAP_LONGITUDE_DELTA,
) => (
    longitudeDelta
    * Math.cos(centerLatitude * Math.PI / 180)
    * (MAP_IMAGE_HEIGHT / MAP_IMAGE_WIDTH)
    * (KILOMETERS_PER_LONGITUDE_DEGREE_AT_EQUATOR / KILOMETERS_PER_LATITUDE_DEGREE)
);

export const buildMapBounds = (
    latitude: number,
    longitude: number,
    longitudeDelta = MAP_LONGITUDE_DELTA,
): MapBounds => {
    const latitudeDelta = calculateMapLatitudeDelta(latitude, longitudeDelta);
    return {
        west: longitude - longitudeDelta,
        south: latitude - latitudeDelta,
        east: longitude + longitudeDelta,
        north: latitude + latitudeDelta,
    };
};

export const normalizedMapPointToCoordinates = (
    point: NormalizedMapPoint,
    center: MapCoordinate,
    longitudeDelta = MAP_LONGITUDE_DELTA,
): MapCoordinate => {
    const latitudeDelta = calculateMapLatitudeDelta(center.latitude, longitudeDelta);
    return {
        longitude: center.longitude + (point.x - 0.5) * longitudeDelta * 2,
        latitude: center.latitude - (point.y - 0.5) * latitudeDelta * 2,
    };
};

export const mapCoordinatesToNormalizedPoint = (
    coordinate: MapCoordinate,
    center: MapCoordinate,
    longitudeDelta = MAP_LONGITUDE_DELTA,
): NormalizedMapPoint => {
    const latitudeDelta = calculateMapLatitudeDelta(center.latitude, longitudeDelta);
    return {
        x: 0.5 + (coordinate.longitude - center.longitude) / (longitudeDelta * 2),
        y: 0.5 - (coordinate.latitude - center.latitude) / (latitudeDelta * 2),
    };
};

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

    const bounds = buildMapBounds(latitude, longitude);
    const bbox = [bounds.west, bounds.south, bounds.east, bounds.north].join(',');

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
