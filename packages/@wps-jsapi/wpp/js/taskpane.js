function onbuttonclick(idStr)
{
    if (typeof (window.Application.Enum) != "object") { // 如果没有内置枚举值
        window.Application.Enum = WPS_Enum
    }
    switch(idStr)
    {
        case "dockLeft":{
            let tsId = window.Application.PluginStorage.getItem("taskpane_id")
            if (tsId){
                let tskpane = window.Application.GetTaskPane(tsId)
                tskpane.DockPosition = window.Application.Enum.msoCTPDockPositionLeft
            }
            break
            }
        case "dockRight":{
            let tsId = window.Application.PluginStorage.getItem("taskpane_id")
            if (tsId){
                let tskpane = window.Application.GetTaskPane(tsId)
                tskpane.DockPosition = window.Application.Enum.msoCTPDockPositionRight
            }
            break
        }
        case "hideTaskPane":{
            let tsId = window.Application.PluginStorage.getItem("taskpane_id")
            if (tsId){
                let tskpane = window.Application.GetTaskPane(tsId)
                tskpane.Visible = false
            }
            break
        }
        case "addString":{
            let doc = window.Application.ActivePresentation
            if (doc){
                if (doc.Slides.Item(1)){
                    let shapes = doc.Slides.Item(1).Shapes
                    let shape = null
                    if (shapes.Count > 0){
                        shape = shapes.Item(1)
                    }else{
                        shape = shapes.AddTextbox(2, 20,20,300,300)
                    }
                    if (shape){
                        shape.TextFrame.TextRange.Text="Hello, wps加载项!" + shape.TextFrame.TextRange.Text
                    }
                }
            }
            break;
        }
        case "getDocName":{
            let doc = window.Application.ActivePresentation
            let textValue = ""
            if (!doc){
                textValue = textValue + "当前没有打开任何文档"
                return
            }
            textValue = textValue + doc.Name
            document.getElementById("text_p").innerHTML = textValue
            break
        }
    }
}

window.onload = ()=>{
    var xmlReq = WpsInvoke.CreateXHR();
    var url = location.origin + "/.debugTemp/NotifyDemoUrl"
    xmlReq.open("GET", url);
    xmlReq.onload = function (res) {
        var node = document.getElementById("DemoSpan");
        window.document.getElementById("DemoSpan").innerHTML = res.target.responseText;
    };
    xmlReq.send();
}