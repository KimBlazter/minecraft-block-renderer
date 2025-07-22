import { useState } from "react";
import ModelSelector from "./components/ModelSelector";
import ModelDebug from "./components/ModelDebug";
import MinecraftRender from "./components/MinecraftRender";
import Exporter from "./components/Exporter";
import Options from "./components/Options";

export default function App() {
    const [modelData, setModelData] = useState<any | undefined>(undefined);
    return (
        <div className="h-full w-full flex flex-col items-center relative">
            <div className="absolute top-0 left-0 z-10 p-2">
                <Exporter />
            </div>
            <MinecraftRender model={modelData} />
            <ModelSelector onChange={setModelData} />
            <Options />
            <ModelDebug modelData={modelData} />
        </div>
    );
}
