import { Canvas, useThree } from "@react-three/fiber";
import MinecraftModelFromJSON from "./MinecraftModelFromJSON";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export function IsometricRenderer({
    model,
    size = 500,
    onExportReady,
    className,
}: {
    model?: any;
    size?: number;
    onExportReady?: (exportFunction: () => Promise<string>) => void;
    className?: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const cameraSize = 20;
    const cameraZoom = size / (cameraSize * 2);

    const exportModelAsImage = async (): Promise<string> => {
        if (!canvasRef.current) throw new Error("Canvas reference is not set");

        const canvas = canvasRef.current;
        return new Promise<string>((resolve) => {
            // Delay to ensure the rendering is complete
            // setTimeout(() => {
            //     const dataUrl = canvas.toDataURL("image/png");
            //     resolve(dataUrl);
            // }, 50);
            const dataUrl = canvas.toDataURL("image/png");
            resolve(dataUrl);
        });
    };

    // Callback called when the model is loaded
    const handleModelLoaded = () => {
        console.log("Model loaded successfully");
        setIsModelLoaded(true);
    };

    // Effect to export the model as an image when it's loaded
    useEffect(() => {
        if (isModelLoaded) {
            onExportReady?.(exportModelAsImage);
        }
    }, [isModelLoaded]);

    // Reset model when the model prop changes
    useEffect(() => {
        setIsModelLoaded(false);
        console.log("Model prop changed, resetting state");
    }, [model]);

    return (
        <Canvas
            ref={canvasRef}
            gl={{
                antialias: false,
                alpha: true,
                logarithmicDepthBuffer: true,
                preserveDrawingBuffer: true,
                powerPreference: "high-performance",
                stencil: false,
            }}
            camera={{
                position: [32, 0, 0], // Isometric view position
                near: 0.01,
                far: 20000,
                zoom: cameraZoom,
                left: -cameraSize / 2,
                right: cameraSize / 2,
                top: cameraSize / 2,
                bottom: -cameraSize / 2,
            }}
            orthographic
            className={clsx(
                "border border-white !w-32 !h-32 bg-white/10",
                className
            )}
        >
            <CameraBoom
                rotation={[
                    THREE.MathUtils.degToRad(0),
                    THREE.MathUtils.degToRad(45),
                    THREE.MathUtils.degToRad(30),
                ]}
            />
            {model && (
                <MinecraftModelFromJSON
                    model={model}
                    position={[0, 0, 0]}
                    rotation={[0, -Math.PI / 2, 0]} // Rotate the model for isometric view
                    onLoaded={handleModelLoaded}
                />
            )}

            {/* Lighting */}
            <ambientLight intensity={0.75} color="#ffffff" />
            <SceneLight intensity={0.98} position={[0, 1, 0]} />
            <SceneLight intensity={0.8} position={[1, 0, 0]} />
            <SceneLight intensity={0.608} position={[-1, 0, -0.5]} />

            {/* Helpers */}
            {/* <gridHelper args={[10, 10]} position={[0, -0.5, 0]} />
            <axesHelper args={[5]} /> */}
        </Canvas>
    );
}

// CameraBoom component to adjust camera rotation
function CameraBoom({ rotation }: { rotation: [number, number, number] }) {
    const { camera } = useThree();

    return (
        <group rotation={rotation} rotation-order="YXZ">
            <primitive object={camera} />
        </group>
    );
}

export const SceneLight = ({
    intensity,
    position,
}: {
    intensity: number;
    position: [number, number, number];
}) => (
    <directionalLight
        color="#ffffff"
        intensity={2.85 * intensity}
        lookAt={[0, 0, 0]}
        position={position}
    />
);
