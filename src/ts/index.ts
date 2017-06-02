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

import "normalize.css/normalize.css";
import "../css/roboto.css";
import "noty/lib/noty.css";


import * as CodeMirror from "codemirror";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/lib/codemirror.css";
import "../css/codemirror-redg.css";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/edit/matchbrackets.js";

import * as pako from "pako";
import * as base64 from "base-64";
import Noty from "noty";

import * as OfflinePluginRuntime from 'offline-plugin/runtime';

import "../css/main.css";

import * as $ from "jquery";
import {visualize} from "./visualize";
import {RedGData} from "./model";
import {calculateLayout} from "./layout";

OfflinePluginRuntime.install({
    onInstalled: () => {
        console.log("ServiceWorker installed!");
        /*new Noty({
            text: "RedG Visualizer can now be used offline!",
            type: "success"
        }).show();*/
    },
    onUpdateReady: () => {
        console.log("ServiceWorker can be updated!");
        /*new Noty({
            type: "info",
            text: "An update is available. Close all tabs running the Visualizer and reload the page to update."
        }).show();*/
    },
    onUpdated: () => {
        console.log("ServiceWorker updated!");
        /*new Noty({
            type: "success",
            text: "Updated successfully!"
        }).show();*/
    },
    onUpdating: () => {
        console.log("ServiceWorker updating!");
        /*new Noty({
            type: "info",
            text: "Updating..."
        }).show();*/
    },
    onUpdateFailed: () => {
        console.error("ServiceWorker update failed!");
       /*new Noty({
            type: "error",
            text: "The update failed!"
        }).show();*/
    }
});


let codeMirror = CodeMirror(document.getElementById("json-input") as any, {
    mode: "application/json",
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    theme: "redg"
} as any);

let jBody = $("body");

$("#file-drop-alternative").click((evt) => {
    evt.preventDefault();
    $("#file-input:hidden").trigger("click");
});

$("#file-input").change((evt) => {
    evt.stopPropagation();
    evt.preventDefault();

    let file = (evt.target as HTMLInputElement).files[0];
    handleFile(file);
});

let dropZone = $("#file-drop-zone");
dropZone.on("dragover", (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    (evt.originalEvent as DragEvent).dataTransfer.dropEffect = "copy";
});
dropZone.on("dragenter", function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    (evt.originalEvent as DragEvent).dataTransfer.dropEffect = "copy";
});
dropZone.on("dragleave", function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
});

dropZone.on("drop", function (evt) {
    evt.stopPropagation();
    evt.preventDefault();

    let file = (evt.originalEvent as DragEvent).dataTransfer.files[0];
    handleFile(file);
});

jBody.on("dragenter", function (evt) {
    evt.stopPropagation();
    evt.preventDefault();

    let top = $("#json-input").position().top;
    dropZone.css("top", (top + 7) + "px");
    dropZone.css("z-index", "200");
    dropZone.css("opacity", "1");

});
jBody.on("dragover", function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
});

jBody.on("dragleave", function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    let origEvent = (evt.originalEvent as DragEvent);
    if (origEvent.pageX === 0 && origEvent.pageY === 0) {
        dropZone.css("z-index", "1");
        dropZone.css("opacity", "0");
    }
});

jBody.on("drop", function (evt) {
    evt.stopPropagation();
    evt.preventDefault();

});

function handleReaderError(evt: ErrorEvent) {
    let errorText = $("#file-read-error");
    switch ((evt.target as any).error.code) {
        case (evt.target as any).error.NOT_FOUND_ERR:
            errorText.textContent = "File not found!";
            break;
        case (evt.target as any).error.NOT_READABLE_ERR:
            errorText.textContent = "File could not be read!";
            break;
        case (evt.target as any).error.ABORT_ERR:
            break; // noop
        default:
            errorText.textContent = "An error occurred while trying to read the file!";
    }
}

function updateReadProgress(evt: ProgressEvent) {
    let progress = $("#file-progress-percent");
    if (evt.lengthComputable) {
        let percentDone = Math.round((evt.loaded / evt.total) * 100);
        console.log("Done " + percentDone + "%");
        if (percentDone < 100) {
            progress.css("width", percentDone + "%");
        }
    }
}

function handleFile(file: File) {

    let reader = new FileReader();

    reader.onerror = handleReaderError;
    reader.onprogress = updateReadProgress;
    reader.onloadstart = function () {
        $("#file-progress-percent").css("width", "0");
        $("#file-progress-bar").addClass("loading");
    };

    reader.onload = function (e) {
        $("#file-progress-percent").css("width", "100%");
        codeMirror.setValue((e.target as FileReader).result);
        dropZone.css("z-index", "1");
        dropZone.css("opacity", "0");
    };
    reader.readAsText(file);
}

$("#start-visualize").click(function () {
    let code = codeMirror.getValue();
    let redGJson = {} as RedGData;
    try {
        redGJson = JSON.parse(code) as RedGData;
        console.log("JSON parsed successfully!");

    } catch (err) {
        alert(err);
        return;
    }
    visualizeData(redGJson);
});

window.addEventListener('popstate', (ev) => {
    console.log("Going back...");
    $("#data-input-container").css("display", "flex");
    $("#visualization-container").css("display", "none");
    let visualization = document.getElementById("visualization");
    while (visualization.firstChild) {
        visualization.removeChild(visualization.firstChild);
    }
});


if (location.hash && location.hash.length > 1) {
    // try to load json from hash
    let hashData = location.hash.substr(1);
    let data = base64.decode(hashData);
    let json = JSON.parse(pako.inflate(data, {to: "string"})) as RedGData;
    visualizeData(json);

}

function visualizeData(redGJson:RedGData) {
    if (history) {
        history.pushState("visualization", null, null);
    }
    $("#data-input-container").css("display", "none");
    $("#visualization-container").css("display", "flex");
    calculateLayout(redGJson);
    visualize(redGJson);
}
