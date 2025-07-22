import { IsometricRenderer } from "../../IsometricRenderer";

type Props = {
    currentModel: any;
    registerExportFunction: (
        blockName: string,
        func: () => Promise<string>
    ) => void;
};

export default function ExporterPreview({
    currentModel,
    registerExportFunction,
}: Props) {
    if (!currentModel) return null;
    return (
        <div className="flex flex-col items-center mt-4 text-white/90">
            Preview:
            <IsometricRenderer
                className="size-32"
                model={currentModel.data}
                onExportReady={(exportFunc) => {
                    registerExportFunction(currentModel.name, exportFunc);
                }}
            />
        </div>
    );
}
