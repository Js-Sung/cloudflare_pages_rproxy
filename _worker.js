let key0 = "abc123";

export default {
  async fetch(request, env, ctx) {
    let key = env.key || key0;
    let url = new URL(request.url);
    //console.log('url================')
    //console.log("%o", url);
    if (url.pathname.startsWith('/')) {
      let a = url.pathname.slice(1) + url.search;
      if (a.length == 0 || a.toLowerCase() == 'index.html') {
        return nginx(200);
      }
      else if (a.search(new RegExp('^' + key + '\/', 'i')) != -1) {
        let b = a.slice(key.length + 1)
        if (b.length > 0 && isValidUrl(b)) {
          let url_real = new URL(b);
          let req = new Request(url_real, request);
          var res0, res1;
          try {
            res0 = await fetch(req);
          } catch (err) {
            return new Response('', { status: 400, headers: { 'Content-Type': 'text/plain' } });
          }
          res1 = new Response(res0.body, res0);

          enableCors(req, res1);
          // 设置 CORS 头
          //res1.headers.set('Access-Control-Allow-Origin', '*');
          //res1.headers.set('Access-Control-Allow-Headers', 'Content-Type');
          res1.headers.delete('report-to')
          //res1.headers.set('Content-Type', 'text/plain');

          //console.log('status: ', res1.status);
          //console.log('--------header---------');
          //console.log('%o', res1.headers);
          //console.log('---------body----------');
          //console.log('%o', res1.body);

          if (contentTypeIsText(res1.headers)) {
            // 30x重定向处理修改Header
            if (res1.status >= 300 && res1.status < 400) {
              var r = res1.headers.get('location');
              if (r) {
                var lo = r;
                if (r.search(new RegExp('^https?:', 'i')) != -1) {
                  lo = '\/' + key + '\/' + r;
                } else if (r.startsWith('/')) {
                  lo = url.origin + '\/' + key + '\/' + url_real.origin + r;
                } else {
                  lo = url.origin + '\/' + key + '\/' + url_real.origin + '\/' + r;
                }
                console.log('local:', r);
                console.log('new local:', lo);
                res1.headers.set('location', lo);
              }
            } else {
              // 修改body
              var bodytext = await res1.text();
              var reg;

              reg = new RegExp('(url|src|href|content)(=)(\'|")[.]?(\\\\?\/)(?!(\\\\?\/)|\\3)', 'ig');   // 单斜杠
              bodytext = bodytext.replace(reg, "$1$2$3" + '\/' + key + '\/' + url_real.origin + "$4");

              reg = new RegExp('(url|src|href|content)(=)(\'|")((\\\\?\/){2})(?!\\3)', 'ig');   // 双斜杠
              bodytext = bodytext.replace(reg, "$1$2$3" + '\/' + key + '\/' + url_real.protocol + "$4");

              reg = new RegExp('(src|href)(=)(\'|")(?!\/|\\\\|https?:|javascript:)', 'ig');   // 不带斜杠的
              bodytext = bodytext.replace(reg, "$1$2$3" + '\/' + key + '\/' + url_real.origin + "\/");

              reg = new RegExp('(url|src|href|content)(=)(\'|")(https?:)', 'ig');   // https?
              bodytext = bodytext.replace(reg, "$1$2$3" + '\/' + key + '\/' + "$4");

              //var reg1 = new RegExp('("|\'|\\()(https?:(?:\\\\?\/){2})', 'ig');

              console.log('---------text----------');
              //console.log(text);
              //var new_t = text.replace(reg1, "$1\/" + key + "\/$2");
              //var new_t = text;
              return new Response(bodytext, { status: res1.status, headers: res1.headers });
            }
          }

          return res1;
        } else {
          return nginx(400);
        }
      } else {
        return nginx(404);
      }
    }
    // Otherwise, serve the static assets.
    return nginx(200);
  },

};

function nginx(code) {
  var t, text;
  if (code == 200) {
    text = `<!DOCTYPE html><html><head><title>Welcome to nginx!</title><style>body{width: 35em;margin: 0 auto;font-family: Tahoma, Verdana, Arial, sans-serif;}</style></head><body><h1>Welcome to nginx!</h1><p>If you see this page, the nginx web server is successfully installed and  working. Further configuration is required.</p><p>For online documentation and support please refer to  <a href="http://nginx.org/">nginx.org</a>.<br/>  Commercial support is available at <a href="http://nginx.com/">nginx.com</a>.</p><p><em>Thank you for using nginx.</em></p></body></html>`;
  } else {
    switch (code) {
      case 403: t = '403 Forbidden'; break;
      case 404: t = '404 Not Found'; break;
      default: code = 500; t = '500 Internal Server Error'; break;
    }
    text = `<html><head><title>${t}</title></head><body><center><h1>${t}</h1></center><hr><center>nginx/1.18.0</center></body></html>`;
  }
  return new Response(text, { status: code, headers: new Headers({ "Content-Type": "text/html", 'access-control-allow-origin': '*' }) });
}


function isValidUrl(urlString) {
  var urlPattern = new RegExp('(?:https?):\/\/(\\w+:?\\w*)?(\\S+)(:\\d+)?(\/|\/([\\w#!:.?+=&%!-\/]))?', 'i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}

function contentTypeIsText(headers) {
  if (!headers.get("content-type") ||
    headers.get("content-type").indexOf('text/') !== -1 ||
    headers.get("content-type").indexOf('javascript') !== -1 ||
    headers.get("content-type").indexOf('urlencoded') !== -1 ||
    headers.get("content-type").indexOf('json') !== -1) {
    return true;
  } else {
    return false;
  }
}

function enableCors(req, res) {
  if (req.headers.get('access-control-request-method')) {
    res.headers.set('access-control-allow-methods', req.headers.get('access-control-request-method'));
  }

  if (req.headers.get('access-control-request-headers')) {
    res.headers.set('access-control-allow-headers', req.headers.get('access-control-request-headers'));
  }

  if (req.headers.origin) {
    res.headers.set('access-control-allow-origin', req.headers.origin);
    res.headers.set('access-control-allow-credentials', 'true');
  }
};
