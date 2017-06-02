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

declare module "noty" {

    export type LayoutOptions = "top" | "topLeft" | "topCenter" | "topRight" | "center" | "centerRight"
        | "centerLeft" | "bottom" | "bottomLeft" | "bottomCenter" | "bottomRight";
    export type DefaultThemes = "relax" | "mint" | "metroui";
    export type TypeOptions = "alert" | "success" | "error" | "warning" | "info";

    export interface AnimationOptions {
        open?: string | (() => void) ;
        close?: string | (() => void) ;
    }

    export interface SoundOptions {
        sources?: string[];
        volume? : number;
        conditions?: string[];
    }

    export interface TitleCountOptions {
        conditions?: string[];
    }

    export interface Callbacks {
        beforeShow?: (() => void);
        onShow?: (() => void);
        afterShow?: (() => void);
        onClose?: (() => void);
        afterClose?: (() => void);
        onHover?: (() => void);
        onTemplate?: (() => void);
    }

    export interface NotyOptions {
        type? : TypeOptions;
        text: string;
        layout?: LayoutOptions;
        theme?: DefaultThemes | string;
        timeout? : boolean | number;
        progressBar? : boolean;
        closeWith? : string[];
        animation? : AnimationOptions;
        sounds? : SoundOptions;
        titleCount?: TitleCountOptions;
        modal?: boolean;
        id? : string | boolean;
        force? : boolean;
        queue? : string;
        killer? : string | boolean;
        container? : string | boolean;
        buttons?: any[]; // Too much work for now

    }


    export default class Noty {
        public show(): void;
        public close():void;
        public setText(text:string):void;
        public setType(type:string):void;
        public setTheme(theme:string):void;
        public setTimeout(val: boolean | number): void;
        public stop():void;
        public resume():void;

        public constructor(options: NotyOptions);

        public on(event: string, func: (() => void)): Noty;

        public closeAll(queue?: string): void;
        public setMaxVisible(num: number, queue?:string): void;

    }

}


