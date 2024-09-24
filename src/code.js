figma.showUI(__html__);
function check_child(child) {
    let myChild = false;
    if (child.name.replace('* ', '').startsWith("EDU-")) {
        let myChild = {
            name: child.name,
            x: child.x,
            y: child.y,
            width: child.width,
            height: child.height,
            opacity: child.opacity,
            parent: child.parent.name,
        };
        return myChild;
    }
    return myChild;
}
;
function opacity_Toggle(node, override = undefined) {
    if (override) {
        node.opacity = +Boolean(override);
        return node;
    }
    node.opacity = +!Boolean(node.opacity);
    return node;
}
;
var myImages = [];
async function frameData() {
    //DEPR TO RENAMED FRAMES
    //const selectedFrames = figma.currentPage.selection;
    const selectedFrames = renameFrames();
    let myFrames = [];
    selectedFrames.forEach(async (selElement) => {
        let elName = selElement.name;
        let uiData = [];
        sendImage(selElement);
        // @ts-ignore
        selElement.children.forEach(child => {
            let hasEDU = check_child(child);
            if (hasEDU) {
                uiData.push(hasEDU);
            }
            ;
        });
        //CREATES ELEMENT AND STORES AT ARRAY
        let thisE = { name: elName, data: uiData };
        myFrames.push(thisE);
    });
    return await myFrames;
}
;
async function sendImage(frame) {
    console.log(` sendImage(${frame.name})`);
    let image = await frame.exportAsync({
        format: "PNG",
        constraint: {
            type: "WIDTH",
            value: 1290
        }
    });
    figma.ui.postMessage({
        function: "addImage",
        imageData: image,
        name: frame.name
    });
}
;
//SEND JSON TO UI
async function sendJson(jsonData) {
    let jD = await JSON.stringify(jsonData);
    //let Data = await JSON.parse(jsonData);
    //console.log(jD);
    figma.ui.postMessage({
        function: "addJson",
        jsonData: jD
    });
}
;
async function startDownload() {
    figma.ui.postMessage({
        function: "startDownload",
    });
}
// ADD PADDING TO INT
function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
}
;
function renameFrames() {
    var sel = figma.currentPage.selection;
    var mysel = [];
    //SELECTION CLONE
    for (const F of sel) {
        mysel.push(F);
    }
    ;
    //SORT BY x pos
    sel = mysel.sort((a, b) => a.x - b.x);
    for (let index = 0; index < sel.length; index++) {
        const element = sel[index];
        element.name = padDigits(index + 1, 2);
    }
    return sel;
}
;
async function main() {
    let data = await frameData();
    //sortbyname
    data = data.sort((a, b) => a.name.localeCompare(b.name));
    await sendJson(data);
    //sendImages(myImages);
    await startDownload();
}
;
main();
