import { useState, useMemo } from "react";
import useSWR from "swr";

type FetchAssets = {
    models: {
        block: string[];
        item: string[];
    };
    textures: {
        block: string[];
        item: string[];
    };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ModelSelector({
    onChange,
}: {
    onChange: (path: any | undefined) => void;
}) {
    const { data, error } = useSWR<FetchAssets>("/assets-index.json", fetcher);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "block" | "item">("all");
    const [selected, setSelected] = useState<string | undefined>(undefined);
    const [isEditing, setIsEditing] = useState(false);

    const filteredModels = useMemo(() => {
        if (!data) return [];
        let models: string[] = [];
        if (filter === "block") models = data.models.block;
        else if (filter === "item") models = data.models.item;
        else models = [...data.models.block, ...data.models.item];

        return models.filter((model: string) =>
            model.toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search, filter]);

    if (error) {
        console.error(error);
        <div className="text-red-500 p-4 bg-red-100 border border-red-300 rounded">
            An error occurred while loading the assets. Please try again later.
        </div>;
    }
    if (!data) return <div>Loading...</div>;

    const handleSelect = async (modelPath: string) => {
        try {
            const url = `${import.meta.env.VITE_ASSETS_BASE_URL}/${modelPath}`;
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(
                    `Error loading model: ${modelPath} (Status: ${res.status})`
                );
            const json = await res.json();
            setSelected(modelPath);
            onChange?.(json);
            setIsEditing(false); // Leaving edit mode after selection
        } catch (err) {
            console.error("Selection error :", err);
            onChange?.(undefined);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const selectedName =
        selected?.split("/").pop()?.replace(".json", "") ?? selected;

    return (
        <div className="absolute top-0 right-0 w-96 flex flex-col bg-gray-600 p-4 m-4 gap-3 text-white rounded text-sm shadow-lg z-10">
            {!isEditing && selected ?
                <div className="flex flex-col gap-2">
                    <div className="p-3 bg-gray-800 rounded border border-gray-600">
                        <div className="text-gray-400 text-xs">
                            Selected model :
                        </div>
                        <div className="font-semibold text-base">
                            {selectedName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {selected}
                        </div>
                    </div>
                    <button
                        onClick={handleEdit}
                        className="self-end text-blue-400 hover:text-blue-200 underline text-xs"
                    >
                        Change selection
                    </button>
                </div>
            :   <>
                    <div className="flex gap-2 items-center">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        >
                            <option value="all">All</option>
                            <option value="block">Blocks</option>
                            <option value="item">Items</option>
                        </select>

                        <div className="relative w-full flex flex-row items-center">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="flex-1 px-2 py-1 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-600 w-full"
                            />
                            {search && (
                                <span
                                    className="absolute right-2 cursor-pointer text-gray-400 hover:text-white"
                                    onClick={() => setSearch("")}
                                >
                                    ×
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-80 rounded flex flex-col gap-1 w-full overflow-x-hidden bg-gray-800 p-2">
                        {filteredModels.map((modelPath: string) => {
                            const name =
                                modelPath
                                    .split("/")
                                    .pop()
                                    ?.replace(".json", "") ?? modelPath;
                            return (
                                <button
                                    key={modelPath}
                                    onClick={() => handleSelect(modelPath)}
                                    className="w-full text-left px-2 py-1 hover:bg-gray-600 rounded text-ellipsis"
                                >
                                    {name}
                                </button>
                            );
                        })}
                        {filteredModels.length === 0 && (
                            <div className="text-gray-400 px-2 py-1">
                                No models found.
                            </div>
                        )}
                    </div>
                </>
            }
        </div>
    );
}
