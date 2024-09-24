
figma.showUI(__html__);
figma.ui.resize(256,100);

function addPadding(number: string | number, digits: number) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
};

function opacity_Toggle( node, override = undefined ){
  if (override){
      node.opacity = +Boolean(override);
      return node;
  }
  node.opacity = +!Boolean(node.opacity);
  return node;
};

function sendPagename(){
  let name = figma.currentPage.name;
  figma.ui.postMessage({
    function:"pageName",

    pageName: name
  })

};

function check_child(child){
  let UI;
  if( child.name.indexOf("EDU-") >= 0 ){
      let UI = {
          name:child.name,
          x:child.x,
          y:child.y,
          width:child.width,
          height:child.height,
          opacity:child.opacity,
          parent:child.parent.name,
          rotation:child.rotation
      }
     return UI;        
  }
  return UI;   
};

async function sendScripts(){

};

async function sendJson(json){
  figma.ui.postMessage(
      {
        function:"addJson",
        jsonData : json
      });
};

async function sendImage(frame){
  console.log(` sendImage(${frame.name})`);
  let iFormat = "PNG"

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
      name: frame.name+`.${iFormat.toLowerCase()}`
  });
};  

async function getFrames(type){
  
  var sel = figma.currentPage.selection;
  if(type === "SECTION"){
    //alert('this is a section node');
    //@ts-ignore
    sel = figma.currentPage.selection[0].children;
  }
  if (type === "COMPONENT"){
    //alert('this is a component node')
    //@ts-ignore
    sel = figma.currentPage.selection[0].children;
  }
      //@ts-ignore


  if(sel[0].type == "COMPONENT" ){
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
    frame.name = addPadding(i,2);
    // @ts-ignore
    frame.children.forEach(
      child => {
          let UI = check_child(child);  
          if(UI){
              uiData.push(child);
              jsonUI.push(UI);
              opacity_Toggle(child,false);
              if(child.name.indexOf("EDU-Step")>-1 || child.name.indexOf("EDU-swipe")>-1){
                toTop.push(child);
              };
          };
    });
   

    await sendImage(frame).then(
    ()=>{
      uiData.forEach(element => {
        opacity_Toggle(element,true);
        
      });
    }
    );

    //reorder_toTop(layers)
    reOrder_layers(toTop);

    i++;


    jsonData.push({name:frame.name,data:jsonUI,o_width:frame.width,o_height:frame.height});
  };
  let json = JSON.stringify(jsonData);
  sendJson(json);
  return sel;
};

function reOrder_layers(toTop) {
  toTop.forEach(element => {
    try {
      var parent = element.parent;
      let child = element;
      parent.appendChild(child);
      
    } catch (error) {
      
    }
    
  });
}

function waitDone(){
  let x = 1;

  figma.ui.onmessage = (message) => {

    if(message=='done'){
      return
    }
  }

    
};

async function main(type){
  sendScripts();
  waitDone();
  await getFrames(type);
  sendPagename();
  sendDownload();
 
};

figma.ui.onmessage = (message) => {
  console.log(message);
  if (message=='Close Plugin'){
    console.log('EDU-plugin shutting down')
    figma.ui.close;
    figma.closePlugin;
  }
};

function checkSelection(){
  var type = figma.currentPage.selection[0].type;
  return type
}


main(checkSelection());


function sendDownload() {
  figma.ui.postMessage({
    function:"startDownload",
  });
  
}

