import { loadImg } from './loadImg';

export enum AssetKind {
    Img
}

export class Assets {
    private static assets: any = {};
    public static async addAsset(assetKind: AssetKind, src: string, name: string) {
        switch (assetKind) {
            case AssetKind.Img:
                this.assets[name] = await loadImg(src);
        }
    }

    public static getAsset(name: string) {
        return this.assets[name];
    }
}