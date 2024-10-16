import Util from "./util.js"

function onbuttonclick(idStr, param) {
    switch (idStr) {
        case "getDocName": {
            let doc = window.Application.ActiveWorkbook
            if (!doc) {
                return "当前没有打开任何文档"
            }
            return doc.Name;
        }
        case "createTaskPane": {
            let tsId = window.Application.PluginStorage.getItem("taskpane_id")
            if (!tsId) {
                let tskpane = window.Application.CreateTaskPane(Util.GetUrlPath() + "/taskpane")
                let id = tskpane.ID
                window.Application.PluginStorage.setItem("taskpane_id", id)
                tskpane.Visible = true
            } else {
                let tskpane = window.Application.GetTaskPane(tsId)
                tskpane.Visible = true
            }
            break
        }
        case "newDoc": {
            window.Application.Workbooks.Add()
            break
        }
        case "addString": {
            let curSheet = window.Application.ActiveSheet;
            if (curSheet) {
                curSheet.Cells.Item(1, 1).Formula = "Hello, wps加载项!" + curSheet.Cells.Item(1, 1).Formula
            }
            break;
        }
        case "closeDoc": {
            if (window.Application.Workbooks.Count < 2) {
                alert("当前只有一个文档，别关了。")
                break
            }

            let doc = window.Application.ActiveWorkbook
            if (doc)
                doc.Close()
            break
        }
        case "openWeb": {
            break
        }
    }

}

export default {
    onbuttonclick
}