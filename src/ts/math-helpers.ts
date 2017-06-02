/*
 * Copyright 2017 BTC Business Technology AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface Point {
    x: number;
    y: number;
}

export interface Line {
    p1: Point;
    p2: Point;
}

export interface LineEquation {
    startVector: Point;
    directionVector: Point;
}

export function lineToLineEquation(line: Line): LineEquation {
    return {
        startVector: line.p1,
        directionVector: {
            x: line.p2.x - line.p1.x,
            y: line.p2.y - line.p1.y,
        }
    }
}

export function getLineIntersection(l1: Line, l2: Line): Point {
    // Source: wikipedia https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
    let denominator = (l1.p1.x - l1.p2.x) * (l2.p1.y - l2.p2.y) - (l1.p1.y - l1.p2.y) * (l2.p1.x - l2.p2.x);
    if (denominator === 0) {
        return null;
    }
    let xNumerator = (l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x) * (l2.p1.x - l2.p2.x) - (l1.p1.x - l1.p2.x) * (l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x)
    let x = xNumerator / denominator;
    let yNumerator = (l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x) * (l2.p1.y - l2.p2.y) - (l1.p1.y - l1.p2.y) * (l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x)
    let y = yNumerator / denominator;
    return {x, y};
}
