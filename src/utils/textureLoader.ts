/**
 * Loads a texture image from the assets server.
 * @param textureName The name of the texture, e.g. "stone" or "oak_log_top"
 */
export async function getTextureImage(
    textureUrl: string
): Promise<HTMLImageElement> {
    const url = `${import.meta.env.VITE_ASSETS_BASE_URL}textures/${textureUrl}.png`;
    console.log("Fetching texture from:", url);

    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
        throw new Error(
            `Failed to fetch image: ${url} (status ${response.status})`
        );
    }
    const blob = await response.blob();

    const imageUrl = URL.createObjectURL(blob);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;

    await new Promise<void>((resolve, reject) => {
        image.onload = () => {
            URL.revokeObjectURL(imageUrl); // Release the resource
            resolve();
        };
        image.onerror = () => {
            URL.revokeObjectURL(imageUrl);
            reject(
                new Error(
                    `Failed to load image element from blob URL: ${imageUrl}`
                )
            );
        };
    });

    return image;
}

/**
 * Loads the animation metadata for the texture (if any).
 * @param textureName The name of the texture, e.g. "stone"
 * @returns An object with animation info, or null if not animated or file missing
 */
export async function getTextureMeta(
    textureName: string
): Promise<{ frametime: number } | null> {
    const url = `${import.meta.env.VITE_ASSETS_BASE_URL}textures/${textureName}.png.mcmeta`;

    try {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) {
            // File .mcmeta missing or HTTP error: consider not animated
            return null;
        }

        const json = await response.json();

        if (
            !json ||
            typeof json !== "object" ||
            !json.animation ||
            typeof json.animation.frametime !== "number"
        ) {
            // Unexpected format -> no animation
            return null;
        }

        return { frametime: json.animation.frametime };
    } catch {
        // Network error or invalid JSON -> no animation
        return null;
    }
}
