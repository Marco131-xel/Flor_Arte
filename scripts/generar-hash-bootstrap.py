#!/usr/bin/env python3
"""Opcional: requiere el modulo bcrypt. No utiliza la DB ni modifica cuentas."""
import argparse, getpass, os, warnings
from pathlib import Path
warnings.simplefilter('error',getpass.GetPassWarning)
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args()
repo=Path(__file__).resolve().parents[1]
if not a.output.is_absolute() or a.output.is_symlink() or a.output.resolve().is_relative_to(repo):
    raise SystemExit('El hash debe guardarse en un archivo nuevo absoluto fuera del repositorio')
if not a.output.parent.is_dir() or a.output.parent.stat().st_mode & 0o077:
    raise SystemExit('Prepara un directorio privado con modo 0700 fuera del repositorio')
try:import bcrypt
except ImportError:raise SystemExit('Instala bcrypt en un entorno Python separado antes de continuar')
clave=getpass.getpass('Nueva clave del primer administrador: ')
if clave!=getpass.getpass('Confirmacion: '):raise SystemExit('Las claves no coinciden')
if len(clave)<12 or len(clave.encode('utf-8'))>72:raise SystemExit('Usa minimo 12 caracteres y maximo 72 bytes UTF-8')
hash=bcrypt.hashpw(clave.encode('utf-8'),bcrypt.gensalt(rounds=12))
fd=os.open(a.output,os.O_CREAT|os.O_EXCL|os.O_WRONLY|os.O_NOFOLLOW,0o400)
try:
    os.write(fd,hash+b'\n')
    # Docker Compose monta este archivo como secret; el proceso backend es UID 10001.
    # Directorio padre 0700 protege la lectura en el host.
    os.fchmod(fd,0o444)
finally:os.close(fd)
print('Hash generado fuera del repositorio. No se muestra ni se ha conectado a PostgreSQL.')
