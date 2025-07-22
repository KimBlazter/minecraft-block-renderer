import * as THREE from "three";

export type MinecraftFace = {
    uv?: Vector4;
    texture: string;
    rotation?: number;
    tintindex?: number;
    cullface?: string;
};

export type Axis = "x" | "y" | "z";

export type BlockFaces = "up" | "down" | "north" | "south" | "east" | "west";
export type BlockSides =
    | "all"
    | "top"
    | "bottom"
    | "side"
    | "front"
    | "particle"
    | "pane"
    | "wood"
    | "back"
    | BlockFaces;

export type MinecraftElement = {
    from: Vector3;
    to: Vector3;
    shade?: boolean;
    faces: Partial<Record<BlockFaces, MinecraftFace>>;
    rotation?: {
        origin: Vector3;
        axis: Axis;
        angle: number;
        rescale?: boolean;
    };
};

export type MinecraftModel = {
    parent?: string;
    ambientocclusion?: boolean;
    textures?: Record<string, string>;
    elements?: MinecraftElement[];
};

export type AnimationFrame = {
    index: number;
    time: number;
};

export type TextureAnimation = {
    interpolate?: boolean;
    width?: number;
    height?: number;
    frametime?: number;
    frames?: (number | AnimationFrame)[];
};

export type AnimatedTextureInfo = {
    texture: THREE.Texture;
    animation: TextureAnimation;
    currentFrame: number;
    frameTime: number;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    sourceImage: HTMLImageElement;
    frameHeight: number;
    totalFrames: number;
};

export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
