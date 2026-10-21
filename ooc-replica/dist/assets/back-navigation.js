// Use browser Back only for navigation entries created by this application.
export function returnFromAnnouncement(path,h,history=window.history){
 const state=history?.state;
 if(state?.storydateNavigation&&typeof state.from==='string'&&state.from.startsWith('/')&&!state.from.startsWith('//')&&history.length>1&&!(path==='/announcement'&&state.from.startsWith('/announcement/')))history.back();
 else h.navigate(path==='/announcement'?'/':'/announcement');
}
