import { GETDOCNAME, CREATETASKPANE, NEWDOC, ADDSTRING, CLOSEDOC, SETDEMOSPAN, OPENWEB } from "../actions/dialog";
import * as Immutable from "immutable";
import Util from "../js/util.js"

/* global wps:false */

const defaultState = Immutable.Map({
    docName: null,
    demoSpan: "waiting..."
});

export default function (state = defaultState, action) {
    switch (action.type) {
        case GETDOCNAME:
            {
                let docName = window.Application.ActiveDocument.Name
                let newState = state.set('docName', docName)
                return newState
            }
        case NEWDOC:
            {
                window.Application.Documents.Add()
                break;
            }
        case CREATETASKPANE:
            {
                let tsId = window.Application.PluginStorage.getItem("taskpane_id")
                if (!tsId){
                    let tskpane = window.Application.CreateTaskPane(Util.GetUrlPath() + "taskpane")
                    let id = tskpane.ID
                    window.Application.PluginStorage.setItem("taskpane_id", id)
                    tskpane.Visible = true
                }else{
                    let tskpane = window.Application.GetTaskPane(tsId)
                    tskpane.Visible = true
                }
                break
            }
        case ADDSTRING:
            {
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
        case CLOSEDOC:
            {
                if (window.Application.Documents.Count < 2)
                {
                    alert("当前只有一个文档，别关了。")
                    break
                }
                    
                let doc = window.Application.ActiveDocument
                if (doc)
                    doc.Close()
                break;
            }
        case SETDEMOSPAN:
            {
                let newState = state.set('demoSpan', action.data)
                return newState
            }
        case OPENWEB:
            {
                let param = state.get('demoSpan')
                window.Application.OAAssist.ShellExecute(param)
            }
        default:
    }
    return state;
}