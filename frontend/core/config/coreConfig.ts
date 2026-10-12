export class CoreConfigBase {
    ratio = {
        x: 16,
        y: 9,
    };
    width = this.ratio.x * 100;
    height = this.ratio.y * 100;
    centerX = this.width / 2;
    centerY = this.height / 2;

    primaryColor = 0x1987cf; // #1987cfff
    primaryDarkColor = 0x0d4063; // #0d4063ff
    primaryLightColor = 0x56bbff; // #56bbffff
    primaryContrastColor = 0xffffff; // #ffffff
    darkColor = 0x061017; // #061017ff
    roundness = 15;
}

export const CoreConfig = new CoreConfigBase();
