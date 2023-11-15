import { Coord, DT, RefObj, add, dotProduct, length2, mult, normalize, subtract } from '../common'
import { Circle, Line } from "./render";
import * as ColorMath from "color-math";

export abstract class Animation {
  abstract cancel(): void;
  abstract run(): Promise<void>;
}

/**
 * "one off" animations which don't have lasting effects
 */


export class ExpandingCircleAnimation extends Animation {
  public toRender: RefObj;
  public position: Coord;
  public finalRadius: number;
  public circle: Circle;
  public fillStyle: string;
  increment: number;

  constructor(
    toRender: RefObj,
    position: Coord,
    finalRadius: number,
    fillStyle: string,
    time: number
  ) {
    super();
    this.toRender = toRender;
    this.position = position;
    this.finalRadius = finalRadius;
    this.fillStyle = fillStyle;
    this.increment = (finalRadius * (DT / 1000)) / time;
    this.circle = new Circle(this.position, 0, 2, "rgba(0,0,0,0)", fillStyle);
  }

  public animationId!: number;
  public cancelled: boolean = false;

  public cancel() {
    this.toRender.current = this.toRender.current.filter(
      (o) => o != this.circle
    );
    this.cancelled = true;
  }

  public run() {
    return new Promise<void>((resolve) => {
      this.toRender.current.push(this.circle);
      this.animationId = setInterval(() => {
        if (this.cancelled) {
          clearInterval(this.animationId);
          resolve();
          return;
        }

        if (this.circle.radius >= this.finalRadius) {
          // delete the object from the render list
          this.toRender.current = this.toRender.current.filter(
            (o) => o != this.circle
          );
          clearInterval(this.animationId);
          resolve();
        } else {
          this.circle.radius += this.increment;
        }
      }, DT);
    });
  }
}

export class DrawLineAnimation extends Animation {
  toRender: RefObj;
  from: Coord;
  to: Coord;
  direction: Coord;
  line: Line;
  animationId!: number;
  increment: number;

  /**
   *
   * @param from
   * @param to
   * @param toRender
   * @param lineWidth
   * @param strokeStyle
   * @param time time in miliseconds for animation to finish
   */
  constructor(
    from: Coord,
    to: Coord,
    toRender: RefObj,
    lineWidth: number,
    strokeStyle: string,
    time: number
  ) {
    super();
    this.from = from;
    this.to = to;
    let distance = Math.sqrt(length2(subtract(to, from)));
    this.increment = (distance * (DT / 1000)) / time;
    this.direction = normalize(subtract(to, from));
    this.toRender = toRender;
    this.line = new Line(from, from, lineWidth, strokeStyle);
  }

  cancelled: boolean = false;

  cancel(): void {
    this.cancelled = true;
    this.toRender.current = this.toRender.current.filter((o) => o != this.line);
  }

  run() {
    return new Promise<void>((resolve) => {
      this.toRender.current.push(this.line);
      this.animationId = setInterval(() => {
        if (this.cancelled) {
          clearInterval(this.animationId);
          resolve();
          return;
        }

        this.line.destination = add(
          this.line.destination,
          mult(this.direction, this.increment)
        );
        let dp = dotProduct(
          subtract(this.to, this.line.destination),
          this.direction
        );
        if (dp <= 0) {
          // passed the destination
          this.toRender.current = this.toRender.current.filter(
            (o) => o != this.line
          );
          clearInterval(this.animationId);
          resolve();
        }
      }, DT);
    });
  }
}
type ColorData = {
  val: string;
};
export class ChangeColorAnimation extends Animation {
  toRender!: RefObj;
  colorObj: ColorData;
  originalColor: string;
  destColor: string;
  percentage = 0;
  animationId!: number;
  increment: number;
  constructor(colorObj: ColorData, destColor: string, time: number) {
    super();
    this.originalColor = colorObj.val;
    this.colorObj = colorObj;
    this.destColor = destColor;
    this.increment = (100 * (DT / 1000)) / time;
  }

  public cancelled: boolean = false;
  cancel(): void {
    this.colorObj.val = this.originalColor;
    this.cancelled = true;
  }

  run(): Promise<void> {
    return new Promise((resolve) => {
      this.animationId = setInterval(() => {
        if (this.cancelled) {
          clearInterval(this.animationId);
          resolve();
          return;
        }

        this.percentage += this.increment;
        if (this.percentage >= 100) {
          this.percentage = 100;
          this.colorObj.val = this.originalColor;
          clearInterval(this.animationId);
          resolve();
          return;
        }
        let newColor = ColorMath.evaluate(
          `${this.colorObj.val} | {${this.percentage}%} ${this.destColor}`
        ).result.css();
        this.colorObj.val = newColor;
      }, DT);
    });
  }
}
