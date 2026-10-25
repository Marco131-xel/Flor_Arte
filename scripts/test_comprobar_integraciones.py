"""Regresiones del control de CI; usa reportes sinteticos fuera del repositorio."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location('checker', Path(__file__).with_name('comprobar-integraciones.py'))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class ReportesTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='florarte-reportes-')
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.root = self.base / 'Flor_Arte_Backend'
        self.sources = self.root / 'src/test/java'
        self.sources.mkdir(parents=True)
        self.reports = self.root / 'target/surefire-reports'
        self.reports.mkdir(parents=True)
        for index, name in enumerate(checker.REQUIRED):
            (self.sources / (name + '.java')).write_text('@Test void caso() {}')
            self.report(name, tests=152 if index == 0 else 1)

    def report(self, name, **values):
        counts = dict(tests=1, failures=0, errors=0, skipped=0)
        counts.update(values)
        suite = ET.Element('testsuite', {key: str(value) for key, value in counts.items()})
        path = self.reports / ('TEST-com.florarte.' + name + '.xml')
        ET.ElementTree(suite).write(path)
        return path

    def test_acepta_suite_completa(self):
        summary, errors = checker.comprobar(self.root)
        self.assertFalse(errors)
        self.assertTrue(summary['valid'])
        self.assertEqual(summary['passed'], 159)

    def test_acepta_pruebas_nuevas_por_encima_del_minimo(self):
        self.report('OtraPruebaTest')
        summary, errors = checker.comprobar(self.root)
        self.assertFalse(errors)
        self.assertEqual(summary['tests'], 160)

    def test_rechaza_fallos_errores_y_omisiones_incluso_fuera_de_integraciones(self):
        for key in ('failures', 'errors', 'skipped'):
            with self.subTest(counter=key):
                self.report('OtraPruebaTest', **{key: 1})
                summary, errors = checker.comprobar(self.root)
                self.assertTrue(errors)
                self.assertFalse(summary['valid'])
                self.assertEqual(summary[key], 1)

    def test_rechaza_suite_con_menos_de_159(self):
        self.report(checker.REQUIRED[0], tests=151)
        summary, errors = checker.comprobar(self.root)
        self.assertTrue(errors)
        self.assertEqual(summary['tests'], 158)

    def test_rechaza_integracion_ausente_aunque_total_sea_suficiente(self):
        self.report('OtraPruebaTest', tests=200)
        (self.reports / ('TEST-com.florarte.' + checker.REQUIRED[0] + '.xml')).unlink()
        self.assertTrue(checker.comprobar(self.root)[1])

    def test_rechaza_fuente_de_integracion_ausente(self):
        (self.sources / (checker.REQUIRED[0] + '.java')).unlink()
        self.assertTrue(checker.comprobar(self.root)[1])

    def test_rechaza_integracion_parcial_aunque_total_sea_suficiente(self):
        (self.sources / (checker.REQUIRED[1] + '.java')).write_text('@Test void uno() {} @Test void dos() {}')
        self.assertTrue(checker.comprobar(self.root)[1])

    def test_rechaza_reportes_ausentes(self):
        self.assertTrue(checker.comprobar(self.base / 'sin-reportes')[1])

    def test_rechaza_xml_corrupto(self):
        path = self.report('OtraPruebaTest')
        path.write_text('<testsuite')
        self.assertTrue(checker.comprobar(self.root)[1])

    def test_rechaza_contadores_imposibles_o_ausentes(self):
        for values in ({'tests': -1}, {'failures': 2}, {'errors': 'invalido'}):
            with self.subTest(values=values):
                self.report('OtraPruebaTest', **values)
                self.assertTrue(checker.comprobar(self.root)[1])
        path = self.report('OtraPruebaTest')
        path.write_text('<testsuite tests="1"/>')
        self.assertTrue(checker.comprobar(self.root)[1])

    def test_cli_falla_y_publica_solo_contadores(self):
        scripts = self.base / 'scripts'
        scripts.mkdir()
        script = scripts / 'comprobar-integraciones.py'
        shutil.copyfile(checker.__file__, script)
        path = self.report('OtraPruebaTest', failures=1)
        suite = ET.parse(path).getroot()
        marker = 'MARCADOR_PRIVADO_DE_ENSAYO'
        ET.SubElement(suite, 'system-out').text = marker
        ET.SubElement(suite, 'properties', password=marker)
        ET.SubElement(suite, 'failure', message=marker)
        ET.ElementTree(suite).write(path)
        summary_path = self.base / 'ci-reports/resumen.json'
        result = subprocess.run([sys.executable, str(script), '--summary', str(summary_path)],
                                text=True, capture_output=True)
        self.assertEqual(result.returncode, 1)
        self.assertNotIn(marker, result.stdout + result.stderr + summary_path.read_text())
        summary = json.loads(summary_path.read_text())
        self.assertFalse(summary['valid'])
        self.assertEqual(summary['failures'], 1)
        self.assertTrue(all(isinstance(value, (int, bool)) for value in summary.values()))


if __name__ == '__main__':
    unittest.main()
