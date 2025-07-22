import { TbPackageExport, TbGrid3X3 } from "react-icons/tb";

type Props = {
    exportMode: "individual" | "spritemap";
    setExportMode: (mode: "individual" | "spritemap") => void;
    isExporting: boolean;
};

export default function ExporterModeSelector({
    exportMode,
    setExportMode,
    isExporting,
}: Props) {
    return (
        <div className="w-full mb-4">
            <label className="block text-sm font-medium mb-2">
                Export Mode:
            </label>
            <div className="flex gap-2">
                <button
                    onClick={() => setExportMode("individual")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        exportMode === "individual" ?
                            "bg-blue-600 text-white"
                        :   "bg-gray-500 text-gray-200 hover:bg-gray-400"
                    }`}
                    disabled={isExporting}
                >
                    <TbPackageExport className="inline mr-1" />
                    Individual Files
                </button>
                <button
                    onClick={() => setExportMode("spritemap")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        exportMode === "spritemap" ?
                            "bg-blue-600 text-white"
                        :   "bg-gray-500 text-gray-200 hover:bg-gray-400"
                    }`}
                    disabled={isExporting}
                >
                    <TbGrid3X3 className="inline mr-1" />
                    Spritemap
                </button>
            </div>
            <div className="text-xs text-white/60 mt-1">
                {exportMode === "individual" ?
                    "Export each asset as a separate file in folders"
                :   "Combine all assets into two spritemaps (blocks & items)"}
            </div>
        </div>
    );
}
