/******/ (() => { // webpackBootstrap
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
figma.showUI(__html__);
figma.ui.resize(256, 100);
function addPadding(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
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
function sendPagename() {
    let name = figma.currentPage.name;
    figma.ui.postMessage({
        function: "pageName",
        pageName: name
    });
}
;
function check_child(child) {
    let UI;
    if (child.name.indexOf("EDU-") >= 0) {
        let UI = {
            name: child.name,
            x: child.x,
            y: child.y,
            width: child.width,
            height: child.height,
            opacity: child.opacity,
            parent: child.parent.name,
            rotation: child.rotation
        };
        return UI;
    }
    return UI;
}
;
async function sendScripts() {
}
;
async function sendJson(json) {
    figma.ui.postMessage({
        function: "addJson",
        jsonData: json
    });
}
;
async function sendImage(frame) {
    console.log(` sendImage(${frame.name})`);
    let iFormat = "PNG";
    let image = await frame.exportAsync({
        format: iFormat,
        constraint: {
            type: "WIDTH",
            value: 1290
        }
    });
    figma.ui.postMessage({
        function: "addImage",
        imageData: image,
        name: frame.name + `.${iFormat.toLowerCase()}`
    });
}
;
async function getFrames(type) {
    var sel = figma.currentPage.selection;
    if (type === "SECTION") {
        //alert('this is a section node');
        //@ts-ignore
        sel = figma.currentPage.selection[0].children;
    }
    if (type === "COMPONENT") {
        //alert('this is a component node')
        //@ts-ignore
        sel = figma.currentPage.selection[0].children;
    }
    //@ts-ignore
    if (sel[0].type == "COMPONENT") {
        //alert( sel[0].children.length)
        //alert('this the child is a single component node')
        //@ts-ignore 
        sel = sel[0].children;
    }
    //Figma selection is readonly, sort using x pos 
    let selectedFrames = Array.from(sel).sort((a, b) => a.x - b.x);
    let i = 1;
    let jsonData = [];
    let toTop = [];
    for (const frame of selectedFrames) {
        let uiData = [];
        let jsonUI = [];
        frame.name = addPadding(i, 2);
        // @ts-ignore
        frame.children.forEach(child => {
            let UI = check_child(child);
            if (UI) {
                uiData.push(child);
                jsonUI.push(UI);
                opacity_Toggle(child, false);
                if (child.name.indexOf("EDU-Step") > -1 || child.name.indexOf("EDU-swipe") > -1) {
                    toTop.push(child);
                }
                ;
            }
            ;
        });
        await sendImage(frame).then(() => {
            uiData.forEach(element => {
                opacity_Toggle(element, true);
            });
        });
        //reorder_toTop(layers)
        reOrder_layers(toTop);
        i++;
        jsonData.push({ name: frame.name, data: jsonUI, o_width: frame.width, o_height: frame.height });
    }
    ;
    let json = JSON.stringify(jsonData);
    sendJson(json);
    return sel;
}
;
function reOrder_layers(toTop) {
    toTop.forEach(element => {
        try {
            var parent = element.parent;
            let child = element;
            parent.appendChild(child);
        }
        catch (error) {
        }
    });
}
function waitDone() {
    let x = 1;
    figma.ui.onmessage = (message) => {
        if (message == 'done') {
            return;
        }
    };
}
;
async function main(type) {
    sendScripts();
    waitDone();
    await getFrames(type);
    sendPagename();
    sendDownload();
}
;
figma.ui.onmessage = (message) => {
    console.log(message);
    if (message == 'Close Plugin') {
        console.log('EDU-plugin shutting down');
        figma.ui.close;
        figma.closePlugin;
    }
};
function checkSelection() {
    var type = figma.currentPage.selection[0].type;
    return type;
}
main(checkSelection());
function sendDownload() {
    figma.ui.postMessage({
        function: "startDownload",
    });
}

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLFdBQVc7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLHNCQUFzQjtBQUNyRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsOEVBQThFO0FBQ3RHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZWR1LXVpLXdhbGt0aHJvdWdoLy4vc3JjL2NvZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZmlnbWEuc2hvd1VJKF9faHRtbF9fKTtcbmZpZ21hLnVpLnJlc2l6ZSgyNTYsIDEwMCk7XG5mdW5jdGlvbiBhZGRQYWRkaW5nKG51bWJlciwgZGlnaXRzKSB7XG4gICAgcmV0dXJuIEFycmF5KE1hdGgubWF4KGRpZ2l0cyAtIFN0cmluZyhudW1iZXIpLmxlbmd0aCArIDEsIDApKS5qb2luKCcwJykgKyBudW1iZXI7XG59XG47XG5mdW5jdGlvbiBvcGFjaXR5X1RvZ2dsZShub2RlLCBvdmVycmlkZSA9IHVuZGVmaW5lZCkge1xuICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICBub2RlLm9wYWNpdHkgPSArQm9vbGVhbihvdmVycmlkZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICBub2RlLm9wYWNpdHkgPSArIUJvb2xlYW4obm9kZS5vcGFjaXR5KTtcbiAgICByZXR1cm4gbm9kZTtcbn1cbjtcbmZ1bmN0aW9uIHNlbmRQYWdlbmFtZSgpIHtcbiAgICBsZXQgbmFtZSA9IGZpZ21hLmN1cnJlbnRQYWdlLm5hbWU7XG4gICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICBmdW5jdGlvbjogXCJwYWdlTmFtZVwiLFxuICAgICAgICBwYWdlTmFtZTogbmFtZVxuICAgIH0pO1xufVxuO1xuZnVuY3Rpb24gY2hlY2tfY2hpbGQoY2hpbGQpIHtcbiAgICBsZXQgVUk7XG4gICAgaWYgKGNoaWxkLm5hbWUuaW5kZXhPZihcIkVEVS1cIikgPj0gMCkge1xuICAgICAgICBsZXQgVUkgPSB7XG4gICAgICAgICAgICBuYW1lOiBjaGlsZC5uYW1lLFxuICAgICAgICAgICAgeDogY2hpbGQueCxcbiAgICAgICAgICAgIHk6IGNoaWxkLnksXG4gICAgICAgICAgICB3aWR0aDogY2hpbGQud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGNoaWxkLmhlaWdodCxcbiAgICAgICAgICAgIG9wYWNpdHk6IGNoaWxkLm9wYWNpdHksXG4gICAgICAgICAgICBwYXJlbnQ6IGNoaWxkLnBhcmVudC5uYW1lLFxuICAgICAgICAgICAgcm90YXRpb246IGNoaWxkLnJvdGF0aW9uXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBVSTtcbiAgICB9XG4gICAgcmV0dXJuIFVJO1xufVxuO1xuYXN5bmMgZnVuY3Rpb24gc2VuZFNjcmlwdHMoKSB7XG59XG47XG5hc3luYyBmdW5jdGlvbiBzZW5kSnNvbihqc29uKSB7XG4gICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICBmdW5jdGlvbjogXCJhZGRKc29uXCIsXG4gICAgICAgIGpzb25EYXRhOiBqc29uXG4gICAgfSk7XG59XG47XG5hc3luYyBmdW5jdGlvbiBzZW5kSW1hZ2UoZnJhbWUpIHtcbiAgICBjb25zb2xlLmxvZyhgIHNlbmRJbWFnZSgke2ZyYW1lLm5hbWV9KWApO1xuICAgIGxldCBpRm9ybWF0ID0gXCJQTkdcIjtcbiAgICBsZXQgaW1hZ2UgPSBhd2FpdCBmcmFtZS5leHBvcnRBc3luYyh7XG4gICAgICAgIGZvcm1hdDogaUZvcm1hdCxcbiAgICAgICAgY29uc3RyYWludDoge1xuICAgICAgICAgICAgdHlwZTogXCJXSURUSFwiLFxuICAgICAgICAgICAgdmFsdWU6IDEyOTBcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgZnVuY3Rpb246IFwiYWRkSW1hZ2VcIixcbiAgICAgICAgaW1hZ2VEYXRhOiBpbWFnZSxcbiAgICAgICAgbmFtZTogZnJhbWUubmFtZSArIGAuJHtpRm9ybWF0LnRvTG93ZXJDYXNlKCl9YFxuICAgIH0pO1xufVxuO1xuYXN5bmMgZnVuY3Rpb24gZ2V0RnJhbWVzKHR5cGUpIHtcbiAgICB2YXIgc2VsID0gZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uO1xuICAgIGlmICh0eXBlID09PSBcIlNFQ1RJT05cIikge1xuICAgICAgICAvL2FsZXJ0KCd0aGlzIGlzIGEgc2VjdGlvbiBub2RlJyk7XG4gICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICBzZWwgPSBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF0uY2hpbGRyZW47XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBcIkNPTVBPTkVOVFwiKSB7XG4gICAgICAgIC8vYWxlcnQoJ3RoaXMgaXMgYSBjb21wb25lbnQgbm9kZScpXG4gICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICBzZWwgPSBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF0uY2hpbGRyZW47XG4gICAgfVxuICAgIC8vQHRzLWlnbm9yZVxuICAgIGlmIChzZWxbMF0udHlwZSA9PSBcIkNPTVBPTkVOVFwiKSB7XG4gICAgICAgIC8vYWxlcnQoIHNlbFswXS5jaGlsZHJlbi5sZW5ndGgpXG4gICAgICAgIC8vYWxlcnQoJ3RoaXMgdGhlIGNoaWxkIGlzIGEgc2luZ2xlIGNvbXBvbmVudCBub2RlJylcbiAgICAgICAgLy9AdHMtaWdub3JlIFxuICAgICAgICBzZWwgPSBzZWxbMF0uY2hpbGRyZW47XG4gICAgfVxuICAgIC8vRmlnbWEgc2VsZWN0aW9uIGlzIHJlYWRvbmx5LCBzb3J0IHVzaW5nIHggcG9zIFxuICAgIGxldCBzZWxlY3RlZEZyYW1lcyA9IEFycmF5LmZyb20oc2VsKS5zb3J0KChhLCBiKSA9PiBhLnggLSBiLngpO1xuICAgIGxldCBpID0gMTtcbiAgICBsZXQganNvbkRhdGEgPSBbXTtcbiAgICBsZXQgdG9Ub3AgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGZyYW1lIG9mIHNlbGVjdGVkRnJhbWVzKSB7XG4gICAgICAgIGxldCB1aURhdGEgPSBbXTtcbiAgICAgICAgbGV0IGpzb25VSSA9IFtdO1xuICAgICAgICBmcmFtZS5uYW1lID0gYWRkUGFkZGluZyhpLCAyKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBmcmFtZS5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgICAgICAgIGxldCBVSSA9IGNoZWNrX2NoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgIGlmIChVSSkge1xuICAgICAgICAgICAgICAgIHVpRGF0YS5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICBqc29uVUkucHVzaChVSSk7XG4gICAgICAgICAgICAgICAgb3BhY2l0eV9Ub2dnbGUoY2hpbGQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQubmFtZS5pbmRleE9mKFwiRURVLVN0ZXBcIikgPiAtMSB8fCBjaGlsZC5uYW1lLmluZGV4T2YoXCJFRFUtc3dpcGVcIikgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0b1RvcC5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgO1xuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgc2VuZEltYWdlKGZyYW1lKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHVpRGF0YS5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgIG9wYWNpdHlfVG9nZ2xlKGVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvL3Jlb3JkZXJfdG9Ub3AobGF5ZXJzKVxuICAgICAgICByZU9yZGVyX2xheWVycyh0b1RvcCk7XG4gICAgICAgIGkrKztcbiAgICAgICAganNvbkRhdGEucHVzaCh7IG5hbWU6IGZyYW1lLm5hbWUsIGRhdGE6IGpzb25VSSwgb193aWR0aDogZnJhbWUud2lkdGgsIG9faGVpZ2h0OiBmcmFtZS5oZWlnaHQgfSk7XG4gICAgfVxuICAgIDtcbiAgICBsZXQganNvbiA9IEpTT04uc3RyaW5naWZ5KGpzb25EYXRhKTtcbiAgICBzZW5kSnNvbihqc29uKTtcbiAgICByZXR1cm4gc2VsO1xufVxuO1xuZnVuY3Rpb24gcmVPcmRlcl9sYXllcnModG9Ub3ApIHtcbiAgICB0b1RvcC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW1lbnQucGFyZW50O1xuICAgICAgICAgICAgbGV0IGNoaWxkID0gZWxlbWVudDtcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIHdhaXREb25lKCkge1xuICAgIGxldCB4ID0gMTtcbiAgICBmaWdtYS51aS5vbm1lc3NhZ2UgPSAobWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZSA9PSAnZG9uZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH07XG59XG47XG5hc3luYyBmdW5jdGlvbiBtYWluKHR5cGUpIHtcbiAgICBzZW5kU2NyaXB0cygpO1xuICAgIHdhaXREb25lKCk7XG4gICAgYXdhaXQgZ2V0RnJhbWVzKHR5cGUpO1xuICAgIHNlbmRQYWdlbmFtZSgpO1xuICAgIHNlbmREb3dubG9hZCgpO1xufVxuO1xuZmlnbWEudWkub25tZXNzYWdlID0gKG1lc3NhZ2UpID0+IHtcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICBpZiAobWVzc2FnZSA9PSAnQ2xvc2UgUGx1Z2luJykge1xuICAgICAgICBjb25zb2xlLmxvZygnRURVLXBsdWdpbiBzaHV0dGluZyBkb3duJyk7XG4gICAgICAgIGZpZ21hLnVpLmNsb3NlO1xuICAgICAgICBmaWdtYS5jbG9zZVBsdWdpbjtcbiAgICB9XG59O1xuZnVuY3Rpb24gY2hlY2tTZWxlY3Rpb24oKSB7XG4gICAgdmFyIHR5cGUgPSBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF0udHlwZTtcbiAgICByZXR1cm4gdHlwZTtcbn1cbm1haW4oY2hlY2tTZWxlY3Rpb24oKSk7XG5mdW5jdGlvbiBzZW5kRG93bmxvYWQoKSB7XG4gICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICBmdW5jdGlvbjogXCJzdGFydERvd25sb2FkXCIsXG4gICAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=