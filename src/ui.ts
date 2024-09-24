import JSZip from '../node_modules/jszip/dist/jszip.min.js';
import { saveAs } from 'file-saver';

//import edUI_file from "edUI";
//import eduNLA_file from "@edu/eduNLA";


var vers = '1.0.17';
console.log( `Loaded ui.ts v. ${vers}`);

// ADDED JSZip
// FIXed webpack --watch & buildd
let zip = new JSZip();
let zippedStuff = [];
let zipName ='';

window.addEventListener('load', function () {
    let spantag = document.getElementById("Version");
    spantag.innerHTML = `v. ${vers}`;
  });

function addFiles(name,data){
    console.log(`${name} zipped`)
    zip.file(name,data,{base64: true});
    zippedStuff.push({name,data});
};

async function getFileFromUrl(url, name, defaultType = 'image/jpeg'){
    const response = await fetch(url);
    const data = await response.blob();
    return new File([data], name, {
      type: data.type || defaultType,
    });
  }
async function getfile(filepath){
    const file = await getFileFromUrl(filepath,filepath.split('/')[1]);
    return file;


}
function sendScripts(){
    let data1_fp = './UI_walkthrough.jsx';
    let data1 = getfile(data1_fp);

    //let data2fp = './eduNLA';

    //fetch(data1fp).then( (data) => zip.file(data,'UI_walkthrough'));
    //let data1 = open(data1fp);
    zip.file(data1 ,'UI_walkthrough');

    parent.postMessage({ pluginMessage: 'done' }, '*');


    //await fetch(data2fp).then( (data) => zip.file(data,'eduNLA'));

};

function addJson(name,data){
    console.log('json zipped')
    zip.file(name,data);
    zippedStuff.push({name,data});
};

window.addEventListener("message", (event) => { 
    //console.log("message trigger") 
    let message = event.data;
    //console.log('MSG RCVD')

    if(event.data.pluginMessage){
        message = event.data.pluginMessage
        console.log(` message - ${message.function}`)

        if(message.function === "download"){
            let imgBlob = new Blob([message.imageData.buffer], { type: 'image/png' } )
            
            //saveAs(imgBlob);
            //downloadBlob(imgBlob,"download.png")
        };
        if(message.function === "pageName"){
            zipName = message.pageName;
            //console.log(zipName)
        }
        if(message.function === "addJson"){
            let jsonBlob = new Blob([message.jsonData], { type: 'application/json' } )
            //console.log(message.jsonData)
            //saveAs(jsonBlob);
            let name = 'test.json';
            zip.file(name,message.jsonData);
            //addJson(pagename,jsonBlob);

            //downloadBlob(jsonBlob,pagename)
        };
        if(message.function === "addImage"){

            let data = message.imageData;
            let name = message.name;
            let imgData = new Blob([message.imageData.buffer], { type: 'image/png' } )
            console.log( `${name}`+' sent to zip');
            addFiles(name,imgData);
        }
        if(message.function === "sendScripts"){
            //sendScripts();
        }
        if(message.function === "startDownload"){
            //console.log(zippedStuff);
            //let zip = zipTree(zippedStuff);
            zip.generateAsync({type:"blob"}).then(function(content) {
                // see FileSaver.js
                console.log('zip.genAsync()');
                console.log(content);
                
                //console.log(zippedStuff);
            saveAs(content, `${zipName}.zip`);
            parent.postMessage({ pluginMessage: 'Close Plugin' }, '*')

            });
        }
    }      
}, false); 

/* 
export function zipTree(tree) {
    let zip = new JSZip()
  
    function walkTree(target, tree) {
      for (let [name, content] of Object.entries(tree)) {
        let options
        if (Array.isArray(content)) {
          options = content[1]
          content = content[0]
        }
  
        if (typeof content === 'object' && content.toString() === '[object Object]') {
          let folder = target.folder(name, content, options)
  
          walkTree(folder, content)
        } else {
          target.file(name, content, options)
        }
      }
    }
  
    walkTree(zip, tree)
  
    return zip
  }
 */

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
