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

import {RedGData} from "./model";
import * as dagre from "dagre";
import {DrawManager} from "./visualize";

export function calculateLayout(data: RedGData) {
    let g = new dagre.graphlib.Graph();
    g.setGraph({
        rankDir: "LR",
        marginx: 10,
        marginy: 10,
    });
    g.setDefaultEdgeLabel(() => {return {}});

    data.objects.forEach((entity) => {
        let width = DrawManager.BOX_WIDTH;
        let height = DrawManager.LINE_SPACING * (2.5 + entity.implicitFields.length + entity.explicitFields.length);
        g.setNode(entity.id, {
            id: entity.id,
            width,
            height,
        });
    });

    data.relationships.forEach((rel) => {
        g.setEdge(rel.from, rel.to);
    });

    dagre.layout(g);

    data.objects.forEach((entity) => {
        let nodeData = g.node(entity.id);
        entity.position = {
            x: nodeData.x - DrawManager.BOX_WIDTH / 2,
            y: nodeData.y - (DrawManager.LINE_SPACING * (2.5 + entity.implicitFields.length + entity.explicitFields.length)) / 2,
        }
    });

}
