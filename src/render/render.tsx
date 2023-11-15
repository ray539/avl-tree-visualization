import { Camera, Coord } from "../common";

export function worldToScreen(worldCoords: Coord, camera: Camera) {
  return {
    x: (worldCoords.x - camera.x) * camera.r,
    y: (worldCoords.y - camera.y) * camera.r,
  };
}

export function screenToWorld(screenCoords: Coord, camera: Camera) {
  return {
    x: screenCoords.x / camera.r + camera.x,
    y: screenCoords.y / camera.r + camera.y,
  };
}

export abstract class RenderObject {
  abstract render(camera: Camera, ctx: CanvasRenderingContext2D): void;
}

export abstract class RenderShape extends RenderObject {
  abstract position: Coord;
  abstract strokeStyle: string;
  abstract fillStyle: string;
}

export class Rect extends RenderShape {
  strokeStyle: string;
  fillStyle: string;
  public position: Coord;
  public width: number;
  public height: number;
  public lineWidth: number;

  /**
   *
   * @param position
   * @param width
   * @param height
   * @param lineWidth -1 means filled
   */
  constructor(
    position: Coord,
    width: number,
    height: number,
    lineWidth: number,
    strokeStyle: string = "black",
    fillStyle: string = "rgba(0,0,0,0)"
  ) {
    super();
    this.position = { ...position };
    this.width = width;
    this.height = height;
    this.lineWidth = lineWidth;
    this.strokeStyle = strokeStyle;
    this.fillStyle = fillStyle;
  }

  public render(camera: Camera, ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.strokeStyle;
    ctx.fillStyle = this.fillStyle;
    let screenCoords = worldToScreen(this.position, camera);
    ctx.fillRect(
      screenCoords.x,
      screenCoords.y,
      this.width * camera.r,
      this.height * camera.r
    );
    if (this.lineWidth <= 0) return;
    ctx.lineWidth = this.lineWidth * camera.r;
    ctx.strokeRect(
      screenCoords.x,
      screenCoords.y,
      this.width * camera.r,
      this.height * camera.r
    );
  }
}

export class Line extends RenderObject {
  public origin: Coord;
  public destination: Coord;
  public lineWidth: number;
  public strokeStyle: string;

  public constructor(origin: Coord, destination: Coord, lineWidth: number, strokeStyle: string = 'black') {
    super();
    this.origin = origin;
    this.destination = destination;
    this.lineWidth = lineWidth;
    this.strokeStyle = strokeStyle;
  }

  render(camera: Camera, ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.lineWidth * camera.r;
    ctx.strokeStyle = this.strokeStyle;
    let screenOrigin = worldToScreen(this.origin, camera);
    let screenDest = worldToScreen(this.destination, camera);

    ctx.beginPath()
    ctx.moveTo(screenOrigin.x, screenOrigin.y);
    ctx.lineTo(screenDest.x, screenDest.y);
    ctx.stroke();
  }
}

export class Circle extends RenderShape {
  strokeStyle: string;
  fillStyle: string;
  public position: Coord;
  public radius: number;
  public lineWidth: number;

  /**
   *
   * @param position
   * @param radius
   * @param lineWidth -1 if filled
   */
  constructor(
    position: Coord,
    radius: number,
    lineWidth: number,
    strokeStyle: string = "black",
    fillStyle: string = "rgba(0,0,0,0)"
  ) {
    super();
    this.position = { ...position };
    this.radius = radius;
    this.lineWidth = lineWidth;
    this.strokeStyle = strokeStyle;
    this.fillStyle = fillStyle;
  }

  render(camera: Camera, ctx: CanvasRenderingContext2D): void {
    let screenCords = worldToScreen(this.position, camera);
    ctx.lineWidth = this.lineWidth * camera.r;
    ctx.beginPath();
    ctx.strokeStyle = this.strokeStyle;
    if (this.lineWidth <= 0) this.strokeStyle = "rgba(0,0,0,0)";
    ctx.fillStyle = this.fillStyle;
    ctx.arc(
      screenCords.x,
      screenCords.y,
      this.radius * camera.r,
      0,
      2 * Math.PI,
      true
    );
    ctx.fill();
    ctx.stroke();
  }
}

export class Text extends RenderObject {
  text: string;
  size: number;
  position: Coord;
  fillStyle: string


  constructor(text: string, size: number, position: Coord, fillStyle: string) {
    super();
    this.text = text;
    this.size = size;
    this.position = position;
    this.fillStyle = fillStyle;
  }

  render(camera: Camera, ctx: CanvasRenderingContext2D): void {
    let _position = worldToScreen({x: this.position.x, y: this.position.y + this.size * 0.4}, camera);
    let _size = this.size * camera.r;
    ctx.fillStyle = this.fillStyle
    ctx.font = `${_size}px arial`;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, _position.x, _position.y);
  }
  
}