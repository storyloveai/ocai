from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import json
import os
os.chdir(Path(__file__).parent / 'dist')
class SPAHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path=urlsplit(self.path).path
        if path == '/api/config':
            # The static local reader has no auth, payment provider or model transport.
            mode = os.environ.get('CREDIT_BILLING_MODE', 'off')
            payload = json.dumps({'auth': None, 'configured': False, 'billing': {
                'mode': mode, 'enabled': mode != 'off', 'ready': mode == 'off'}}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        if not Path('.'+path).is_file() and not Path('.'+path).suffix:
            self.path='/index.html'
        super().do_GET()
ThreadingHTTPServer(('127.0.0.1',3000),SPAHandler).serve_forever()
