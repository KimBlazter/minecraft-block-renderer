import clsx from "clsx";
import { useState } from "react";
import { MdContentCopy, MdCheck, MdKeyboardArrowUp } from "react-icons/md";

export default function ModelDebug({ modelData }: { modelData: any }) {
    const [isCopied, setIsCopied] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!modelData) return null;

    const copyToClipboard = () => {
        navigator.clipboard
            .writeText(JSON.stringify(modelData, null, 4))
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            })
            .catch((error) => {
                console.error("Failed to copy model data:", error);
            });
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="absolute bottom-0 left-0 w-3/10 m-4">
            <div
                className={clsx(
                    "flex flex-col bg-gray-600 p-4 gap-2 text-white text-sm rounded-lg",
                    isCollapsed ? "h-15" : "max-h-[50vh]"
                )}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg">Model debug:</h2>
                    {/* Buttons */}
                    <div className="flex flex-row items-center gap-2">
                        <button
                            className="!px-2 !py-2 flex items-center gap-1"
                            onClick={copyToClipboard}
                            aria-label={
                                isCopied ? "Copied!" : "Copy to clipboard"
                            }
                            title="Copy to clipboard"
                        >
                            {isCopied ?
                                <>
                                    <MdCheck
                                        size={16}
                                        className="text-green-400"
                                    />
                                    <span className="text-xs">Copied!</span>
                                </>
                            :   <MdContentCopy size={16} />}
                        </button>
                        <button
                            className="!p-1 !bg-gray-700 hover:!bg-gray-800 rounded-full !border-0 flex items-center justify-center !transition-all"
                            onClick={toggleCollapse}
                            aria-label={isCollapsed ? "Expand" : "Collapse"}
                            title={isCollapsed ? "Expand" : "Collapse"}
                        >
                            <MdKeyboardArrowUp
                                size={24}
                                className={clsx(
                                    isCollapsed ? "rotate-0" : "rotate-180",
                                    "transition-all delay-100"
                                )}
                            />
                        </button>
                    </div>
                </div>

                <pre
                    className={`w-full border-gray-600 bg-gray-800 rounded-md px-4 py-6 overflow-y-auto relative ${isCollapsed ? "hidden" : "block"}`}
                >
                    <code className="w-full">
                        {JSON.stringify(modelData, null, 4)}
                    </code>
                </pre>
            </div>
        </div>
    );
}
