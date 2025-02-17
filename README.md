# cloudflare_pages_rproxy
- 基于cloudflare pages的简易反向代理
- A simple reverse proxy based on cloudflare pages

## 简介
- 本项目实现反代任意网站，并在服务端替换网页中的超链接为反代链接。（处理非常简陋，访问一些简单的网站还是可以的，想要更好的浏览体验可以使用[jsproxy](https://github.com/EtherDream/jsproxy)）
- 在网址中设置了一个路径作为key，防止其他人也轻松使用上你的反代服务。
- 如反代`https://jqlang.org`则需要访问`https://youpages.pages.dev/abc123/https://jqlang.org`
- 其中abc123就是默认的key，不匹配的会返回nginx错误页。该key建议按下方提示修改。

## 使用方式
- 下载本仓库中的_worker.js并压缩，部署到cloudflare pages项目上。（建议在部署前添加环境变量key为你想要的值，或者直接修改文件中key0的值）
- ![](1.png)
- 访问`https://youpages.pages.dev/<yourkey>/https://jqlang.org`测试。
- 建议在自定义域中添加自己的域名，体验比pages.dev域名要好。
