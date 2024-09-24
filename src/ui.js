import JSZip from '../node_modules/jszip/dist/jszip.min.js';
import { saveAs } from 'file-saver';
var vers = 0.021;
vers = +(vers);
console.log(`Loaded ui.ts v. ${vers}`);
// ADDED JSZip
// FIXed webpack --watch & build
let zip = new JSZip();
let zippedStuff = [];
function addFiles(name, data) {
    console.log(`${name}`);
    zip.file(name, data, { base64: true });
    zippedStuff.push({ name, data });
}
;
function addJson(name, data) {
    console.log('json zipped');
    zip.file(name, data);
    zippedStuff.push({ name, data });
}
;
window.addEventListener("message", (event) => {
    //console.log("message trigger") 
    let message = event.data;
    //console.log('MSG RCVD')
    if (event.data.pluginMessage) {
        message = event.data.pluginMessage;
        console.log(`${message.function} - message`);
        if (message.function === "download") {
            let imgBlob = new Blob([message.imageData.buffer], { type: 'image/png' });
            //saveAs(imgBlob);
            //downloadBlob(imgBlob,"download.png")
        }
        ;
        if (message.function === "addJson") {
            let jsonBlob = new Blob([message.jsonData], { type: 'application/json' });
            //console.log(message.jsonData)
            //saveAs(jsonBlob);
            let pagename = 'test.json';
            addJson(pagename, jsonBlob);
            //downloadBlob(jsonBlob,pagename)
        }
        ;
        if (message.function === "addImage") {
            let data = message.imageData;
            let name = message.name;
            console.log(`${name}` + 'sent to zip');
            addFiles(name, data);
        }
        if (message.function === "startDownload") {
            zippedStuff.forEach(element => {
                zip.file(element.name, element.data);
                console.log('zipping' + element.name);
            });
            zip.generateAsync({ type: "blob" }).then(function (content) {
                // see FileSaver.js
                console.log('zip generated');
                //
                console.log(zippedStuff);
                saveAs(content, "test.zip");
            });
        }
    }
}, false);
/* DEPRECATAD BY saveAS
//ui.html (plugin iframe)
function downloadBlob(blob, name = 'download') {
    // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
    const blobUrl = URL.createObjectURL(blob)

    // Create a link element
    const link = document.createElement("a")

    // Set link's href to point to the Blob URL
    link.href = blobUrl
    link.download = name

    // Append link to the body
    document.body.appendChild(link)

    // Dispatch click event on the link
    // This is necessary as link.click() does not work on the latest firefox
    link.dispatchEvent(
        new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
        })
    )

    // Remove link from body
    document.body.removeChild(link)
}; */
