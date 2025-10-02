interface ImgObj {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    src: string;
    imageObj: HTMLImageElement;
}

type Handle =
    | 'tl'
    | 'tr'
    | 'bl'
    | 'br'
    | 'l'
    | 'r'
    | 't'
    | 'b'
    | 'move'
    | 'delete'
    | 'layerUp'
    | 'layerDown'
    | null;
