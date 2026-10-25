#!/usr/bin/env python3
"""Verificacion de solo lectura. Nunca muestra credenciales ni ejecuta DDL."""
import argparse, json, os, re, subprocess
from pathlib import Path

def run(args):
    return subprocess.run(args, text=True, capture_output=True, check=True).stdout

def verificar(container, port, ci=False):
    d=json.loads(run(['docker','inspect',container]))[0]
    env=dict(x.split('=',1) for x in d['Config']['Env'] if '=' in x)
    if d['Name']=='/florarte-db-1' or (d['Config'].get('Labels') or {}).get('com.docker.compose.project')=='florarte':
        raise ValueError('No se permite un contenedor del proyecto principal FlorArte')
    if not d['State']['Running'] or d['Config']['Image']!='postgres:17':
        raise ValueError('Se requiere el contenedor temporal PostgreSQL 17 en ejecucion')
    if not ci and d['Name']!='/florarte-pg-test':
        raise ValueError('El contenedor local debe ser florarte-pg-test')
    if ci and (os.environ.get('GITHUB_ACTIONS')!='true' or container!=d['Id']):
        raise ValueError('CI requiere el ID completo del servicio GitHub Actions')
    if env.get('POSTGRES_DB')!='florarte_test' or env.get('POSTGRES_USER')!='florarte_test':
        raise ValueError('Base/usuario temporales incorrectos')
    if any(m.get('Name','').startswith('florarte_postgres_data') or m['Type']=='bind' for m in d['Mounts']):
        raise ValueError('Montaje persistente principal o bind no autorizado')
    bindings=d['NetworkSettings']['Ports'].get('5432/tcp') or []
    valid=[p for p in bindings if p['HostPort']==str(port) and (p['HostIp'] in ('127.0.0.1','::1') or ci)]
    if not valid or (not ci and any(p['HostIp'] not in ('127.0.0.1','::1') for p in bindings)):
        raise ValueError('El puerto no corresponde al contenedor temporal verificado')
    ident=run(['docker','exec',d['Id'],'psql','-X','-U','florarte_test','-d','florarte_test','-Atc',
               'SELECT system_identifier::text FROM pg_control_system()']).strip()
    if not re.fullmatch(r'[0-9]{1,20}',ident): raise ValueError('Identificador de cluster invalido')
    # No contiene password. JUnit contrasta esta identidad desde la conexion TCP real.
    return {'FLORARTE_TEST_DB_SYSTEM_IDENTIFIER':ident,'FLORARTE_TEST_DB_CONTAINER_ID':d['Id']}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--container',default='florarte-pg-test');p.add_argument('--port',type=int,default=5544)
    p.add_argument('--github-actions',action='store_true');p.add_argument('--output-env',type=Path,required=True)
    a=p.parse_args()
    try: proof=verificar(a.container,a.port,a.github_actions)
    except (ValueError,KeyError,subprocess.CalledProcessError):
        raise SystemExit('BLOQUEADO: no se pudo acreditar PostgreSQL temporal; no ejecutar pruebas destructivas')
    with a.output_env.open('a') as f:
        for k,v in proof.items():f.write(k+'='+v+'\n')
    print('Contenedor PostgreSQL 17 temporal verificado; sin cambios en bases de datos.')
