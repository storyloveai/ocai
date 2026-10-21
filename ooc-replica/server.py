from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import os
os.chdir(Path(__file__).parent / 'dist')
class SPAHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path=urlsplit(self.path).path
        if not Path('.'+path).is_file() and not Path('.'+path).suffix:
            self.path='/index.html'
        super().do_GET()
ThreadingHTTPServer(('127.0.0.1',3000),SPAHandler).serve_forever()
