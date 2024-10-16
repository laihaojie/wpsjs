function onbuttonclick(idStr)
{
    switch(idStr)
    {
        case "getDocName":{
                let doc = window.Application.ActiveWorkbook
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
            window.Application.Workbooks.Add()
            break
        }
        case "addString":{
            let curSheet = window.Application.ActiveSheet;
            if (curSheet){
                curSheet.Cells.Item(1, 1).Formula="Hello, wps加载项!" + curSheet.Cells.Item(1, 1).Formula
            }
            break;
        }
        case "closeDoc":{
            if (window.Application.Workbooks.Count < 2)
            {
                alert("当前只有一个文档，别关了。")
                break
            }
                
            let doc = window.Application.ActiveWorkbook
            if (doc)
                doc.Close()
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