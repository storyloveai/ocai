#!/usr/bin/env python3
"""Protocol checks with fake responses. No service/image API is called."""
import base64
from contextlib import redirect_stdout, redirect_stderr
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
import urllib.error
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('klein_runner', ROOT / 'run.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class Response:
    status = 200
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self, *args):
        raw = (ROOT / 'baseline/gu-chengye.png').read_bytes()
        return json.dumps({'data': [{'b64_json': base64.b64encode(raw).decode(), 'seed': 103}]}).encode()


class RunnerChecks(unittest.TestCase):
    def invoke(self, out, args, opener=None):
        log = io.StringIO()
        argv = ['run.py', '--out', str(out)] + args
        with patch.object(sys, 'argv', argv), patch.dict('os.environ', {'ZEN5_API_KEY': 'synthetic-test-key'}, clear=False), patch.object(runner.urllib.request, 'build_opener', return_value=opener) as create, redirect_stdout(log), redirect_stderr(log):
            result = runner.main()
        return result, log.getvalue(), create

    def test_dry_run_is_offline_and_does_not_fabricate_results(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / 'results'
            result, log, create = self.invoke(out, [])
            self.assertEqual(result, 0)
            create.assert_not_called()
            report = json.loads((out / 'results.json').read_text())
            self.assertEqual(report['records'], [])
            self.assertIn('尚未生成', (out / 'index.html').read_text())
            self.assertNotIn('synthetic-test-key', log)

    def test_exact_original_prompts_multipart_and_resuming_do_not_repeat_requests(self):
        requests = []
        class Opener:
            def open(self, req, timeout):
                requests.append(req)
                return Response()
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / 'results'
            args = ['--run', '--base-url', 'https://team.invalid/ai-router/v1', '--archive']
            result, log, _ = self.invoke(out, args, Opener())
            self.assertEqual(result, 0)
            self.assertEqual(len(requests), 3)
            first = json.loads(requests[0].data)
            cases = json.loads((ROOT / 'cases.json').read_text())['cases']
            self.assertEqual(first, {'model': 'flux-3-image-klein', 'prompt': cases[0]['prompt'], 'seed': 103})
            self.assertEqual(requests[0].full_url, 'https://team.invalid/ai-router/v1/images/generations')
            self.assertEqual(requests[2].full_url, 'https://team.invalid/ai-router/v1/images/edits')
            self.assertIn(b'name="image"', requests[2].data)
            self.assertIn((ROOT / 'baseline/gu-chengye.png').read_bytes(), requests[2].data)
            self.assertNotIn('synthetic-test-key', log)
            self.assertNotIn('synthetic-test-key', (out / 'results.json').read_text())
            self.assertTrue(Path(str(out) + '.zip').is_file())
            self.invoke(out, args, Opener())
            self.assertEqual(len(requests), 3)

    def test_unauthorized_response_stops_without_retry_or_leaking_key(self):
        calls = []
        class Opener:
            def open(self, req, timeout):
                calls.append(req)
                raise urllib.error.HTTPError(req.full_url, 401, 'do not expose this body', {}, None)
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / 'results'
            result, log, _ = self.invoke(out, ['--run', '--base-url', 'https://team.invalid/v1'], Opener())
            self.assertEqual(result, 2)
            self.assertEqual(len(calls), 1)
            r = json.loads((out / 'results.json').read_text())['records']
            self.assertEqual(len(r), 1)
            self.assertEqual(r[0]['status'], 'failed')
            self.assertEqual(r[0]['httpStatus'], 401)
            self.assertNotIn('synthetic-test-key', json.dumps(r) + log)
            self.assertFalse(list(out.glob('*.png')))

    def test_inline_credentials_and_insecure_urls_fail_before_requests(self):
        for url in ['http://team.invalid/v1', 'https://user:secret@team.invalid/v1', 'https://team.invalid/v1?key=secret']:
            with tempfile.TemporaryDirectory() as d:
                with self.assertRaises(SystemExit):
                    self.invoke(Path(d) / 'results', ['--run', '--base-url', url])


if __name__ == '__main__':
    unittest.main()
