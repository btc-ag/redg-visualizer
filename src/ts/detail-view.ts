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

import {RedGData, RedGModelHelper} from "./model";
import * as $ from "jquery";
import * as d3 from "d3";
import {selectElement} from "./visualize";

export class DetailViewManager {

    private static instance: DetailViewManager = new DetailViewManager();
    private _data: RedGData;
    public showSqlNames: boolean = false;

    private titleElem: JQuery;
    private detailViewerElem: JQuery;

    public static getInstance(): DetailViewManager {
        return DetailViewManager.instance;
    }

    public set data(data: RedGData) {
        this._data = data;
        this.updateView();
    }

    public init(): void {
        this.titleElem = $("#detail-title");
        this.detailViewerElem = $("#detail-viewer");
    }

    public updateView(): void {
        let id = this.detailViewerElem.attr("data-id");
        if (!id) {
            return;
        }
        id = id.substr(1, id.length - 1);
        let object = RedGModelHelper.findObjectById(id, this._data.objects);
        this.titleElem.text(this.showSqlNames ? object.sqlName : object.type);

        let explicitTable = d3.select("#detail-explicit-attributes");
        let expRows = explicitTable.selectAll("tr").data(object.explicitFields);
        expRows.select("td.type").text((d) => this.showSqlNames ? d.sqlName : d.name);
        expRows.select("td.value").text((d) => d.value);
        expRows.exit().remove();
        let expRow = expRows.enter()
            .append("tr");
        expRow.append("td")
            .classed("type", true)
            .text((d) => this.showSqlNames ? d.sqlName : d.name);
        expRow.append("td")
            .classed("value", true)
            .text((d) => d.value);
        if (explicitTable.selectAll("tr").empty()) {
            d3.select("#detail-explicit-attributes-no-content").style("display", "block");
        } else {
            d3.select("#detail-explicit-attributes-no-content").style("display", "none");
        }

        let implicitTable = d3.select("#detail-implicit-attributes");
        let impRows = implicitTable.selectAll("tr").data(object.implicitFields);
        impRows.select("td.type").text((d) => this.showSqlNames ? d.sqlName : d.name);
        impRows.select("td.value").text((d) => d.value);
        impRows.exit().remove();
        let impRow = impRows.enter()
            .append("tr");
        impRow.append("td")
            .classed("type", true)
            .text((d) => this.showSqlNames ? d.sqlName : d.name);
        impRow.append("td")
            .classed("value", true)
            .text((d) => d.value);
        if (implicitTable.selectAll("tr").empty()) {
            d3.select("#detail-implicit-attributes-no-content").style("display", "block");
        } else {
            d3.select("#detail-implicit-attributes-no-content").style("display", "none");
        }

        let relations = this._data.relationships
            .filter((relation) => relation.from === id)
            .map((relation) => {
                return {relation, target: RedGModelHelper.findObjectById(relation.to, this._data.objects)}
            });
        let detailRelationsDiv = d3.select("#detail-relations");
        let detRels = detailRelationsDiv.selectAll("div").data(relations);
        detRels.select("span.relation-name").text((d) => this.showSqlNames ? d.relation.sqlName : d.relation.name);
        detRels.select("span.relation-target")
            .attr("data-target-id", (d) => (d.target) ? d.target.id : null)
            .text((d) => this.showSqlNames ? ((d.target) ? d.target.sqlName : "NULL") : ((d.target) ? d.target.type : "null"));
        detRels.exit().remove();
        let newDetDiv = detRels.enter().append("div").classed("relation-div", true);
        newDetDiv.append("span")
            .classed("relation-name", true)
            .text((d) => this.showSqlNames ? d.relation.sqlName : d.relation.name);
        newDetDiv.append("span")
            .classed("relation-arrow", true)
            .text("\u2192");
        newDetDiv.append<HTMLSpanElement>("span")
            .classed("relation-target", true)
            .attr("data-target-id", (d) => (d.target) ? d.target.id : null)
            .text((d) => this.showSqlNames ? ((d.target) ? d.target.sqlName : "NULL") : ((d.target) ? d.target.type : "null"))
            .on("click", (d) => {
                if (d.target) {
                    selectElement("e" + d.target.id);
                }
            });

        if (detailRelationsDiv.selectAll("div").empty()) {
            d3.select("#detail-relations-no-content").style("display", "block");
        } else {
            d3.select("#detail-relations-no-content").style("display", "none");
        }


    }
}
