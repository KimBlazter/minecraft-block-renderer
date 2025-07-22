import { useExporterLogic } from "../utils/useExporterLogic";
import ExporterModeSelector from "./ui/exporter/ExporterModelSelector";
import ExporterPreview from "./ui/exporter/ExporterPreview";
import ExporterProgress from "./ui/exporter/ExporterProgress";
import Throbber from "../components/ui/Throbber";
import { TbPackageExport, TbGrid3X3 } from "react-icons/tb";

export default function Exporter() {
    const {
        isExporting,
        exportProgress,
        exportStatus,
        exportedCount,
        totalAssets,
        exportMode,
        setExportMode,
        exportAll,
        stopExportAndGenerateZip,
        loadedModels,
        itemTextures,
        currentModel,
        currentRenderIndex,
        setCurrentRenderIndex,
        registerExportFunction,
        error,
    } = useExporterLogic();

    if (error) {
        return (
            <div className="text-red-500 p-4 bg-gray-700 rounded-md">
                Error while loading assets: {error.message}
            </div>
        );
    }

    if (!loadedModels.length) {
        return (
            <div className="flex items-center justify-center p-4 px-8 bg-gray-700 rounded-md text-white/70">
                <div className="flex items-center gap-2 text-base">
                    <Throbber />
                    Loading models and textures...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-600 p-4 rounded-md flex flex-col items-center text-white">
            <h2 className="text-lg mr-auto mb-1">Export: </h2>
            <div className="text-sm text-white/70 mr-auto mb-2">
                {loadedModels.length} block models • {itemTextures.length} item
                textures
            </div>

            <ExporterModeSelector
                exportMode={exportMode}
                setExportMode={setExportMode}
                isExporting={isExporting}
            />

            <div className="flex gap-4">
                <button
                    onClick={exportAll}
                    disabled={isExporting}
                    title={`Export all models and textures as ${exportMode === "spritemap" ? "spritemaps" : "individual files"}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md disabled:opacity-50"
                >
                    {isExporting ?
                        `Exporting... ${exportProgress}%`
                    :   <span className="flex flex-row items-center gap-1">
                            {exportMode === "spritemap" ?
                                <TbGrid3X3 size={20} />
                            :   <TbPackageExport size={20} />}
                            Export All ({totalAssets})
                        </span>
                    }
                </button>
                {/* {isExporting && (
                    <button
                        onClick={stopExportAndGenerateZip}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-md"
                        title="Stop export and generate partial ZIP"
                    >
                        <FaStop />
                    </button>
                )} */}
            </div>

            <ExporterProgress
                isExporting={isExporting}
                exportProgress={exportProgress}
                exportStatus={exportStatus}
                exportedCount={exportedCount}
                totalAssets={totalAssets}
            />

            <ExporterPreview
                currentModel={currentModel}
                registerExportFunction={registerExportFunction}
            />
        </div>
    );
}
