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

import "../css/svg.css";

import {RedGData, RedGFieldValue, RedGModelHelper, RedGObject, RedGRelation} from "./model";
import * as d3 from "d3";
import * as pako from "pako";
import * as base64 from "base-64";
import {Selection} from "d3-selection";
import {ZoomBehavior} from "d3-zoom";
import * as $ from "jquery";
import {getLineIntersection, Line, Point} from "./math-helpers";
import {DetailViewManager} from "./detail-view";
import {saveSvg, saveSvgAsPng} from "save-svg-as-png";


export class DrawManager {

    private svg: Selection<SVGElement, any, any, any>;
    private mainGroup: Selection<SVGGElement, any, any, any>;
    private entityGroup: Selection<SVGGElement, any, any, any>;
    private relationGroup: Selection<SVGGElement, any, any, any>;
    private zoom: ZoomBehavior<any, any>;
    private _entities: Array<RedGObject>;
    private _relations: Array<RedGRelation>;

    // content of file ../img/redg-watermark.svg
    private static readonly svgWatermark: string = `<g fill="#c6050e">
    <path d="M142.082 2.01C92.075 2.11 43.405 31.38 19.5 75.65-6.01 121.07-3.393 180 26.26 223.04c26.518 40.01 74.663 64.577 122.282 62.482 51.074-1.09 99.974-32.722 122.405-78.845 19.94-39.314 19.58-88.165-1.147-127.402C246.598 31.74 194.948.745 142.082 2.01zM143.8 13.1c58.734.63 100.148 42.05 114.157 67.227-16.396-.153-33.004.187-48.49-.63-27.098-29.2-73.27-36.045-108.017-17.435-18.925 9.763-33.9 26.29-42.394 45.814C51.578 95.11 44.1 82.143 36.62 69.176c23.916-34.638 65-56.435 107.18-56.075zm0 49.6c35.633-.61 69.412 25.316 78.19 59.825 9.415 32.86-4.912 70.57-33.77 88.896-29.158 19.863-71.125 17.05-97.392-6.497-26.525-22.218-35.606-62.194-21.246-93.678C81.964 82.235 112.22 62.33 143.8 62.7zm-112.17 20l22.793 39.376c-9.296 35.885 6.143 76.412 37.012 97.23 18.533 13.022 41.79 18.485 64.067 15.703-8.126 12.938-16.25 25.877-24.375 38.816-47.007-3.995-90.073-35.9-107.967-79.49-15.647-36.598-12.98-80.2 6.644-114.793.61 1.052 1.218 2.104 1.826 3.156zm190.67 6.6h40.82c18.547 40.18 14.694 89.608-10.146 126.276-23.656 36.286-66.104 59.268-109.46 58.945 9.23-14.14 17.627-29.352 27.378-42.825 38.216-11.185 66.055-49.607 64.998-89.315-.08-18.73-6.413-37.444-17.248-53.08z"/>
    <g transform="matrix(.92635 0 0 .92635 -152.7 -28.22)">
      <ellipse ry="24.5" rx="41.8" cy="147.2" cx="319.8"/>
      <path d="M278.15 164.26v20.585a41.8 24.5 0 0 0 41.65 22.97 41.8 24.5 0 0 0 41.524-22.167V165.02a41.8 24.5 0 0 1-41.525 21.794 41.8 24.5 0 0 1-41.65-22.554z" opacity=".98"/>
      <path d="M278.15 199.905v20.584a41.8 24.5 0 0 0 41.65 22.97 41.8 24.5 0 0 0 41.524-22.168v-20.626a41.8 24.5 0 0 1-41.525 21.792 41.8 24.5 0 0 1-41.65-22.553z" opacity=".98"/>
    </g>
  </g>
  <text style="line-height:125%;" x="314.131" y="214.863" font-size="40" font-family="Roboto" letter-spacing="0" word-spacing="0">
    <tspan x="314.131" y="214.863" font-size="192">RedG</tspan>
  </text>`;

    private static instance: DrawManager;
    public static readonly BOX_WIDTH = 300;
    public static readonly BOX_MARGIN = 5;
    public static readonly LINE_SPACING = 15;

    public clickCallback: (id: string) => void;
    public showSQLNames: boolean = false;

    public static getInstance(): DrawManager {
        if (!DrawManager.instance) {
            DrawManager.instance = new DrawManager();
        }
        return DrawManager.instance;
    }

    public init(height: string, width: string, value: Array<RedGObject>, rel: Array<RedGRelation>): void {
        this._entities = value;
        this._relations = rel;
        this.zoom = d3.zoom().scaleExtent([0.5, 3]);
        this.svg = d3.select("#visualization").append<SVGElement>("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("id", "visualization-svg")
            .call(this.zoom.on("zoom", () => {
                this.mainGroup.attr("transform", d3.event.transform);
            }));
        this.svg
            .append("defs")
            .append("marker")
            .attr("id", "arrowhead")
            .attr("markerHeight", 5)
            .attr("markerWidth", 5)
            .attr("markerUnits", "strokeWidth")
            .attr("orient", "auto")
            .attr("refX", 5)
            .attr("refY", 2.5)
            .attr("viewbox", "-5 -5 10 10")
            .append("path")
            .attr("d", "M 0 0 L 5 2.5 L 0 5 z")
            .attr("fill", "black");
        this.mainGroup = this.svg.append<SVGGElement>("g");
        this.relationGroup = this.mainGroup.append<SVGGElement>("g");
        this.entityGroup = this.mainGroup.append<SVGGElement>("g");
        // For some reason this has to be called twice.
        // I don't know enough about d3 to fix this atm
        this.updateEntities();
        this.updateEntities();
        this.updateRelations();
        this.updateRelations();
    }

    public set entities(value: Array<RedGObject>) {
        this._entities = value;
        this.updateEntities();
    }

    public get entities(): Array<RedGObject> {
        return this._entities;
    }

    public set relations(value: Array<RedGRelation>) {
        this._relations = value;
        this.updateRelations();
    }


    public updateEntities(): void {
        let entityGroups = this.entityGroup
            .selectAll<SVGGElement, RedGObject>("g.entity")
            .data(this._entities);

        entityGroups
            .enter()
            .append("g")
            .attr("id", (d) => "e" + d.id)
            .classed("entity", true)
            .classed("existing", (d) => d.existingEntity)
            .classed("dummy", (d) => d.dummy)
            .call(d3.drag<SVGGElement, RedGObject>()
                .on("start", () => {
                    d3.event.sourceEvent.stopPropagation();
                    d3.event.sourceEvent.preventDefault();
                })
                .on("drag", this.createDragHandler())
            )
            .on("click", this.createClickHandler());

        entityGroups.exit().remove();

        // Add the entity header
        entityGroups.selectAll<SVGTextElement, RedGObject>("text.entity-title")
            .data<RedGObject>((d, i) => {
                return [d];
            })
            .text((d) => this.showSQLNames ? d.sqlName : d.type)
            .enter()
            .append<SVGTextElement>("text")
            .attr("x", (d) => d.position.x + DrawManager.BOX_WIDTH / 2)
            .attr("y", (d) => d.position.y + DrawManager.LINE_SPACING * 1.1)
            .attr("text-anchor", "middle")
            .classed("entity-title", true)
            .text((d) => this.showSQLNames ? d.sqlName : d.type);
        // Add the box around the header
        entityGroups.selectAll<SVGRectElement, RedGObject>("rect.entity-title-box")
            .data<RedGObject>((d, i) => {
                return [d];
            })
            .enter()
            .insert<SVGRectElement>("rect", ":first-child")
            .attr("x", (d, i) => d.position.x)
            .attr("y", (d, i) => d.position.y)
            .attr("height", DrawManager.LINE_SPACING * 1.5)
            .attr("width", DrawManager.BOX_WIDTH)
            .classed("entity-title-box", true)
            .classed("entity-box", true);
        // Add the explicit attributes
        let expTextGroup = entityGroups.selectAll<SVGGElement, RedGObject>("g.explicit-attribute-group")
            .data<{ data: RedGFieldValue, position: { x: number, y: number } }>((d, i) => {
                let result: Array<{ data: RedGFieldValue, position: { x: number, y: number } }> = [];
                d.explicitFields.forEach(val => result.push({
                    data: val,
                    position: d.position,
                }));
                return result;
            });
        d3.selectAll<SVGTextElement, { data: RedGFieldValue, position: { x: number, y: number } }>("text.explicit-attribute-name")
            .text((d) => this.showSQLNames ? d.data.sqlName : d.data.name)
            .call(cutoffExcessText, DrawManager.BOX_WIDTH * 0.4 - DrawManager.BOX_MARGIN);
        let enterExpTextGroup = expTextGroup.enter().append("g")
            .classed("explicit-attribute-group", true);
        enterExpTextGroup.append("text")
            .attr("x", (d, i) => d.position.x + DrawManager.BOX_MARGIN)
            .attr("y", (d, i) => d.position.y + DrawManager.LINE_SPACING * (i + 2.2))
            .attr("dy", ".35em")
            .classed("explicit-attribute", true)
            .classed("explicit-attribute-name", true)
            .text((d) => this.showSQLNames ? d.data.sqlName : d.data.name)
            .call(cutoffExcessText, DrawManager.BOX_WIDTH * 0.4 - DrawManager.BOX_MARGIN);
        enterExpTextGroup.append("text")
            .attr("x", (d, i) => d.position.x + DrawManager.BOX_WIDTH * 0.4)
            .attr("y", (d, i) => d.position.y + DrawManager.LINE_SPACING * (i + 2.2))
            .attr("dy", ".35em")
            .classed("explicit-attribute", true)
            .text((d) => d.data.value)
            .call(cutoffExcessText, DrawManager.BOX_WIDTH * 0.6 - DrawManager.BOX_MARGIN);
        let expRect = entityGroups.selectAll<SVGRectElement, RedGObject>("rect.explicit-attribute-box")
            .data<RedGObject>((d, i) => {
                return [d];
            })
            .enter()
            .insert<SVGRectElement>("rect", ":first-child")
            .attr("x", (d, i) => d.position.x)
            .attr("y", (d, i) => d.position.y + DrawManager.LINE_SPACING * 1.5)
            .attr("height", (d) => DrawManager.LINE_SPACING * (d.explicitFields.length + 0.5))
            .attr("width", DrawManager.BOX_WIDTH)
            .classed("explicit-attribute-box", true)
            .classed("entity-box", true);

        // And now the implicit ones
        let impTextGroup = entityGroups.selectAll<SVGGElement, RedGObject>("g.implicit-attribute-group")
            .data<{ data: RedGFieldValue, position: { x: number, y: number, yOffsetElements: number } }>((d, i) => {
                let result: Array<{ data: RedGFieldValue, position: { x: number, y: number, yOffsetElements: number } }> = [];
                d.implicitFields.forEach(val => result.push({
                    data: val,
                    position: {
                        x: d.position.x,
                        y: d.position.y,
                        yOffsetElements: d.explicitFields.length,
                    },
                }));
                return result;
            });
        d3.selectAll<SVGTextElement, { data: RedGFieldValue, position: { x: number, y: number } }>("text.implicit-attribute-name")
            .text((d) => this.showSQLNames ? d.data.sqlName : d.data.name)
            .call(cutoffExcessText, DrawManager.BOX_WIDTH * 0.4 - DrawManager.BOX_MARGIN);
        let enterImpTextGroup = impTextGroup.enter().append("g")
            .classed("implicit-attribute-group", true);
        enterImpTextGroup.append("text")
            .attr("x", (d, i) => d.position.x + DrawManager.BOX_MARGIN)
            .attr("y", (d, i) => d.position.y + DrawManager.LINE_SPACING * (i + d.position.yOffsetElements + 2.7))
            .attr("dy", ".35em")
            .classed("implicit-attribute", true)
            .classed("implicit-attribute-name", true)
            .text((d) => this.showSQLNames ? d.data.sqlName : d.data.name)
            .call(cutoffExcessText, DrawManager.BOX_WIDTH * 0.4 - DrawManager.BOX_MARGIN);
        enterImpTextGroup.append("text")
            .attr("x", (d, i) => d.position.x + DrawManager.BOX_WIDTH * 0.4)
            .attr("y", (d, i) => d.position.y + DrawManager.LINE_SPACING * (i + d.position.yOffsetElements + 2.7))
            .attr("dy", ".35em")
            .classed("explicit-attribute", true)
            .text((d) => d.data.value)
            .call(cutoffExcessText, DrawManager.BOX_WIDTH * 0.6 - DrawManager.BOX_MARGIN);
        let impRect = entityGroups.selectAll<SVGRectElement, RedGObject>("rect.implicit-attribute-box")
            .data<RedGObject>((d, i) => {
                return [d];
            })
            .enter()
            .insert<SVGRectElement>("rect", ":first-child")
            .attr("x", (d, i) => d.position.x)
            .attr("y", (d, i) => d.position.y + DrawManager.LINE_SPACING * (d.explicitFields.length + 2 ))
            .attr("height", (d) => DrawManager.LINE_SPACING * (d.implicitFields.length + 0.5))
            .attr("width", DrawManager.BOX_WIDTH)
            .classed("implicit-attribute-box", true)
            .classed("entity-box", true);
        // Add overlay box (2 boxes, one gets disabled in minimalistic view)
        /*entityGroups.selectAll<SVGRectElement, RedGObject>("rect.entity-overlay-box-minimal")
         .data<RedGObject>((d, i) => {
         return [d];
         })
         .enter()
         .append("rect")
         .attr("x", (d) => d.position.x)
         .attr("y", (d) => d.position.y)
         .attr("height", (d) => DrawManager.LINE_SPACING * (d.explicitFields.length + 2))
         .attr("width", DrawManager.BOX_WIDTH)
         .classed("entity-overlay-box-minimal", true)
         .classed("entity-overlay-box", true);
         entityGroups.selectAll<SVGRectElement, RedGObject>("rect.entity-overlay-box-expanded")
         .data<RedGObject>((d, i) => {
         return [d];
         })
         .enter()
         .append("rect")
         .attr("x", (d) => d.position.x)
         .attr("y", (d) => d.position.y + DrawManager.LINE_SPACING * (d.explicitFields.length + 2))
         .attr("height", (d) => DrawManager.LINE_SPACING * (d.implicitFields.length + 0.5))
         .attr("width", DrawManager.BOX_WIDTH)
         .classed("entity-overlay-box-expanded", true)
         .classed("entity-overlay-box", true);*/

    }

    public updateRelations() {

        let relationsGroups = this.relationGroup.selectAll<SVGGElement, RedGRelation>("g.relation")
            .data(this._relations.filter((r) => r.to !== "null"));

        relationsGroups.exit().remove();
        relationsGroups
            .enter()
            .append<SVGGElement>("g")
            .attr("data-from", (d) => d.from)
            .attr("data-to", (d) => d.to)
            .attr("id", (d) => "r" + d.from + "-" + d.to)
            .classed("dummy", (d) =>
                RedGModelHelper.findObjectById(d.to, this._entities).dummy
            )
            .classed("existing", (d) =>
                RedGModelHelper.findObjectById(d.to, this._entities).existingEntity
            )
            .classed("relation", true);

        relationsGroups
            .selectAll("path.relation-line")
            .call(positionPath, this._entities)
            .data((d) => [d])
            .enter()
            .append("path")
            .attr("id", (d) => "r" + d.from + "-" + d.to + "-path")
            .classed("relation-line", true)
            .attr("marker-end", "url(#arrowhead)")
            .call(positionPath, this._entities);
        relationsGroups
            .selectAll("path.relation-line-hidden")
            .call(positionTextPath, this._entities)
            .data((d) => [d])
            .enter()
            .append("path")
            .attr("id", (d) => "r" + d.from + "-" + d.to + "-path-hidden")
            .classed("relation-line-hidden", true)
            .call(positionTextPath, this._entities);
        relationsGroups.selectAll<SVGTextElement, RedGRelation>("text.relation-text")
            .data((d) => [d])
            .enter()
            .append("text")
            .classed("relation-text", true)
            .attr("text-anchor", "middle")
            .attr("dy", "-.4em")
            .append("textPath")
            .attr("xlink:href", (d) => "#r" + d.from + "-" + d.to + "-path-hidden")
            .attr("startOffset", "50%");

        relationsGroups.selectAll<SVGTextPathElement, RedGRelation>("text.relation-text textPath")
            .text((d) => this.showSQLNames ? d.sqlName : d.name);

    }

    private createClickHandler(): () => void {
        let that = this;
        return function () {
            if (that.clickCallback && typeof that.clickCallback === "function") {
                that.clickCallback(d3.select(this).attr("id"));
            }
        };
    }

    private createDragHandler(): () => void {
        let that = this;
        return function () {
            let group = d3.select(this);
            let transform = getConsolidatedMatrix(this);
            //let transformString = group.attr("transform") || "translate(0,0)";
            //let t = transformString.substring(transformString.indexOf("(") + 1, transformString.indexOf(")")).split(",");
            group.attr("transform", "translate(" + (transform.e + d3.event.dx) + "," + (transform.f + d3.event.dy) + ")");
            // TODO: maybe only update affected paths. This will probably greatly improve FF performance, which is terrible right now (~3fps while moving)
            that.updateRelations();
        }
    }

    public drawWatermark(): void {
        let bbox = this.svg.node().getBoundingClientRect();
        let scale = 0.15;
        let invScale = 1 / scale;
        let transX = (bbox.width - 10) * invScale - 802.7;
        let transY = (bbox.height - 10) * invScale - 287.6;
        let watermark = this.svg.select("g#watermark");
        if (watermark.empty()) {
            //first call, so register resize listener
            console.log("Registering resize listener");
            window.addEventListener('resize', () => {
                console.log("Resize. Redrawing watermark...");
                this.drawWatermark();
            });
        } else {
            watermark.remove();
        }
        this.svg
            .append("g")
            .attr("id", "watermark")
            .attr("transform", `scale(${scale}) translate(${transX}, ${transY})`)
            //.attr("xlink:href", "img/redg-watermark.svg#logo") // this would be so much nicer, but sadly export won't include it then
            .html(DrawManager.svgWatermark);
    }


}

function cutoffExcessText(selection: Selection<SVGTextElement, any, any, any>, width: number): void {
    selection.each(function (data: { data: RedGFieldValue, position: { x: number, y: number } }, i: number) {
        if (this.getComputedTextLength() > width) {
            this.textContent = this.textContent + "…";
        }
        while (this.getComputedTextLength() > width) {
            this.textContent = this.textContent.substr(0, this.textContent.length - 2) + "…";
        }
    });
}

function positionPath(selection: Selection<SVGPathElement, any, any, any>, entities: Array<RedGObject>) {
    let line = d3.line<Point>().x((p) => p.x).y((p) => p.y);
    selection.each(function (data: RedGRelation, i: number) {
        let node = d3.select(this);
        let [fromPoint, toPoint] = getLinePoints(data);
        node.attr("d", line([fromPoint, toPoint]));
    });
}

function positionTextPath(selection: Selection<SVGPathElement, any, any, any>, entities: Array<RedGObject>) {
    let line = d3.line<Point>().x((p) => p.x).y((p) => p.y);
    selection.each(function (data: RedGRelation, i: number) {
        let node = d3.select(this);
        let [fromPoint, toPoint] = getLinePoints(data);
        if (fromPoint.x > toPoint.x) {
            node.attr("d", line([toPoint, fromPoint]));
        } else {
            node.attr("d", line([fromPoint, toPoint]));
        }

    });
}

function getLinePoints(data: RedGRelation): Array<Point> {
    let fromEntityGroup = d3.select("g#e" + data.from);
    let toEntityGroup = d3.select("g#e" + data.to);
    let fromGroupBBox = (fromEntityGroup.node() as SVGGElement).getBBox();
    let fromGroupMatrix = getConsolidatedMatrix(fromEntityGroup.node() as SVGGElement);
    let toGroupBBox = (toEntityGroup.node() as SVGGElement).getBBox();
    let toGroupMatrix = getConsolidatedMatrix(toEntityGroup.node() as SVGGElement);
    let fromPoint: Point = {
        x: fromGroupBBox.x + fromGroupBBox.width / 2 + fromGroupMatrix.e,
        y: fromGroupBBox.y + fromGroupBBox.height / 2 + fromGroupMatrix.f,
    };
    let toPoint: Point = {
        x: toGroupBBox.x + toGroupBBox.width / 2 + toGroupMatrix.e,
        y: toGroupBBox.y + toGroupBBox.height / 2 + toGroupMatrix.f,
    };
    //let originalLine: Line = {p1: fromPoint, p2: toPoint};

    let deltaX = fromPoint.x - toPoint.x;
    let deltaY = fromPoint.y - toPoint.y;

    if (Math.abs(deltaX) - (fromGroupBBox.width + toGroupBBox.width) / 2 > Math.abs(deltaY) - (fromGroupBBox.height + toGroupBBox.height) / 2) {
        if (deltaX > 0) {
            // left to right
            fromPoint.x -= fromGroupBBox.width / 2;
            toPoint.x += toGroupBBox.width / 2;
        } else {
            // right to left
            fromPoint.x += fromGroupBBox.width / 2;
            toPoint.x -= toGroupBBox.width / 2;
        }
    } else {
        if (deltaY > 0) {
            // top to bottom
            fromPoint.y -= fromGroupBBox.height / 2;
            toPoint.y += toGroupBBox.height / 2;
        } else {
            // right to left
            fromPoint.y += fromGroupBBox.height / 2;
            toPoint.y -= toGroupBBox.height / 2;
        }
    }
    return [fromPoint, toPoint];
}


function getBorderPoint(line: Line, box: SVGRect, trans: SVGMatrix): Point {
    let correctedBox: Array<Point> = [{
        x: box.x + trans.e,
        y: box.y + trans.f,
    }, {
        x: box.x + trans.e + box.width,
        y: box.y + trans.f,
    }, {
        x: box.x + trans.e + box.width,
        y: box.y + trans.f + box.height,
    }, {
        x: box.x + trans.e,
        y: box.y + trans.f + box.height,
    }];
    for (let i = 0; i < 4; i++) {
        let boxLine: Line = {
            p1: correctedBox[i],
            p2: correctedBox[(i + 1) % 4],
        };
        let collision = getLineIntersection(line, boxLine);
        if (collision) {
            return collision;
        }
    }
    return null;
}

let originalData: RedGData = null;

export function visualize(data: RedGData) {
    originalData = data;
    setupControls();
    DrawManager.getInstance().init("100%", "100%", data.objects, data.relationships);
    DrawManager.getInstance().drawWatermark();
    DetailViewManager.getInstance().init();
    DetailViewManager.getInstance().data = data;

    //DrawManager.getInstance().relations = data.relationships;
    //DrawManager.getInstance().entities = data.objects;
    DrawManager.getInstance().clickCallback = selectElement;
}

let prevId: string = "nope";

export function selectElement(id: string) {
    let selector = "svg g#" + id + " rect";
    if (prevId === id) {
        $("#detail-viewer").removeAttr("data-id");
        $(selector).css("stroke", "");
        $(selector).css("stroke-width", "");
        prevId = "nope";
        return;
    }
    $("#detail-viewer").attr("data-id", id);
    let prevSelector = "svg g#" + prevId + " rect";
    $(prevSelector).css("stroke", "");
    $(prevSelector).css("stroke-width", "");
    $(selector).css("stroke", "#c6050e");
    $(selector).css("stroke-width", "4");
    prevId = id;
    DetailViewManager.getInstance().updateView();
}

function setupControls() {
    $("#dummy-visibility").change((e) => {
        let value = (e.target as HTMLInputElement).value;
        let dummyGroups = $("svg .dummy");
        let dummyImplicitGroups = $("svg .dummy .implicit-attribute-group");
        let dummyImplicitBox = $("svg .dummy .implicit-attribute-box");
        let dummyExplicitGroups = $("svg .dummy .explicit-attribute-group");
        let dummyExplicitBox = $("svg .dummy .explicit-attribute-box");
        switch (value) {
            case "full":
                dummyGroups.css("display", "");
                dummyImplicitGroups.css("display", "");
                dummyImplicitBox.css("display", "");
                dummyExplicitGroups.css("display", "");
                dummyExplicitBox.css("display", "");
                break;
            case "minimal":
                dummyGroups.css("display", "");
                dummyImplicitGroups.css("display", "none");
                dummyImplicitBox.css("display", "none");
                dummyExplicitGroups.css("display", "none");
                dummyExplicitBox.css("display", "none");
                break;
            case "invisible":
                dummyGroups.css("display", "none");
                break;
        }
        DrawManager.getInstance().updateRelations();
    });
    $("#existing-visibility").change((e) => {
        let value = (e.target as HTMLInputElement).value;
        let existingGroups = $("svg .existing");
        let existingImplicitGroups = $("svg .existing .implicit-attribute-group");
        let existingImplicitBox = $("svg .existing .implicit-attribute-box");
        let existingExplicitGroups = $("svg .existing .explicit-attribute-group");
        let existingExplicitBox = $("svg .existing .explicit-attribute-box");
        switch (value) {
            case "full":
                existingGroups.css("display", "");
                existingImplicitGroups.css("display", "");
                existingImplicitBox.css("display", "");
                existingExplicitGroups.css("display", "");
                existingExplicitBox.css("display", "");
                break;
            case "minimal":
                existingGroups.css("display", "");
                existingImplicitGroups.css("display", "none");
                existingImplicitBox.css("display", "none");
                existingExplicitGroups.css("display", "none");
                existingExplicitBox.css("display", "none");
                break;
            case "invisible":
                existingGroups.css("display", "none");
                break;
        }
        DrawManager.getInstance().updateRelations();
    });
    $("#sqlValueToggle").change((e) => {
        DrawManager.getInstance().showSQLNames = (e.target as HTMLInputElement).checked;
        DetailViewManager.getInstance().showSqlNames = (e.target as HTMLInputElement).checked;
        DrawManager.getInstance().updateEntities();
        DrawManager.getInstance().updateRelations();
        DetailViewManager.getInstance().updateView();
    });
    $("#relationNameToggle").change((e) => {
        let display = (e.target as HTMLInputElement).checked ? "" : "none";
        $("svg .relation-text").css("display", display);
    });

    $("#export-svg").click(() => {
        let svg = (document.getElementById("visualization").getElementsByTagName("svg")[0] as SVGElement);
        saveSvg(svg, "redg-diagram.svg");
    });
    $("#export-png").click(() => {
        let svg = (document.getElementById("visualization").getElementsByTagName("svg")[0] as SVGElement);
        $("#png-export-size").html(`${svg.clientWidth} &times; ${svg.clientHeight}`);
        $("#png-export-modal").css("display", "flex");

    });

    $("#share").click(() => {
        let binaryString = pako.deflate(JSON.stringify(originalData), {to:"string"});
        let b64String = base64.encode(binaryString);
        let url = location.protocol + "//" + location.host + location.pathname + "#" + b64String;
        $("#share-url").val(url);
        $("#share-modal").css("display", "flex");
    });

    $("#share-close").click(() => {
        $("#share-modal").css("display", "none");
    });

    $("#png-export-cancel").click(() => {
        $("#png-export-modal").css("display", "none");
    });

    $("#png-export-confirm").click(() => {
        let scale = parseFloat((document.getElementById("png-export-scale") as HTMLInputElement).value);
        saveSvgAsPng(document.getElementById("visualization").getElementsByTagName("svg")[0], "redg-diagram.png", {scale});
        $("#png-export-modal").css("display", "none");
    });

    $("#png-export-scale").change((e) => {
        let scale = parseFloat((e.target as HTMLInputElement).value);
        let svg = (document.getElementById("visualization").getElementsByTagName("svg")[0] as SVGElement);
        let scaledWidth = svg.clientWidth * scale;
        let scaledHeight = svg.clientHeight * scale;
        $("#png-export-size").html(`${scaledWidth} &times; ${scaledHeight}`);

    });
}

function getConsolidatedMatrix(node: SVGGElement): SVGMatrix {
    let transforms = node.transform.baseVal;
    if (transforms.numberOfItems == 0) {
        let rootSvg = d3.select("#visualization-svg").node() as SVGSVGElement;
        let newTransform = rootSvg.createSVGTransform();
        newTransform.setTranslate(0, 0);
        transforms.initialize(newTransform);
    }
    return transforms.consolidate().matrix;
}
