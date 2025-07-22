import { useRef, useState, useEffect } from "react";
import JSZip from "jszip";
import useSWR from "swr";
import { saveAs } from "file-saver";
import { dataURLtoBlob } from "./file";
import { createSpritemap } from "./spritemap";

type FetchAssets = {
    models: { block: string[]; item: string[] };
    textures: { block: string[]; item: string[] };
};
type TextureData = { name: string; path: string; type: "block" | "item" };
type ExportMode = "individual" | "spritemap";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const IGNORED_BLOCKS: string[] = [
    "bed",
    "banner",
    "conduit",
    "end_portal",
    "end_gateway",
    "chest",
    "trapped_chest",
    "shulker_box",
    "ender_chest",
    "moving_piston",
    "piston_extended",
    "structure_void",
    "decorated_pot",
    "flower_pot_cross",
    "flower_pot_cross_emissive",
    "tinted_flower_pot_cross",
    "leaves",
    "sunflower_top",
    "block",
    "thin_block",
    "barrier",
    "air",
    "water",
    "lava",
    "sniffer_egg",
    "fence_inventory",
    "custom_fence_inventory",
    "fence_post",
    "custom_fence_post",
    "brewing_stand_bottle1",
    "brewing_stand_empty1",
    "button",
    "button_inventory",
    "button_pressed",
    "carpet",
    "coral_fan",
    "crop",
    "cross",
    "cross_emissive",
    "tinted_cross",
    "skull",
    "stairs",
    "slab",
    "slab_top",
    "inner_stairs",
    "outer_stairs",
    "iron_bars_post",
    "iron_bars_post_ends",
    "orientable",
    "orientable_vertical",
    "orientable_with_bottom",
    "stem_fruit",
    "tripwire_attached_n", // -- BEGIN: Exclude tripwire hook models --
    "tripwire_attached_ne",
    "tripwire_attached_ns",
    "tripwire_attached_nse",
    "tripwire_attached_nsew",
    "tripwire_n",
    "tripwire_ne",
    "tripwire_ns",
    "tripwire_nse",
    "tripwire_nsew", // -- END: Exclude tripwire hook models --
    "wall_inventory",
    "pointed_dripstone",
    "heavy_core",
];

function shouldIgnoreModel(modelName: string): boolean {
    return (
        IGNORED_BLOCKS.includes(modelName) ||
        modelName.startsWith("template") ||
        modelName.startsWith("light") ||
        modelName.endsWith("sign") || // Excluse signs models because items textures are used instead
        modelName.includes("button_pressed") || // Exclude button pressed models
        modelName.includes("rail") || // Exclude rail models
        modelName.startsWith("bell") || // Exclude bell models
        modelName.startsWith("lantern") || // Exclude lantern models
        modelName.startsWith("soul_lantern") || // Exclude soul lantern models
        modelName.startsWith("flowerbed") || // Exclude flowerbed models
        modelName.startsWith("pink_petals") || // Exclude pink petals models
        modelName.startsWith("wildflowers") || // Exclude wildflowers models
        modelName.startsWith("pitcher_crop_top_stage") || // Exclude pitcher crop top stage models
        modelName.includes("shulker_box") || // Exclude shulker box models
        modelName.includes("_door_") || // Exclude door models
        modelName.includes("fire_floor") || //
        modelName.startsWith("stem_growth") || // Exclude stem growth template models
        modelName.endsWith("wall_fan") || // Exclude coral wall fan models
        modelName.includes("_side") || // Exclude side models (e.g. "glass_panes", "fence_side", "wall_side", ...)
        modelName.includes("_noside") || // Exclude noside models (e.g. "glass_panes_noside", "fence_noside", "wall_noside", ...)
        modelName.includes("_down") || // Exclude down models
        modelName.includes("_up") || // Exclude models with "_up" suffix (e.g. "dripstone", "fire_up", ...)
        modelName.startsWith("cube") || // Exclude template cube models
        modelName.includes("glass_pane") || // Exclude glass pane models
        modelName.endsWith("_bottom_left") || // -- BEGIN: Exclude door models --
        modelName.endsWith("_bottom_left_open") || // ---------------------------
        modelName.endsWith("_bottom_right") || // -------------------------------
        modelName.endsWith("_bottom_right_open") || // --------------------------
        modelName.endsWith("_top_left") || // -----------------------------------
        modelName.endsWith("_top_left_open") || // ------------------------------
        modelName.endsWith("_top_right") || // ----------------------------------
        modelName.endsWith("_top_right_open") || // -- END: Exclude door models -
        modelName.endsWith("_cap") || // Exclude cap models (iron bars, maybe others idk...
        modelName.endsWith("_cap_alt") || // Exclude alternate cap models
        (modelName.includes("chiseled_bookshelf") &&
            !modelName.includes("inventory")) || // Exclude chiseled bookshelf models except one for inventory
        (modelName.includes("tripwire_hook") &&
            modelName !== "tripwire_hook" &&
            modelName !== "tripwire_hook_on") // Exclude tripwire hook models except one for inventory
    );
}

export function useExporterLogic() {
    const [isExporting, setIsExporting] = useState(false);
    const [shouldStopExport, setShouldStopExport] = useState(false);
    const [loadedModels, setLoadedModels] = useState<any[]>([]);
    const [itemTextures, setItemTextures] = useState<TextureData[]>([]);
    const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStatus, setExportStatus] = useState<string>("");
    const [exportMode, setExportMode] = useState<ExportMode>("individual");
    const currentExportFunction = useRef<(() => Promise<string>) | null>(null);
    const currentZip = useRef<JSZip | null>(null);
    const exportedCount = useRef<number>(0);

    const { data: assetsData, error } = useSWR<FetchAssets>(
        "/assets-index.json",
        fetcher
    );

    useEffect(() => {
        if (!assetsData) return;
        const loadAllAssets = async () => {
            const loadedModelsData: any[] = [];
            const allItemTextures: TextureData[] = [];
            for (const blockPath of assetsData.models.block) {
                const modelName =
                    blockPath.split("/").pop()?.replace(".json", "") ||
                    blockPath;
                // Ignore unwanted blocks models and those starting with "template"
                if (shouldIgnoreModel(modelName)) continue;
                try {
                    const url = `${import.meta.env.VITE_ASSETS_BASE_URL}${blockPath}`;
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        loadedModelsData.push({
                            data,
                            name: modelName,
                            path: blockPath,
                            type: "block",
                        });
                    }
                } catch (error) {
                    /* ignore */
                }
            }
            for (const texturePath of assetsData.textures.item) {
                const textureName =
                    texturePath.split("/").pop()?.replace(".png", "") ||
                    texturePath;
                allItemTextures.push({
                    name: textureName,
                    path: texturePath,
                    type: "item",
                });
            }
            setLoadedModels(loadedModelsData);
            setItemTextures(allItemTextures);
        };
        loadAllAssets();
    }, [assetsData]);

    const registerExportFunction = (
        blockName: string,
        func: () => Promise<string>
    ) => {
        const currentModel = loadedModels[currentRenderIndex];
        if (currentModel && currentModel.name === blockName) {
            currentExportFunction.current = func;
        }
    };

    // Unused export function, can be used to stop export and generate a partial ZIP
    const stopExportAndGenerateZip = async () => {
        setShouldStopExport(true);
        if (currentZip.current && exportedCount.current > 0) {
            try {
                const content = await currentZip.current.generateAsync({
                    type: "blob",
                });
                const suffix =
                    exportMode === "spritemap" ? "spritemaps" : "individual";
                saveAs(
                    content,
                    `minecraft_${suffix}_partial_${exportedCount.current}.zip`
                );
            } catch {}
        }
    };

    const exportAll = async () => {
        setIsExporting(true);
        setExportProgress(0);
        setShouldStopExport(false);
        exportedCount.current = 0;

        const zip = new JSZip();
        currentZip.current = zip;

        try {
            if (exportMode === "individual") {
                await exportIndividualFiles(zip);
            } else {
                await exportSpritemap(zip);
            }
        } catch (error) {
            console.error("Error during export:", error);
        } finally {
            setIsExporting(false);
            setExportProgress(0);
            setExportStatus("");
            setShouldStopExport(false);
            setCurrentRenderIndex(0);
            currentZip.current = null;
            exportedCount.current = 0;
        }
    };

    const exportIndividualFiles = async (zip: JSZip) => {
        const blockFolder = zip.folder("blocks");
        const itemFolder = zip.folder("items");

        if (!blockFolder || !itemFolder) {
            throw new Error("Could not create folders in ZIP");
        }

        const totalAssets = loadedModels.length + itemTextures.length;
        let processedCount = 0;

        // Export block models
        setExportStatus("Exporting block models...");
        for (let i = 0; i < loadedModels.length; i++) {
            if (shouldStopExport) {
                console.log(
                    `Export stopped by user at block model ${i + 1}/${loadedModels.length}`
                );
                break;
            }

            const model = loadedModels[i];
            setCurrentRenderIndex(i);

            // Wait for the render to be ready
            await new Promise((resolve) => {
                const checkReady = () => {
                    if (currentExportFunction.current) {
                        resolve(undefined);
                    } else {
                        setTimeout(checkReady, 10);
                    }
                };
                checkReady();
            });

            try {
                if (currentExportFunction.current) {
                    console.log(`Exporting block model: ${model.name}`);
                    const imageData = await currentExportFunction.current();
                    const blob = dataURLtoBlob(imageData);

                    blockFolder.file(`${model.name}.png`, blob);
                    exportedCount.current++;
                    console.log(
                        `Successfully exported block: ${model.name} (${exportedCount.current}/${totalAssets})`
                    );
                } else {
                    console.warn(
                        `No export function available for model: ${model.name}`
                    );
                }
            } catch (error) {
                console.error(`Failed to export ${model.name}:`, error);
            }

            processedCount++;
            setExportProgress(Math.round((processedCount / totalAssets) * 100));
        }

        // Export item textures
        if (!shouldStopExport && itemTextures.length > 0) {
            setExportStatus("Exporting item textures...");

            for (let i = 0; i < itemTextures.length; i++) {
                if (shouldStopExport) {
                    console.log(
                        `Export stopped by user at item texture ${i + 1}/${itemTextures.length}`
                    );
                    break;
                }

                const texture = itemTextures[i];

                try {
                    console.log(`Exporting item texture: ${texture.name}`);
                    const url = `${import.meta.env.VITE_ASSETS_BASE_URL}${texture.path}`;
                    const response = await fetch(url);

                    if (response.ok) {
                        const blob = await response.blob();
                        itemFolder.file(`${texture.name}.png`, blob);
                        exportedCount.current++;
                        console.log(
                            `Successfully exported texture: ${texture.name} (${exportedCount.current}/${totalAssets})`
                        );
                    } else {
                        console.warn(
                            `Failed to fetch texture: ${texture.name}`
                        );
                    }
                } catch (error) {
                    console.error(
                        `Failed to export texture ${texture.name}:`,
                        error
                    );
                }

                processedCount++;
                setExportProgress(
                    Math.round((processedCount / totalAssets) * 100)
                );
            }
        }

        // Generate final ZIP
        if (exportedCount.current > 0) {
            setExportStatus("Generating ZIP file...");
            console.log(
                `Generating ZIP with ${exportedCount.current} assets...`
            );
            const content = await zip.generateAsync({ type: "blob" });
            const fileName =
                shouldStopExport ?
                    `minecraft_individual_partial_${exportedCount.current}.zip`
                :   `minecraft_individual_complete_${exportedCount.current}.zip`;
            saveAs(content, fileName);
            console.log(`ZIP generated successfully: ${fileName}`);
        } else {
            console.warn("No assets were exported, no ZIP generated");
        }
    };

    const exportSpritemap = async (zip: JSZip) => {
        const totalAssets = loadedModels.length + itemTextures.length;
        let processedCount = 0;

        const blockImages: { name: string; dataUrl: string }[] = [];
        const itemImages: { name: string; blob: Blob }[] = [];

        setExportStatus("Rendering block models...");
        for (let i = 0; i < loadedModels.length; i++) {
            if (shouldStopExport) {
                console.log(
                    `Export stopped by user at block model ${i + 1}/${loadedModels.length}`
                );
                break;
            }

            const model = loadedModels[i];
            setCurrentRenderIndex(i);

            // Wait for the render to be ready
            await new Promise((resolve) => {
                const checkReady = () => {
                    if (currentExportFunction.current) {
                        resolve(undefined);
                    } else {
                        setTimeout(checkReady, 10);
                    }
                };
                checkReady();
            });

            try {
                if (currentExportFunction.current) {
                    console.log(`Rendering block model: ${model.name}`);
                    const imageData = await currentExportFunction.current();
                    blockImages.push({
                        name: "block:" + model.name,
                        dataUrl: imageData,
                    });
                    exportedCount.current++;
                    console.log(
                        `Successfully rendered block: ${model.name} (${exportedCount.current}/${totalAssets})`
                    );
                    currentExportFunction.current = null; // Reset after export
                } else {
                    console.warn(
                        `No export function available for model: ${model.name}`
                    );
                }
            } catch (error) {
                console.error(`Failed to render ${model.name}:`, error);
            }

            processedCount++;
            setExportProgress(Math.round((processedCount / totalAssets) * 100));
        }

        // Collect item textures
        if (!shouldStopExport && itemTextures.length > 0) {
            setExportStatus("Loading item textures...");

            for (let i = 0; i < itemTextures.length; i++) {
                if (shouldStopExport) {
                    console.log(
                        `Export stopped by user at item texture ${i + 1}/${itemTextures.length}`
                    );
                    break;
                }

                const texture = itemTextures[i];

                try {
                    console.log(`Loading item texture: ${texture.name}`);
                    const url = `${import.meta.env.VITE_ASSETS_BASE_URL}${texture.path}`;
                    const response = await fetch(url);

                    if (response.ok) {
                        const blob = await response.blob();
                        itemImages.push({ name: "item:" + texture.name, blob });
                        exportedCount.current++;
                        console.log(
                            `Successfully loaded texture: ${texture.name} (${exportedCount.current}/${totalAssets})`
                        );
                    } else {
                        console.warn(
                            `Failed to fetch texture: ${texture.name}`
                        );
                    }
                } catch (error) {
                    console.error(
                        `Failed to load texture ${texture.name}:`,
                        error
                    );
                }

                processedCount++;
                setExportProgress(
                    Math.round((processedCount / totalAssets) * 100)
                );
            }
        }

        // Combine and sort all images alphabetically
        if (blockImages.length > 0 || itemImages.length > 0) {
            setExportStatus("Creating combined spritemap...");

            // Convert block images to the same format as items
            const blockImagesConverted: { name: string; blob: Blob }[] = [];
            for (const blockImage of blockImages) {
                // Convertir dataUrl en blob
                const response = await fetch(blockImage.dataUrl);
                const blob = await response.blob();
                blockImagesConverted.push({ name: blockImage.name, blob });
            }

            // Combine all images
            const allImages = [...blockImagesConverted, ...itemImages];

            // Sort alphabetically
            allImages.sort((a, b) => a.name.localeCompare(b.name));

            console.log(
                `Creating combined spritemap with ${allImages.length} assets sorted alphabetically`
            );

            // Create combined spritemap
            const { canvas: combinedCanvas, metadata: combinedMetadata } =
                await createSpritemap(allImages, 64);

            // Convert canvas to blob
            const combinedBlob = await new Promise<Blob>((resolve) => {
                combinedCanvas.toBlob((blob) => resolve(blob!), "image/png");
            });

            zip.file("combined_spritemap.png", combinedBlob);
            zip.file(
                "combined_spritemap.json",
                JSON.stringify(combinedMetadata, null, 2)
            );
            console.log(
                `Created combined spritemap with ${allImages.length} assets in alphabetical order`
            );
        }

        // Generate final ZIP
        if (exportedCount.current > 0) {
            setExportStatus("Generating ZIP file...");
            console.log(
                `Generating spritemap ZIP with ${exportedCount.current} assets...`
            );
            const content = await zip.generateAsync({ type: "blob" });
            const fileName =
                shouldStopExport ?
                    `minecraft_spritemaps_partial_${exportedCount.current}.zip`
                :   `minecraft_spritemaps_complete_${exportedCount.current}.zip`;
            saveAs(content, fileName);
            console.log(`Spritemap ZIP generated successfully: ${fileName}`);
        } else {
            console.warn("No assets were exported, no ZIP generated");
        }
    };
    // --- End export logic ---

    const currentModel = loadedModels[currentRenderIndex];
    const totalAssets = loadedModels.length + itemTextures.length;

    return {
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
    };
}
