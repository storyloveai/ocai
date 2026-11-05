"""Regression cases for conditional choices and conditional stage commands."""
import json
import pathlib
import subprocess
import tempfile
import unittest

EXPORTER = pathlib.Path(__file__).with_name('webgal_export.py')


class ExportTests(unittest.TestCase):
    def test_conditionals_survive_export(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / 'content').mkdir()
            (root / 'art/cg').mkdir(parents=True)
            (root / 'art/cg/moment.webp').write_bytes(b'fixture')
            check = {'v': 'flag.ready', 'op': '==', 'val': True}
            campaign = {
                'title': {'zh': '测试'}, 'chars': {}, 'player': {'name': {'zh': '主角'}},
                'vars': {'flag.ready': {'type': 'flag', 'init': True}, 'score': {'type': 'num', 'init': 1}},
                'art': {'cg': {'moment': {'zh': '瞬间'}}},
                'chapters': [{'id': 'p', 'title': {'zh': '序章'}}],
                'nodes': {'n': {'id': 'n', 'title': {'zh': '测试'}, 'chapter': 'p', 'kind': 'main', 'order': 0,
                    'script': [{'op': 'cg', 'id': 'moment', 'when': check}],
                    'choices': [{'id': 'go', 'label': {'zh': '继续'}, 'when': check,
                        'req': {'v': 'score', 'op': '>=', 'val': 1}, 'effects': [], 'script': []}]}}
            }
            (root / 'content/campaign.json').write_text(json.dumps(campaign))
            out = root / 'out'
            subprocess.run(['python3', str(EXPORTER), '--source-root', str(root), '--out', str(out), '--chapters', 'p'], check=True, capture_output=True)
            scene = (out / 'scene/p.txt').read_text()
            # Upstream ChooseOption.parse accepts one arrow after both predicates.
            self.assertIn('choose:(flag_ready==true)[score>=1]->继续:n__go;', scene)
            self.assertIn('setVar:flag_ready=true;', scene)
            self.assertIn('label:n__go;', scene)
            clears = [line for line in scene.splitlines() if line.startswith('changeFigure:none')]
            self.assertEqual(len(clears), 3)
            self.assertTrue(all('-when=flag_ready==true;' in line for line in clears))
            self.assertIn('unlockCg:cg_moment.webp -name=瞬间 -when=flag_ready==true;', scene)
            self.assertEqual((out / 'animation/animationTable.json').read_text().strip(), '[]')
            invalid = subprocess.run(['python3', str(EXPORTER), '--source-root', str(root), '--out', str(out), '--chapters', 'missing'], capture_output=True)
            self.assertNotEqual(invalid.returncode, 0)
            self.assertTrue((out / 'scene/p.txt').is_file(), 'invalid input must not destroy an existing export')


if __name__ == '__main__':
    unittest.main()
