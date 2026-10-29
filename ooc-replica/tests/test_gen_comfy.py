import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from PIL import Image

SCRIPT = Path(__file__).resolve().parents[2] / 'game/sanguo/tools/gen_comfy.py'
spec = importlib.util.spec_from_file_location('gen_comfy', SCRIPT)
gen = importlib.util.module_from_spec(spec); spec.loader.exec_module(gen)


def image_bytes():
    out = io.BytesIO(); Image.new('RGB', (48, 32), 'gold').save(out, 'PNG'); return out.getvalue()


class ComfyTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.root = Path(self.temp.name)
        self.patch = patch.multiple(gen, R=self.root, ART=self.root / 'art', COVERS=self.root / 'covers')
        self.patch.start(); (self.root / 'art').mkdir()
        self.jobs = [dict(id='scene-one', kind='scene', name='one', refs=[], prompt='Authored prompt. {{do not substitute}}', negative_prompt='No text.', size='1024x1024', out=[12, 4])]
        (self.root / 'jobs.jsonl').write_text('\n'.join(map(json.dumps, self.jobs)))
        self.args = gen.parser().parse_args(['--jobs', str(self.root / 'jobs.jsonl'), '--url', 'http://comfy.test', '--records', str(self.root / 'records.json')])

    def tearDown(self):
        self.patch.stop(); self.temp.cleanup()

    def test_dry_run_is_offline_and_validates_selection_paths(self):
        self.args.dry_run = True
        with patch('builtins.print') as printed:
            self.assertEqual(gen.run(self.args, lambda *a: self.fail('must not connect')), 0)
        self.assertEqual(json.loads(printed.call_args.args[0])[0]['id'], 'scene-one')
        self.assertFalse((self.root / 'records.json').exists())
        self.args.ids = 'not-a-job'
        self.assertRaises(ValueError, gen.run, self.args)
        self.assertRaises(ValueError, gen.target, {**self.jobs[0], 'name': '../escape'})

    def test_official_nodes_keep_authored_prompts_and_all_reference_slots(self):
        graph = gen.workflow(self.jobs[0], ['style.png', 'a.png', 'b.png'], self.args, 123)
        self.assertEqual(graph['22']['inputs']['prompt'], self.jobs[0]['prompt'])
        self.assertEqual(graph['23']['inputs']['prompt'], 'No text.')
        self.assertEqual(graph['22']['inputs']['image3'], ['12', 0])
        self.assertEqual(graph['30']['inputs']['seed'], 123)
        self.assertEqual(graph['30']['inputs']['cfg'], 4)
        self.assertEqual(graph['32']['class_type'], 'SaveImage')
        template = self.root / 'workflow.json'
        template.write_text(json.dumps({'1': {'class_type': 'SaveImage', 'inputs': {'text': '{{prompt}}', 'seed': '{{seed}}', 'image': '{{image2}}'}}}))
        self.args.workflow_api = str(template)
        custom = gen.workflow(self.jobs[0], ['style.png', 'cast.png'], self.args, 22)
        self.assertEqual(custom['1']['inputs'], {'text': self.jobs[0]['prompt'], 'seed': 22, 'image': 'cast.png'})
        self.assertRaises(ValueError, gen.workflow, self.jobs[0], ['style.png'], self.args, 22)

    def test_more_than_two_characters_use_contact_sheet_instead_of_dropping_faces(self):
        style = self.root / 'style.png'; style.write_bytes(image_bytes())
        refs = {}
        for cid in ['a', 'b', 'c', 'd']:
            refs[cid] = self.root / f'{cid}.png'; refs[cid].write_bytes(image_bytes())
        with patch.object(gen, 'char_ref', side_effect=refs.get):
            images = gen.reference_images({**self.jobs[0], 'refs': list(refs)}, [style])
            self.assertEqual(len(images), 2)
            self.assertEqual(Image.open(io.BytesIO(images[1])).size, (768, 1024))
            self.assertRaises(ValueError, gen.reference_images, {**self.jobs[0], 'refs': ['missing']}, [style])

    def test_source_is_byte_exact_and_final_crop_matches_manifest(self):
        raw = image_bytes(); original, out = gen.save_image(self.jobs[0], raw)
        self.assertEqual(Path(original).read_bytes(), raw)
        with Image.open(out) as image:
            self.assertEqual(image.size, (12, 4))

    def test_timeout_is_recorded_then_resumed_without_a_second_generation(self):
        test = self
        class Fake:
            submits = 0; polls = 0
            def __init__(self, *a): pass
            def check(self, graph): pass
            def upload(self, raw): return 'uploaded.png'
            def submit(self, graph): Fake.submits += 1; return 'task-1'
            def wait(self, prompt_id, outputs, timeout, poll):
                self_record = json.loads((test.root / 'records.json').read_text())[-1]
                test.assertEqual(self_record['prompt_id'], 'task-1')
                Fake.polls += 1
                if Fake.polls == 1: raise TimeoutError('not done')
                return image_bytes()
        with patch.object(gen, 'reference_images', return_value=[b'reference']), contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(gen.run(self.args, Fake), 1)
            self.assertEqual(gen.run(self.args, Fake), 0)
        self.assertEqual(Fake.submits, 1)
        records = json.loads((self.root / 'records.json').read_text())
        self.assertEqual([r['status'] for r in records], ['timeout', 'completed'])
        self.assertEqual(records[0]['seed'], records[1]['seed'])

    def test_failed_job_does_not_stop_next_job_or_log_provider_secrets(self):
        jobs = [self.jobs[0], {**self.jobs[0], 'id': 'scene-two', 'name': 'two'}]
        (self.root / 'jobs.jsonl').write_text('\n'.join(map(json.dumps, jobs)))
        class Fake:
            attempts = 0
            def __init__(self, *a): pass
            def check(self, graph):
                Fake.attempts += 1
                if Fake.attempts == 1: raise RuntimeError('provider-secret-must-not-appear')
            def upload(self, raw): return 'uploaded.png'
            def submit(self, graph): return 'task-2'
            def wait(self, *a): return image_bytes()
        output = io.StringIO()
        with patch.object(gen, 'reference_images', return_value=[b'reference']), contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            self.assertEqual(gen.run(self.args, Fake), 1)
        records = (self.root / 'records.json').read_text()
        self.assertEqual([r['status'] for r in json.loads(records)], ['failed', 'completed'])
        self.assertNotIn('provider-secret', records + output.getvalue())
        self.assertNotIn('Authored prompt', records)

    def test_http_client_is_direct_by_default_and_keeps_workflow_errors_explicit(self):
        class Response:
            status_code = 200
            def json(self): return {'prompt_id': 'task-1', 'node_errors': {}}
        class Session:
            headers = {}
            def request(self, *args, **kwargs): self.last = (args, kwargs); return Response()
        session = Session(); client = gen.Client('http://comfy.test', session=session)
        self.assertFalse(session.trust_env)
        self.assertEqual(client.submit({'node': 'fixture'}), 'task-1')
        self.assertFalse(session.last[1]['allow_redirects'])
        self.assertRaises(ValueError, gen.Client, 'http://user:secret@comfy.test')
        self.assertTrue(gen.Client('http://comfy.test', use_proxy=True, session=session).session.trust_env)


    def test_http_upload_queue_poll_and_download_follow_comfy_protocol(self):
        raw = image_bytes(); job = self.jobs[0]; args = self.args
        class Response:
            status_code = 200
            def __init__(self, data=None, content=None): self.data = data; self.content = content
            def json(self): return self.data
        class Session:
            headers = {}; history_error = False
            def request(self, method, url, **kwargs):
                if url.endswith('/object_info'):
                    graph = gen.workflow(job, ['reference.png'], args, 1)
                    return Response({node['class_type']: {'input': {'required': {}}} for node in graph.values()})
                if url.endswith('/upload/image'):
                    assert kwargs['data']['type'] == 'input'
                    return Response({'name': 'reference.png', 'subfolder': 'uploads'})
                if url.endswith('/prompt'):
                    assert kwargs['json']['prompt']['22']['inputs']['prompt'] == job['prompt']
                    return Response({'prompt_id': 'task-123'})
                if '/history/' in url:
                    return Response({'task-123': {'status': {'status_str': 'error' if self.history_error else 'success', 'completed': True}, 'outputs': {'32': {'images': [{'filename': 'result.png', 'type': 'output', 'subfolder': ''}]}}}})
                if url.endswith('/view'):
                    assert kwargs['params']['filename'] == 'result.png'
                    return Response(content=raw)
                raise AssertionError('Unexpected endpoint')
        session = Session(); client = gen.Client('http://comfy.test', session=session)
        graph = gen.workflow(job, ['reference.png'], args, 1); client.check(graph)
        self.assertEqual(client.upload(b'reference'), 'uploads/reference.png')
        self.assertEqual(client.submit(graph), 'task-123')
        self.assertEqual(client.wait('task-123', ['32'], 1, 0), raw)
        session.history_error = True
        self.assertRaises(RuntimeError, client.wait, 'task-123', ['32'], 1, 0)


if __name__ == '__main__':
    unittest.main()
