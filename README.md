# wpsjs README

用于开发wps加载项的工具，让开发wps加载项更容易一点。提供：
* 快速创建 WPS 加载项项目，可以指定加载项单独用于文字/演示/电子表格，指定开发UI框架，目前提供原生/Vue/React三种选择
* 调试 WPS 加载项，在加载项目录执行 wpsjs debug 即可自动启动 WPS 客户端，查看加载项的效果
* 生成 WPS 加载项部署页面，通过该网页可以查看当前环境下所有的 WPS 加载项信息，并能对加载项进行安装/卸载/更新操作


# 版本改动
* v2.1.6:
修复vue框架下，在线部署会出现404的问题
* v2.1.3:
修复在无框架模式下，通过npm build --exe会失败的问题
* v2.1.2:
引入ts类型描述文件，支持代码提示
* v1.5.9:
支持通过wpsjs build --exe, 在win平台上将项目打包成exe文件，方便分发
* v1.5.8:
处理ribbon对象偶尔找不到的问题，处理wpsjs build的问题
* v1.5.5:
处理wpsjs debug在企业版失败的问题
* v1.5.4:
wpsjs create创建的示例工程支持vue3, node版本支持到V20.15
* v1.5.2:
支持wps个人版客户端自12.1.0.16910版本之后的wpsjs debug调试
* v1.4.5:
使用wpsjs-rpc-sdk包中的jssdk，去掉重复的文件
* v1.4.6:
修复linux下debug失败问题
* v1.4.7:
支持多用户，兼容老版本
* v1.4.8:
publish模式认证优化
* v1.4.9:
publish模式默认关闭多用户模式，后续有需求再修改wpsjs工具
* v1.4.10:
ribbon.js去掉js接口toLocaleDateString()和toLocaleTimeString()，解决linux环境下调用该接口报错的问题；
systemdemo.html获取文件路径的方式改一下，解决url含目录时，获取文件路径错误的问题；
publish.html兼容没有安全提示的版本；
* v1.4.11:
publish.html增加判断条件，只有同时满足加载项服务版本大于等于1.0.2而且开启了多用户，请求才带上serverID
* v1.4.12:
统一流程，sdk返回的状态码result.status !== 0时，代表操作执行失败，然后判断客户端是否退出；执行成功后的逻辑统一放到result.status == 0下；
result.status !== 0，sdk返回的消息在result.message里；result.status == 0时，sdk返回的消息在result.response里；
publish模式支持多用户