type Props = {
    isExporting: boolean;
    exportProgress: number;
    exportStatus: string;
    exportedCount: React.RefObject<number>;
    totalAssets: number;
};

export default function ExporterProgress({
    isExporting,
    exportProgress,
    exportStatus,
    exportedCount,
    totalAssets,
}: Props) {
    if (!isExporting) return null;
    return (
        <>
            <div className="bg-white/40 rounded-full h-2 w-full mb-2 mt-3">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                ></div>
            </div>
            <div className="text-sm text-white/70 text-center">
                <div>{exportStatus}</div>
                <div className="mt-1">
                    {exportedCount.current} / {totalAssets} assets processed
                </div>
            </div>
        </>
    );
}
