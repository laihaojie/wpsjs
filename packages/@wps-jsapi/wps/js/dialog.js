function onbuttonclick(idStr)
{
    switch(idStr)
    {
        case "getDocName":{
                let doc = window.Application.ActiveDocument
                let textValue = ""
                if (!doc){
                    textValue = textValue + "当前没有打开任何文档"
                    return
                }
                textValue = textValue + doc.Name
                document.getElementById("text_p").innerHTML = textValue
                break
            }
        case "createTaskPane":{
                let tsId = window.Application.PluginStorage.getItem("taskpane_id")
                if (!tsId){
                    let tskpane = window.Application.CreateTaskPane(GetUrlPath() + "/taskpane.html")
                    let id = tskpane.ID
                    window.Application.PluginStorage.setItem("taskpane_id", id)
                    tskpane.Visible = true
                }else{
                    let tskpane = window.Application.GetTaskPane(tsId)
                    tskpane.Visible = true
                }
                break
            }
        case "newDoc":{
            window.Application.Documents.Add()
            break
        }
        case "addString":{
            let doc = window.Application.ActiveDocument
            if (doc){
                doc.Range(0, 0).Text="Hello, wps加载项!"
                //好像是wps的bug, 这两句话触发wps重绘
                let rgSel = window.Application.Selection.Range
                if (rgSel)
                    rgSel.Select()
            }
            break;
        }
        case "closeDoc":{
            if (window.Application.Documents.Count < 2)
            {
                alert("当前只有一个文档，别关了。")
                break
            }
                
            let doc = window.Application.ActiveDocument
            if (doc)
                doc.Close()
            break
        }
    }
    
}

window.onload = function () {
    var xmlReq = WpsInvoke.CreateXHR();
    var url = location.origin + "/.debugTemp/NotifyDemoUrl"
    xmlReq.open("GET", url);
    xmlReq.onload = function (res) {
        var node = document.getElementById("DemoSpan");
        node.innerText = res.target.responseText;
    };
    xmlReq.send();
}