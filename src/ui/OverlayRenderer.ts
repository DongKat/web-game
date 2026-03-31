// Move rendering of UI layer (cursor, highlights) from TileMapRenderer

import { Container, Texture } from 'pixi.js';
import { TileMap } from '../map/TileMap';
import { AssetLoader } from '../core/AssetLoader';
import { TILE_SIZE, SCALE, TILE_ID_MAP } from '../core/constants';


export class OverlayRenderer {
    readonly container: Container;
    constructor() {
        this.container = new Container();
        this.container.label = 'OverlayRenderer';
        
    }

    

    



}