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

export interface RedGData {
    version: string;
    objects: Array<RedGObject>;
    relationships: Array<RedGRelation>;
}

export interface RedGObject {
    id: string;
    type: string;
    sqlName: string;
    explicitFields: Array<RedGFieldValue>,
    implicitFields: Array<RedGFieldValue>,
    dummy: boolean,
    existingEntity: boolean,
    position: {
        x: number,
        y: number
    }
}

export interface RedGFieldValue {
    name: string;
    sqlName: string;
    value: string;
}

export interface RedGRelation {
    from: string;
    to: string;
    name: string;
    sqlName: string;
}

export class RedGModelHelper {

    public static findObjectById(id: string, objects: Array<RedGObject>): RedGObject {
        for (let object of objects) {
            if (object.id === id) {
                return object;
            }
        }
        return null;
    }
}
