import type { MinecraftModel } from "./types";

export async function parseModel(blockName: string): Promise<MinecraftModel> {
    let { parent, ...model } = await getModelFile(blockName);

    if (parent) {
        model = deepAssign({}, await parseModel(parent), model);

        if (!model.parents) {
            model.parents = [];
        }

        model.parents.push(parent);
    }

    return deepAssign(model, { blockName });
}

export function deepAssign(target: any, ...sources: any[]): any {
    for (const source of sources) {
        if (!source) continue;

        for (const key of Object.keys(source)) {
            const val = source[key];

            if (val && typeof val === "object" && !Array.isArray(val)) {
                target[key] ??= {};
                deepAssign(target[key], val);
            } else {
                target[key] = val;
            }
        }
    }
    return target;
}

export async function getModelFile(blockName: string): Promise<any> {
    const cleanName = blockName
        .replace(/^minecraft:/, "")
        .replace(/^block\//, "");

    const url = `${import.meta.env.VITE_ASSETS_BASE_URL}/models/block/${cleanName}.json`;

    console.log(`Fetching model: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Error while loading ${blockName}: ${res.status}`);
    }

    return res.json();
}
