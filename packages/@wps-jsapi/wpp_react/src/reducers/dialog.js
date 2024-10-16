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
                let doc = window.Application.ActivePresentation
                let textValue
                if (!doc){
                    textValue = "当前没有打开任何文档"
                } else {
                    textValue = doc.Name
                }
                let newState = state.set('docName', textValue)
                return newState
            }
        case NEWDOC:
            {
                window.Application.Presentations.Add()
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
        case CLOSEDOC:
            {
                if (window.Application.Presentations.Count < 2)
                {
                    alert("当前只有一个文档，别关了。")
                    break
                }
                    
                let doc = window.Application.ActivePresentation
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