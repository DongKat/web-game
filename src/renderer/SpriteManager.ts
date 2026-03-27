// Map sprite name to sprite

type Sprite = {
    image: HTMLImageElement;
    x: number;
    y: number;
    w: number;
    h: number;
};

export class SpriteManager {
    private sprites = new Map<string, Sprite>();
    private images = new Map<string, HTMLImageElement>();

    async loadImage(key: string, src: string): Promise<void> {
        const img = new Image();
        img.src = src;

        await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = rej;
        });

        this.images.set(key, img);
    }

    private getImage(key: string): HTMLImageElement {
        const img = this.images.get(key);
        if (!img) throw new Error(`Image not loaded: ${key}`);
        return img;
    }

    addImageSprite(name: string, imageKey: string) {
        const img = this.getImage(imageKey);

        this.sprites.set(name, {
            image: img,
            x: 0,
            y: 0,
            w: img.width,
            h: img.height,
        });
    }

    // NOTE: I dont use this, but it might be useful for sprite sheets
    addSprite(
        name: string,
        imageKey: string,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        const img = this.getImage(imageKey);

        this.sprites.set(name, { image: img, x, y, w, h });
    }

    getSprite(name: string): Sprite {
        const s = this.sprites.get(name);
        if (!s) throw new Error(`Sprite not found: ${name}`);
        return s;
    }
}