import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile
from PIL import Image

TOOLS = Path(__file__).resolve().parents[2] / 'game/sanguo/tools'
sys.path.insert(0, str(TOOLS))
spec = importlib.util.spec_from_file_location('gen_batch0', TOOLS / 'gen_batch0.py')
batch = importlib.util.module_from_spec(spec); spec.loader.exec_module(batch)
sys.path.pop(0)


class Batch0Test(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.root = Path(self.temp.name)
        self.review = self.root / 'ooc-replica/dist/assets/art-batch0'
        self.jobs = self.root / 'game/sanguo/art/edition-jobs-v23.jsonl'; self.jobs.parent.mkdir(parents=True)
        rows = [dict(id=key, kind='scene', name=key.removeprefix('scene-'), refs=[], prompt='Exact authored prompt ' + key, negative_prompt='Exact negative', size='1536x1024', out=[1200, 480]) for key in batch.BATCH0]
        rows.append({**rows[0], 'id': 'scene-next-batch', 'name': 'next'})
        self.jobs.write_text('\n'.join(map(json.dumps, rows)))
        self.records = self.root / 'private/records.json'
        self.patch = patch.multiple(batch, REPO=self.root, REVIEW=self.review, RECORDS=self.records, JOBS=self.jobs)
        self.patch.start()
        self.core_patch = patch.multiple(batch.comfy, R=self.root / 'game/sanguo', ART=self.root / 'game/sanguo/art')
        self.core_patch.start()
        self.env = patch.dict(os.environ, {}, clear=True); self.env.start()
        self.before = self.jobs.read_bytes()

    def tearDown(self):
        self.assertEqual(self.jobs.read_bytes(), self.before)
        self.env.stop(); self.core_patch.stop(); self.patch.stop(); self.temp.cleanup()

    def completed(self, key):
        root = self.review / 'candidates'
        original = root / 'source' / f'{key}.comfy.png'; crop = root / 'scenes' / f'{key}.webp'
        original.parent.mkdir(parents=True, exist_ok=True); crop.parent.mkdir(parents=True, exist_ok=True)
        Image.new('RGB', (96, 64)).save(original); Image.new('RGB', (1200, 480)).save(crop)
        return dict(id=key, status='completed', original=str(original), output=str(crop), seed=10, prompt_id='task-fixture', models={'unet': 'fixture-model', 'private_url': 'must-not-publish'})

    def test_only_three_ids_are_exposed_and_scope_expansion_flags_are_rejected(self):
        args = batch.parser().parse_args(['--dry-run'])
        core = batch.core_args(args)
        self.assertEqual(tuple(core.ids.split(',')), batch.BATCH0)
        self.assertFalse(core.force)
        self.assertTrue(Path(core.output_root).is_relative_to(self.review))
        self.assertFalse(Path(core.records).is_relative_to(self.review))
        for flag in ['--ids', '--jobs', '--force', '--batch']:
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit): batch.parser().parse_args([flag])

    def test_prepare_never_claims_reference_images_are_new_outputs(self):
        with contextlib.redirect_stdout(io.StringIO()): self.assertEqual(batch.run(batch.parser().parse_args(['--prepare'])), 0)
        manifest = json.loads((self.review / 'manifest.json').read_text())
        self.assertEqual(manifest['generated_scenes'], 0); self.assertEqual(manifest['expected_scenes'], 3)
        self.assertFalse(manifest['next_batch_enabled']); self.assertFalse(manifest['review_passed'])
        self.assertEqual(len(manifest['items']), 3)
        self.assertIn('0/3', (self.review / 'index.html').read_text())
        self.assertFalse((self.review / 'storydate-batch0-review.zip').exists())
        self.assertEqual([item['authored_job_snapshot']['prompt'] for item in manifest['items']], ['Exact authored prompt ' + key for key in batch.BATCH0])

    def test_missing_company_url_never_calls_a_generator_or_a_fallback(self):
        def forbidden(_args): self.fail('No GPU submission or fallback may run')
        with contextlib.redirect_stderr(io.StringIO()): self.assertEqual(batch.run(batch.parser().parse_args([]), execute=forbidden), 2)
        self.assertEqual(json.loads((self.review / 'manifest.json').read_text())['generated_scenes'], 0)

    def test_partial_batch_stops_and_packages_original_crop_without_private_records(self):
        self.records.parent.mkdir(parents=True)
        calls = []
        def execute(args):
            calls.append(args)
            self.records.write_text(json.dumps([self.completed(batch.BATCH0[0])]))
            return 0
        with patch.dict(os.environ, {'COMFYUI_API_URL': 'http://company.test'}):
            self.assertEqual(batch.run(batch.parser().parse_args([]), execute=execute), 1)
        self.assertEqual(len(calls), 1)
        self.assertEqual(tuple(calls[0].ids.split(',')), batch.BATCH0)
        manifest = json.loads((self.review / 'manifest.json').read_text())
        self.assertEqual(manifest['generated_scenes'], 1); self.assertFalse(manifest['next_batch_enabled'])
        self.assertNotIn('must-not-publish', json.dumps(manifest))
        with zipfile.ZipFile(self.review / 'storydate-batch0-review.zip') as archive:
            self.assertIsNone(archive.testzip())
            self.assertTrue(any(name.endswith('.comfy.png') for name in archive.namelist()))
            self.assertTrue(any('/scenes/' in name for name in archive.namelist()))
            self.assertNotIn('records.json', archive.namelist())

    def test_three_complete_candidates_still_do_not_mark_review_passed(self):
        self.records.parent.mkdir(parents=True)
        self.records.write_text(json.dumps([self.completed(key) for key in batch.BATCH0]))
        with patch.dict(os.environ, {'COMFYUI_API_URL': 'http://company.test'}):
            self.assertEqual(batch.run(batch.parser().parse_args([]), execute=lambda args: 0), 0)
        manifest = json.loads((self.review / 'manifest.json').read_text())
        self.assertEqual(manifest['generated_scenes'], 3)
        self.assertFalse(manifest['review_passed']); self.assertFalse(manifest['next_batch_enabled'])
        self.assertFalse((self.root / 'game/sanguo/art/scenes').exists())

    def test_record_paths_outside_candidate_directory_cannot_be_published(self):
        self.records.parent.mkdir(parents=True)
        row = self.completed(batch.BATCH0[0]); row['original'] = str(self.jobs)
        self.records.write_text(json.dumps([row]))
        manifest = batch.build_review()
        self.assertEqual(manifest['generated_scenes'], 0)
        self.assertNotIn('original', manifest['items'][0])


if __name__ == '__main__':
    unittest.main()
