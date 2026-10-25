#!/usr/bin/env python3
"""Bloquea CI si faltan integraciones, pruebas o reportes, o hay fallos/omisiones."""
import argparse
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

REQUIRED = (
    'GestionTest', 'EventoTest', 'ArregloTest', 'ReporteTest',
    'SeguridadCorreoIntegrationTest', 'FlorArteBackendApplicationTests',
    'InicializacionProduccionTest', 'ProduccionArranqueIntegrationTest',
)
COUNTERS = ('tests', 'failures', 'errors', 'skipped')


def comprobar(root, minimum=159):
    reports_dir = root / 'target/surefire-reports'
    reports = {}
    errors = []
    totals = dict.fromkeys(COUNTERS, 0)
    for path in sorted(reports_dir.glob('TEST-*.xml')):
        try:
            suite = ET.parse(path).getroot()
            if suite.tag != 'testsuite':
                raise ValueError('Formato incorrecto')
            counts = {key: int(suite.attrib[key]) for key in COUNTERS}
            if any(value < 0 for value in counts.values()) or sum(counts[key] for key in COUNTERS[1:]) > counts['tests']:
                raise ValueError('Contadores incorrectos')
        except (ET.ParseError, OSError, KeyError, ValueError):
            errors.append('Reporte XML ausente, ilegible o invalido: ' + path.name)
            continue
        reports[path.name] = counts
        for key in COUNTERS:
            totals[key] += counts[key]
    if not reports:
        errors.append('No hay reportes Surefire validos.')
    for name in REQUIRED:
        sources = list((root / 'src/test/java').rglob(name + '.java'))
        matching = [value for file, value in reports.items() if file.endswith('.' + name + '.xml')]
        if len(sources) != 1 or len(matching) != 1:
            errors.append(name + ': falta fuente/reporte unico')
            continue
        expected = len(re.findall(r'@Test\b', sources[0].read_text()))
        if matching[0]['tests'] < expected:
            errors.append(name + ': integracion incompleta')
    if totals['tests'] < minimum:
        errors.append('Suite incompleta: se requieren al menos ' + str(minimum) + ' pruebas.')
    if any(totals[key] for key in COUNTERS[1:]):
        errors.append('La suite contiene fallos, errores o pruebas omitidas.')
    totals['passed'] = totals['tests'] - sum(totals[key] for key in COUNTERS[1:])
    # Solo numeros y un booleano: no exportar propiedades, excepciones ni salida de tests.
    summary = {**totals, 'suites': len(reports), 'valid': not errors}
    return summary, errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--min-tests', type=int, default=159)
    parser.add_argument('--summary', type=Path)
    args = parser.parse_args()
    if args.min_tests < 1:
        parser.error('--min-tests debe ser positivo')
    root = Path(__file__).resolve().parents[1] / 'Flor_Arte_Backend'
    summary, errors = comprobar(root, args.min_tests)
    if args.summary:
        args.summary.parent.mkdir(parents=True, exist_ok=True)
        args.summary.write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary))
    for error in errors:
        print(error, file=sys.stderr)
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
