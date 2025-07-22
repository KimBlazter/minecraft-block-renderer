export type SpritemapImage = {
    name: string;
    dataUrl?: string;
    blob?: Blob;
};

export type SpritemapMetadata = {
    width: number;
    height: number;
    tileSize: number;
    cols: number;
    rows: number;
    sprites: Record<
        string,
        { x: number; y: number; width: number; height: number }
    >;
};

/**
 * Create a sprite map from a list of images.
 *
 * @param images List of images (with `dataUrl` or `blob`)
 * @param tileSize Size of each tile in the grid
 */
export async function createSpritemap(
    images: SpritemapImage[],
    tileSize: number = 64
): Promise<{ canvas: HTMLCanvasElement; metadata: SpritemapMetadata }> {
    const itemCount = images.length;
    const cols = Math.ceil(Math.sqrt(itemCount));
    const rows = Math.ceil(itemCount / cols);

    const canvas = document.createElement("canvas");
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;
    const ctx = canvas.getContext("2d")!;

    // Disable image smoothing
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;

    const metadata: SpritemapMetadata = {
        width: canvas.width,
        height: canvas.height,
        tileSize,
        cols,
        rows,
        sprites: {},
    };

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * tileSize;
        const y = row * tileSize;

        try {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () =>
                    reject(new Error(`Could not load image for ${image.name}`));

                if (image.dataUrl) {
                    img.src = image.dataUrl;
                } else if (image.blob) {
                    img.src = URL.createObjectURL(image.blob);
                }
            });

            ctx.drawImage(img, x, y, tileSize, tileSize);

            metadata.sprites[image.name] = {
                x,
                y,
                width: tileSize,
                height: tileSize,
            };

            if (image.blob) {
                URL.revokeObjectURL(img.src);
            }
        } catch (error) {
            console.error(`Failed to render ${image.name}`, error);
        }
    }

    return { canvas, metadata };
}
