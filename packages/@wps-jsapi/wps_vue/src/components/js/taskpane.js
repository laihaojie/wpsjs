import Util from './util.js'

function onbuttonclick(idStr, param) {
  if (typeof window.Application.Enum != 'object') {
    // 如果没有内置枚举值
    window.Application.Enum = Util.WPS_Enum
  }
  switch (idStr) {
    case 'dockLeft': {
      let tsId = window.Application.PluginStorage.getItem('taskpane_id')
      if (tsId) {
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.DockPosition = window.Application.Enum.msoCTPDockPositionLeft
      }
      break
    }
    case 'dockRight': {
      let tsId = window.Application.PluginStorage.getItem('taskpane_id')
      if (tsId) {
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.DockPosition = window.Application.Enum.msoCTPDockPositionRight
      }
      break
    }
    case 'hideTaskPane': {
      let tsId = window.Application.PluginStorage.getItem('taskpane_id')
      if (tsId) {
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.Visible = false
      }
      break
    }
    case 'addString': {
      let doc = window.Application.ActiveDocument
      if (doc) {
        doc.Range(0, 0).Text = 'Hello, wps加载项!'
        //好像是wps的bug, 这两句话触发wps重绘
        let rgSel = window.Application.Selection.Range
        if (rgSel) rgSel.Select()
      }
      break
    }
    case 'getDocName': {
      let doc = window.Application.ActiveDocument
      if (!doc) {
        return '当前没有打开任何文档'
      }
      return doc.Name
    }
    case 'openWeb': {
      break
    }
  }
}

export default {
  onbuttonclick
}
