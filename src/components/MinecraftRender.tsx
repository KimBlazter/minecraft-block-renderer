import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MinecraftModelFromJSON from "./MinecraftModelFromJSON";
import { useOptions } from "../stores/options";

export default function MinecraftRender({ model }: { model?: any }) {
    const options = useOptions();
    return (
        <Canvas
            camera={{ position: [5, 5, 5], fov: 45, zoom: 0.75 }}
            gl={{ antialias: true, logarithmicDepthBuffer: true }}
        >
            <ambientLight intensity={Math.PI / 2} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                decay={0}
                intensity={Math.PI}
            />
            <pointLight
                position={[-10, -10, -10]}
                decay={0}
                intensity={Math.PI}
            />

            {model && (
                <MinecraftModelFromJSON
                    model={model}
                    position={[0, 0.5, 0]}
                    onLoaded={() => {
                        console.log("Model and textures loaded");
                    }}
                />
            )}

            <OrbitControls autoRotate={options.autoRotate} />
            {options.showGrid && (
                <gridHelper args={[10]} position={[0, -0.01, 0]} />
            )}
            {options.showAxes && <axesHelper args={[2]} position={[0, 0, 0]} />}
        </Canvas>
    );
}
