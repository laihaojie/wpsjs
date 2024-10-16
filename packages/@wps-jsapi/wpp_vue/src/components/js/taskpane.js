import Util from "./util.js"

function onbuttonclick(idStr, param)
{
    if (typeof (window.Application.Enum) != "object") { // 如果没有内置枚举值
        window.Application.Enum = Util.WPS_Enum
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
            if (!doc){
                return "当前没有打开任何文档"
            }
            return doc.Name
        }
        case "openWeb": {
            break
        }
    }
}

export default{
    onbuttonclick
}