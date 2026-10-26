if(window.top===window.self){
 const link=document.createElement('a');
 link.href=new URL('/assets/logo-lab/index.html',location.origin).href;link.textContent='比较 Logo 方案 ↗';
 link.setAttribute('aria-label','打开 Logo 方案对比');
 link.style.cssText='position:fixed;right:20px;bottom:24px;z-index:90;padding:11px 16px;border:1px solid #b8995d80;border-radius:999px;background:#23201df2;color:#ead5ac;font:13px system-ui;box-shadow:0 6px 20px #0006;text-decoration:none';
 document.body.append(link);
}
