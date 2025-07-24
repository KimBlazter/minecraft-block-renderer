import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import type {
    MinecraftModel,
    MinecraftElement,
    MinecraftFace,
    TextureAnimation,
    AnimatedTextureInfo,
    AnimationFrame,
    Vector3,
    Vector4,
    Axis,
} from "../utils/types";
import { size } from "../utils/math";

// Material order according to Three.js BoxGeometry
// BoxGeometry uses the order: [+X, -X, +Y, -Y, +Z, -Z] (right, left, top, bottom, front, back)
// In Minecraft terms: [east, west, up, down, south, north]
const MATERIAL_FACE_ORDER = [
    "east", // +X (right)
    "west", // -X (left)
    "up", // +Y (top)
    "down", // -Y (bottom)
    "south", // +Z (front)
    "north", // -Z (back)
] as const;

const DEBUG_FACE_COLORS: Record<string, number> = {
    east: 0xff0000, // rouge
    west: 0x00ff00, // vert
    up: 0x0000ff, // bleu
    down: 0xffff00, // jaune
    south: 0xff00ff, // magenta
    north: 0x00ffff, // cyan
};

function mergeModels(
    child: MinecraftModel,
    parent: MinecraftModel
): MinecraftModel {
    return {
        ambientocclusion: child.ambientocclusion ?? parent.ambientocclusion,
        textures: { ...parent.textures, ...child.textures },
        elements: child.elements ?? parent.elements ?? [],
    };
}

// Decode texture references
// If the texture starts with "#", it refers to a key in the model's textures object
// If the texture is not found, it returns null
function decodeTexture(texture: string, model: MinecraftModel): string | null {
    if (!texture) return null;
    if (!texture.startsWith("#")) {
        return texture;
    }

    const textureKey = texture.substring(1);
    const resolvedTexture = model.textures?.[textureKey];

    if (!resolvedTexture) {
        console.warn(
            `Texture reference #${textureKey} not found in model textures:`,
            model.textures
        );
        return null;
    }

    // Resolve recursive texture references
    return decodeTexture(resolvedTexture, model);
}

// Generate default UV coordinates for a face
function generateDefaultUV(
    element: MinecraftElement,
    direction: keyof MinecraftElement["faces"]
): Vector4 {
    const face = element.faces[direction];
    if (face?.uv) return face.uv;

    const { from, to } = element;

    // Minecraft uses a system where faces are oriented differently
    switch (direction) {
        case "up":
        case "down":
            return [from[0], from[2], to[0], to[2]];
        case "north":
        case "south":
            return [from[0], 16 - to[1], to[0], 16 - from[1]];
        case "east":
        case "west":
            return [from[2], 16 - to[1], to[2], 16 - from[1]];
        default:
            return [0, 0, 16, 16];
    }
}

// Load animation metadata from .mcmeta file
// Returns null if no animation is found or if the file does not exist
async function loadAnimationMeta(
    texturePath: string
): Promise<TextureAnimation | null> {
    try {
        const metaUrl = `${import.meta.env.VITE_ASSETS_BASE_URL}textures/${texturePath}.png.mcmeta`;
        const response = await fetch(metaUrl);

        if (!response.ok) return null;

        const meta = await response.json();
        return meta.animation || null;
    } catch (error) {
        return null;
    }
}

// Create a Minecraft texture
function createMinecraftTexture(
    image: HTMLImageElement,
    face: MinecraftFace,
    element: MinecraftElement,
    direction: keyof MinecraftElement["faces"]
): THREE.Texture {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Use UVs from the face or generate default UVs
    let uv = face.uv ?? generateDefaultUV(element, direction);
    const width = image.width;
    const height = image.height;

    canvas.width = Math.max(16, Math.abs(uv[2] - uv[0]));
    canvas.height = Math.max(16, Math.abs(uv[3] - uv[1]));

    ctx.imageSmoothingEnabled = false;

    // Apply rotation if specified
    if (face.rotation) {
        ctx.translate(width / 2, height / 2);
        ctx.rotate((face.rotation * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);
    }

    let flipX = uv[0] > uv[2];
    let flipY = uv[1] > uv[3];

    if (direction === "down") {
        flipX = !flipX;
        flipY = flipY;
    }

    if (flipX) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    if (flipY) {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
    }

    // Draw the image on the canvas using the UV coordinates
    ctx.drawImage(
        image,
        uv[0], // sx
        uv[1], // sy
        uv[2] - uv[0], // sWidth
        uv[3] - uv[1], // sHeight
        0, // dx
        0, // dy
        width, // dWidth
        height // dHeight
    );

    const texture = new THREE.Texture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
}

// Créer une texture animée
function createAnimatedTexture(
    image: HTMLImageElement,
    face: MinecraftFace,
    element: MinecraftElement,
    direction: keyof MinecraftElement["faces"],
    animation: TextureAnimation
): AnimatedTextureInfo {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const width = image.width;
    const frameHeight = animation.height || width;
    const totalFrames = Math.floor(image.height / frameHeight);

    let uv = face.uv ?? generateDefaultUV(element, direction);

    canvas.width = width;
    canvas.height = frameHeight;
    ctx.imageSmoothingEnabled = false;

    // Apply rotation if specified
    if (face.rotation) {
        ctx.translate(width / 2, frameHeight / 2);
        ctx.rotate((face.rotation * Math.PI) / 180);
        ctx.translate(-width / 2, -frameHeight / 2);
    }

    let flipX = uv[0] > uv[2];
    let flipY = uv[1] > uv[3];

    // Pour la face "down", on inverse TOUJOURS flipX et flipY (miroir complet)
    if (direction === "down") {
        flipX = !flipX;
        flipY = flipY;
    }

    if (flipX) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    if (flipY) {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
    }

    // Draw the image on the canvas using the UV coordinates
    ctx.drawImage(
        image,
        uv[0], // sx
        uv[1], // sy
        uv[2] - uv[0], // sWidth
        uv[3] - uv[1], // sHeight
        0, // dx
        0, // dy
        width, // dWidth
        frameHeight // dHeight
    );

    const texture = new THREE.Texture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return {
        texture,
        animation,
        currentFrame: 0,
        frameTime: 0,
        canvas,
        context: ctx,
        sourceImage: image,
        frameHeight,
        totalFrames,
    };
}

// Update animation frame
function updateAnimatedTexture(
    animInfo: AnimatedTextureInfo,
    deltaTime: number
) {
    const { animation, context, sourceImage, frameHeight, totalFrames } =
        animInfo;

    const frameDuration = (animation.frametime || 1) * 50; // 50ms per tick

    animInfo.frameTime += deltaTime * 1000;

    if (animInfo.frameTime >= frameDuration) {
        animInfo.frameTime = 0;

        // Calculate the next frame
        if (animation.frames && animation.frames.length > 0) {
            const currentFrameIndex =
                animInfo.currentFrame % animation.frames.length;
            const frameData = animation.frames[currentFrameIndex];

            animInfo.currentFrame =
                (animInfo.currentFrame + 1) % animation.frames.length;
        } else {
            animInfo.currentFrame = (animInfo.currentFrame + 1) % totalFrames;
        }

        // Redraw frame
        const frameIndex =
            animation.frames ?
                (
                    typeof animation.frames[
                        animInfo.currentFrame % animation.frames.length
                    ] === "number"
                ) ?
                    (animation.frames[
                        animInfo.currentFrame % animation.frames.length
                    ] as number)
                :   (
                        animation.frames[
                            animInfo.currentFrame % animation.frames.length
                        ] as AnimationFrame
                    ).index
            :   animInfo.currentFrame;

        context.clearRect(0, 0, animInfo.canvas.width, animInfo.canvas.height);

        context.drawImage(
            sourceImage,
            0,
            frameIndex * frameHeight,
            animInfo.canvas.width,
            frameHeight,
            0,
            0,
            animInfo.canvas.width,
            frameHeight
        );

        animInfo.texture.needsUpdate = true;
    }
}

function applyRescale(mesh: THREE.Mesh, axis: Axis, angle: number) {
    const scaleFactor =
        1 + 1 / (Math.cos(THREE.MathUtils.degToRad(angle)) - 1) / 1.5;
    const scale = new THREE.Vector3(1, 1, 1);

    switch (axis) {
        case "x":
            scale.y = scaleFactor;
            scale.z = scaleFactor;
            break;
        case "y":
            scale.x = scaleFactor;
            scale.z = scaleFactor;
            break;
        case "z":
            scale.x = scaleFactor;
            scale.y = scaleFactor;
            break;
    }

    mesh.scale.copy(scale);
}

/* Main Component */

type Props = {
    model: MinecraftModel;
    scale?: Vector3;
    position?: Vector3;
    rotation?: Vector3;
    onLoaded?: () => void;
};

export default function MinecraftModelFromJSON({
    model,
    scale = [0.0625, 0.0625, 0.0625],
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    onLoaded,
}: Props) {
    const meshGroup = useRef<THREE.Group>(null);
    const [resolvedModel, setResolvedModel] = useState<MinecraftModel | null>(
        null
    );
    const [imageCache, setImageCache] = useState<
        Record<string, HTMLImageElement>
    >({});
    const [animatedTextures, setAnimatedTextures] = useState<
        Map<string, AnimatedTextureInfo>
    >(new Map());

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isTexturesLoaded, setIsTexturesLoaded] = useState(false);
    const [isMeshesGenerated, setIsMeshesGenerated] = useState(false);

    // Animation loop
    useFrame((_, delta) => {
        animatedTextures.forEach((animInfo) => {
            updateAnimatedTexture(animInfo, delta);
        });
    });

    // Load model and its parents
    useEffect(() => {
        let cancelled = false;
        setIsModelLoaded(false);

        async function loadModelWithParents(
            model: MinecraftModel
        ): Promise<MinecraftModel> {
            if (!model.parent) return model;

            let parentPath = model.parent;
            if (parentPath.startsWith("minecraft:")) {
                parentPath = parentPath.replace("minecraft:", "");
            }

            const parentUrl = `models/${parentPath}.json`;
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_ASSETS_BASE_URL}${parentUrl}`
                );
                if (!res.ok) throw new Error("Parent model not found");

                const parentJson: MinecraftModel = await res.json();
                const fullParent = await loadModelWithParents(parentJson);
                return mergeModels(model, fullParent);
            } catch (err) {
                console.warn("Erreur de chargement du modèle parent :", err);
                return model;
            }
        }

        loadModelWithParents(model).then((merged) => {
            if (!cancelled) {
                setResolvedModel(merged);
                setIsModelLoaded(true);
                console.log("Model loaded successfully");
            }
        });

        return () => {
            cancelled = true;
        };
    }, [model]);

    // Load textures
    useEffect(() => {
        if (!resolvedModel?.textures) return;

        setIsTexturesLoaded(false);

        const loadImages = async () => {
            const newAnimatedTextures = new Map<string, AnimatedTextureInfo>();
            const cache: Record<string, HTMLImageElement> = {};

            const imagePromises = Object.entries(resolvedModel.textures!).map(
                async ([_, path]) => {
                    if (path.startsWith("#")) return null;

                    let texturePath = path;
                    if (texturePath.startsWith("minecraft:")) {
                        texturePath = texturePath.replace("minecraft:", "");
                    }

                    const textureUrl = `${import.meta.env.VITE_ASSETS_BASE_URL}textures/${texturePath}.png`;

                    try {
                        const img = await new Promise<HTMLImageElement>(
                            (resolve, reject) => {
                                const image = new Image();
                                image.crossOrigin = "anonymous";
                                image.onload = () => resolve(image);
                                image.onerror = reject;
                                image.src = textureUrl;
                            }
                        );

                        // Load animation metadata
                        const animationMeta =
                            await loadAnimationMeta(texturePath);

                        return { texturePath, img, animationMeta };
                    } catch (error) {
                        console.warn(
                            `Error while loading texture ${textureUrl}:`,
                            error
                        );
                        return null;
                    }
                }
            );

            const results = await Promise.all(imagePromises);

            for (const result of results) {
                if (result) {
                    const { texturePath, img, animationMeta } = result;
                    cache[texturePath] = img;

                    // Create animated texture if metadata exists
                    if (animationMeta && img.width > 0) {
                        const animInfo = createAnimatedTexture(
                            img,
                            { texture: texturePath },
                            { from: [0, 0, 0], to: [16, 16, 16], faces: {} },
                            "up",
                            animationMeta
                        );
                        newAnimatedTextures.set(texturePath, animInfo);
                    }
                }
            }

            setImageCache(cache);
            setAnimatedTextures(newAnimatedTextures);
            setIsTexturesLoaded(true);
            console.log("Textures loaded successfully");
        };

        loadImages();
    }, [resolvedModel]);

    // Generate meshes from model elements
    const meshes = useMemo(() => {
        if (!resolvedModel?.elements || Object.keys(imageCache).length === 0) {
            setIsMeshesGenerated(false);
            return [];
        }

        const generatedMeshes = resolvedModel.elements.map((element, idx) => {
            const from = element.from;
            const to = element.to;

            // Calculate dimensions according to the reference: size = to - from
            const dimensions = size(from, to);

            const geometry = new THREE.BoxGeometry(...dimensions, 1, 1, 1);
            const materials: THREE.Material[] = [];

            geometry.scale(1.001, 1.001, 1.001); // Increase the size slightly to avoid z-fighting

            // Create materials for each face in the order of MATERIAL_FACE_ORDER
            for (const direction of MATERIAL_FACE_ORDER) {
                const face = element.faces[direction];

                // If no face is defined, use a transparent material
                if (!face) {
                    materials.push(
                        new THREE.MeshStandardMaterial({
                            visible: false,
                            transparent: true,
                        })
                        // new THREE.MeshBasicMaterial({
                        //     color: 0xff00ff,
                        //     wireframe: true,
                        //     transparent: false,
                        //     opacity: 1,
                        // })
                        // new THREE.MeshBasicMaterial({
                        //     color: DEBUG_FACE_COLORS[direction],
                        //     wireframe: false,
                        //     transparent: false,
                        //     opacity: 1,
                        // })
                    );
                    continue;
                }

                const decodedTexture = decodeTexture(
                    face.texture,
                    resolvedModel
                );

                if (!decodedTexture) {
                    // Default material if no texture is defined
                    let defaultColor = 0x999999;
                    if (face.texture === "#content") defaultColor = 0x3f76e4;

                    materials.push(
                        new THREE.MeshStandardMaterial({
                            color: defaultColor,
                            roughness: 1,
                            metalness: 0,
                            transparent: face.texture === "#content",
                            opacity: face.texture === "#content" ? 0.8 : 1.0,
                        })
                    );
                    continue;
                }

                let texturePath = decodedTexture;
                if (texturePath.startsWith("minecraft:")) {
                    texturePath = texturePath.replace("minecraft:", "");
                }

                const image = imageCache[texturePath];

                // If the image is not loaded or has no width, use a default material
                if (!image || !image.width) {
                    materials.push(
                        new THREE.MeshStandardMaterial({
                            color: 0x999999,
                            roughness: 1,
                            metalness: 0,
                        })
                    );
                    continue;
                }

                // Use the animated texture if it exists
                const animInfo = animatedTextures.get(texturePath);
                let texture: THREE.Texture;

                if (animInfo) {
                    texture = animInfo.texture;
                } else {
                    texture = createMinecraftTexture(
                        image,
                        face,
                        element,
                        direction
                    );
                }

                const shade = element.shade ?? true;

                const materialProps = {
                    map: texture,
                    transparent: true,
                    alphaTest: 0.1,
                };

                const material =
                    shade ?
                        new THREE.MeshStandardMaterial({
                            ...materialProps,
                            roughness: 1,
                            metalness: 0,
                        })
                    :   new THREE.MeshBasicMaterial({
                            ...materialProps,
                            color: 0xffffff,
                        });

                materials.push(material);
            }

            // Create the mesh with the geometry and materials
            const mesh = new THREE.Mesh(geometry, materials);

            // Adjusting the position to account for the Minecraft coordinate system
            mesh.position.set(
                (from[0] + to[0]) / 2 - 8,
                (from[1] + to[1]) / 2 - 8,
                (from[2] + to[2]) / 2 - 8
            );

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Apply rotation if specified
            if (element.rotation) {
                const { origin, axis, angle, rescale } = element.rotation;

                // Convert origin to a THREE.Vector3
                const pivot = new THREE.Vector3(
                    origin[0] - 8,
                    origin[1] - 8,
                    origin[2] - 8
                );

                // Move the mesh to the origin for rotation
                mesh.position.sub(pivot);

                // Apply rotation
                const rotationMatrix = new THREE.Matrix4();
                if (axis === "x") {
                    rotationMatrix.makeRotationX(
                        THREE.MathUtils.degToRad(angle)
                    );
                } else if (axis === "y") {
                    rotationMatrix.makeRotationY(
                        THREE.MathUtils.degToRad(angle)
                    );
                } else if (axis === "z") {
                    rotationMatrix.makeRotationZ(
                        THREE.MathUtils.degToRad(angle)
                    );
                }

                mesh.applyMatrix4(rotationMatrix);

                if (rescale) {
                    applyRescale(mesh, axis, angle);
                }

                // Reposition the mesh back to its original position
                mesh.position.add(pivot);
            }
            return <primitive key={`element-${idx}`} object={mesh} />;
        });

        setIsMeshesGenerated(true);
        console.log("Meshes generated successfully");
        return generatedMeshes;
    }, [resolvedModel, imageCache, animatedTextures]);

    // Check if the model, textures, and meshes are loaded
    useEffect(() => {
        if (isModelLoaded && isTexturesLoaded && isMeshesGenerated) {
            // Delay to ensure all updates are applied
            const timeoutId = setTimeout(() => {
                console.log("Model, textures, and meshes are ready");
                onLoaded?.();
            }, 20);

            return () => clearTimeout(timeoutId);
        }
    }, [isModelLoaded, isTexturesLoaded, isMeshesGenerated]);

    if (!resolvedModel) {
        return null;
    }

    return (
        <group
            ref={meshGroup}
            scale={scale}
            position={position}
            rotation={rotation}
        >
            {meshes}
        </group>
    );
}
