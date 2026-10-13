import * as PIXI from 'pixi.js';

type TTypographyHorizontalAlign = 'left' | 'center' | 'right';
type TTypographyVerticalAlign = 'top' | 'center' | 'bottom';
type TTypographyFontWeight = 'bold' | 'normal';

export interface ITypographyParams {
    text: string | number;
    size: number;
    fontFamily: string;
    horizontalAlign: TTypographyHorizontalAlign;
    verticalAlign: TTypographyVerticalAlign;
    color: number;
    weight: TTypographyFontWeight;
    styleProps?: Partial<PIXI.TextStyle> | PIXI.TextStyle;
}

export class Typography extends PIXI.Container {
    private textNode: PIXI.Text;

    private scaleRatio = 2;

    config: ITypographyParams;

    constructor(config: Partial<ITypographyParams>) {
        super();

        this.config = {
            text: '',
            fontFamily: 'Trebuchet MS',
            size: 26,
            horizontalAlign: 'center',
            verticalAlign: 'center',
            weight: 'normal',
            color: 0xffffff,
            ...config,
        };

        this.textNode = new PIXI.Text({
            text: config.text,
            style: {
                fontFamily: this.config.fontFamily,
                fontSize: this.getFontSize(this.config.size),
                lineHeight: this.getFontSize(this.config.size),
                align: this.config.horizontalAlign,
                fontWeight: this.config.weight,
                fill: this.config.color,
                ...config.styleProps,
            },
        });
        this.textNode.scale.set(1 / this.scaleRatio);

        this.textNode.anchor.set(
            this.getHorizontalAnchor(config.horizontalAlign),
            this.getVerticalAnchor(config.verticalAlign),
        );

        this.addChild(this.textNode);
    }

    get text() {
        return this.textNode.text;
    }

    set text(value: string | number) {
        this.setText(value);
    }

    get anchor() {
        return this.textNode.anchor;
    }

    get style() {
        return this.textNode.style;
    }

    setText(text: string | number) {
        this.textNode.text = text;
    }

    setColor(color: number) {
        this.textNode.style.stroke = color;
        this.textNode.style.fill = color;
    }

    private getFontSize(size: number) {
        return size * this.scaleRatio;
    }

    private getHorizontalAnchor = (horizontalAlign?: TTypographyHorizontalAlign) => {
        switch (horizontalAlign) {
            case 'left':
                return 0;
            case 'center':
                return 0.5;
            case 'right':
                return 1;
            default:
                return 0.5;
        }
    };

    private getVerticalAnchor = (verticalAlign?: TTypographyVerticalAlign) => {
        switch (verticalAlign) {
            case 'top':
                return 0;
            case 'center':
                return 0.5;
            case 'bottom':
                return 1;
            default:
                return 0.5;
        }
    };
}
