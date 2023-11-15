import {
  ANIMATIONTIME,
  Camera,
  Coord,
  NODERADIUS,
} from "../common";
import { Circle, Line, RenderObject, Text } from "./render";
import { ChangeColorAnimation } from "./ElementaryAnimations";

export abstract class TreeObject extends RenderObject {
  abstract clone(): TreeObject;
}

export class TreeNode extends TreeObject {

  public id: string;
  public position: Coord;
  public value: number;
  borderChangeAnimation: ChangeColorAnimation | undefined;
  fillChangeAnimation: ChangeColorAnimation | undefined;
  textChangeAnimation: ChangeColorAnimation | undefined;

  constructor(id: string, position: Coord, value: number) {
    super();
    this.id = id;
    this.position = { ...position };
    this.value = value;
  }

  clone(): TreeObject {
    return new TreeNode(this.id, this.position, this.value);
  }

  public FILLCOLOR = { val: "white" };
  public BORDERCOLOR = { val: "black" };
  public TEXTCOLOR = { val: "black" };

  public DEFFILLCOLOR = "white";
  public DEFBORDERCOLOR = "black";
  public DEFTEXTCOLOR = "black";
  public GLOWFILLCOLOR = "orange";
  public GLOWBORDERCOLOR = "grey";
  public GLOWTEXTCOLOR = "white";

  public render(camera: Camera, ctx: CanvasRenderingContext2D) {
    let c = new Circle(
      this.position,
      NODERADIUS,
      2,
      this.BORDERCOLOR.val,
      this.FILLCOLOR.val
    );
    let t = new Text(
      this.value.toString(),
      NODERADIUS * 0.8,
      this.position,
      this.TEXTCOLOR.val
    );
    c.render(camera, ctx);
    t.render(camera, ctx);
  }

  public cancelGlow() {
    this.borderChangeAnimation?.cancel();
    this.fillChangeAnimation?.cancel();
    this.textChangeAnimation?.cancel();
  }

  public glow() {
    return new Promise<void>(async (resolve) => {
      this.borderChangeAnimation = new ChangeColorAnimation(
        this.BORDERCOLOR,
        this.GLOWBORDERCOLOR,
        ANIMATIONTIME
      );
      this.fillChangeAnimation = new ChangeColorAnimation(
        this.FILLCOLOR,
        this.GLOWFILLCOLOR,
        ANIMATIONTIME
      );
      this.textChangeAnimation = new ChangeColorAnimation(
        this.TEXTCOLOR,
        this.GLOWTEXTCOLOR,
        ANIMATIONTIME
      );
      let p1 = this.borderChangeAnimation.run();
      let p2 = this.fillChangeAnimation.run();
      let p3 = this.textChangeAnimation.run();
      await Promise.all([p1, p2, p3]);
      resolve();
    });
  }
}

export class Link extends TreeObject {

  n1: TreeNode;
  n2: TreeNode | Coord;
  constructor(n1: TreeNode, n2: TreeNode | Coord) {
    super();
    this.n1 = n1;
    this.n2 = n2;
  }

  clone(): TreeObject {
    return new Link(this.n1, this.n2)
  }

  setN2(n2: TreeNode) {
    this.n2 = n2;
  }

  render(camera: Camera, ctx: CanvasRenderingContext2D): void {
    let toPos: Coord;
    if (!(this.n2 instanceof TreeNode)) {
      toPos = { ...this.n2 };
    } else {
      toPos = { ...this.n2.position };
    }
    let l = new Line(this.n1.position, toPos, 4, "grey");
    l.render(camera, ctx);
  }
}

