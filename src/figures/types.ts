import type { ChannelId } from '../data/channels';
import type { Shape, Vec } from './geometry';

export type ViewId = 'front' | 'back' | 'head-front' | 'head-side' | 'arm-palmar' | 'arm-dorsal' | 'leg-lateral' | 'leg-medial';

/** Узел хода канала: точка по id или промежуточная опора (ход между точками) */
export type PathNode = string | Vec;

export interface ViewDef {
  id: ViewId;
  title: string;
  width: number;
  height: number;
  /** Пикселей на цунь — для справки в редакторе */
  cun: number;
  /** Формы тела: рисуются объединённым контуром */
  shapes: Shape[];
  /** Ориентиры внутри контура: складки, ключицы, пупок… (атрибут d у path) */
  details: string[];
  /** Ось симметрии: парные точки отражаются на вторую сторону (вид спереди/сзади) */
  mirrorX?: number;
  /** Места точек по формулам (цуни от ориентиров); правки из редактора лежат в placements.json */
  computed: Record<string, Vec>;
  /** Ход каналов на этом виде: одна линия или несколько ветвей (у BL на спине — две) */
  paths: Partial<Record<ChannelId, PathNode[] | PathNode[][]>>;
}
