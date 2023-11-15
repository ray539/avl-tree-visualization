import { RenderObject } from './render/render';

export interface Camera {
  x: number,
  y: number,
  r: number
}

export interface MouseData {
  pos: Coord
  drag: boolean
}

export type RefObj = React.MutableRefObject<RenderObject[]>;

export const CANVASWIDTH = 600;
export const CANVASHEIGHT = 839;
export const NODERADIUS = 15;
export const DT = 10;
export const ANIMATIONTIME = 0.5;
export const MINWIDTH = 30;

export interface Coord {
  x: number, 
  y: number
}

export interface Coord3 {
  x: number,
  y: number,
  z: number
}

export const PROGRESSBARWIDTH = 400
// fps of animations in MS


export function normalize(coord: Coord) {
  let length = Math.sqrt(coord.x * coord.x + coord.y * coord.y);
  if (length == 0) return {x: 0, y: 0};
  return {x: coord.x / length, y: coord.y / length}
}

export function add(c1: Coord, c2: Coord) {
  return {x: c1.x + c2.x, y: c1.y + c2.y}
}

export function subtract(c1: Coord, c2: Coord) {
  return {x: c1.x - c2.x, y: c1.y - c2.y}
}

export function dotProduct(c1: Coord, c2: Coord) {
  return c1.x * c2.x + c1.y * c2.y
}

export function mult(c1: Coord, s: number) {
  return {x: c1.x * s, y: c1.y * s}
}

export function length2(c1: Coord) {
  return c1.x * c1.x + c1.y * c1.y;
}