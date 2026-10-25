import importlib.util, json, unittest
from unittest.mock import patch
from pathlib import Path
s=importlib.util.spec_from_file_location('v',Path(__file__).with_name('verificar-postgres-temporal.py'))
v=importlib.util.module_from_spec(s);s.loader.exec_module(v)

class VerificadorTest(unittest.TestCase):
    def datos(self):
        return {'Id':'a'*64,'Name':'/florarte-pg-test','State':{'Running':True},
          'Config':{'Image':'postgres:17','Labels':{},'Env':['POSTGRES_DB=florarte_test','POSTGRES_USER=florarte_test']},
          'Mounts':[{'Type':'volume','Name':'volumen-test'}],
          'NetworkSettings':{'Ports':{'5432/tcp':[{'HostIp':'127.0.0.1','HostPort':'5544'}]}}}
    def ejecutar(self,d,container='florarte-pg-test',ci=False,ident='123456789\n'):
        with patch.object(v,'run',side_effect=[json.dumps([d]),ident]):return v.verificar(container,5544,ci)
    def test_acepta_temporal_y_solo_exporta_identidad(self):
        self.assertEqual(set(self.ejecutar(self.datos())),{'FLORARTE_TEST_DB_SYSTEM_IDENTIFIER','FLORARTE_TEST_DB_CONTAINER_ID'})
    def test_bloquea_proyecto_principal(self):
        d=self.datos();d['Config']['Labels']={'com.docker.compose.project':'florarte'}
        with self.assertRaises(ValueError):self.ejecutar(d)
    def test_bloquea_volumen_principal(self):
        d=self.datos();d['Mounts'][0]['Name']='florarte_postgres_data'
        with self.assertRaises(ValueError):self.ejecutar(d)
    def test_bloquea_base_o_usuario_equivocados(self):
        for value in ['POSTGRES_DB=otra','POSTGRES_USER=otro']:
            d=self.datos();d['Config']['Env'].append(value)
            with self.assertRaises(ValueError):self.ejecutar(d)
    def test_bloquea_puerto_publico_o_incorrecto(self):
        for key,value in [('HostIp','0.0.0.0'),('HostPort','5432')]:
            d=self.datos();d['NetworkSettings']['Ports']['5432/tcp'][0][key]=value
            with self.assertRaises(ValueError):self.ejecutar(d)
    def test_bloquea_bind_mount(self):
        d=self.datos();d['Mounts'][0]['Type']='bind'
        with self.assertRaises(ValueError):self.ejecutar(d)

    def test_ci_acepta_servicio_por_id_completo_con_tmpfs(self):
        d=self.datos();d['Name']='/servicio-github-aleatorio';d['Mounts']=[]
        d['HostConfig']={'Tmpfs':{'/var/lib/postgresql/data':'rw,noexec,nosuid,size=512m'}}
        with patch.dict(v.os.environ,{'GITHUB_ACTIONS':'true'}):
            proof=self.ejecutar(d,d['Id'],True)
        self.assertEqual(proof,{'FLORARTE_TEST_DB_SYSTEM_IDENTIFIER':'123456789',
                                'FLORARTE_TEST_DB_CONTAINER_ID':d['Id']})

    def test_ci_requiere_entorno_github_actions(self):
        for value in ['', 'false', 'True']:
            with self.subTest(value=value),patch.dict(v.os.environ,{'GITHUB_ACTIONS':value}):
                d=self.datos()
                with self.assertRaises(ValueError):self.ejecutar(d,d['Id'],True)

    def test_ci_rechaza_nombre_id_corto_o_id_de_otro_servicio(self):
        with patch.dict(v.os.environ,{'GITHUB_ACTIONS':'true'}):
            for container in ['florarte-pg-test','a'*12,'b'*64]:
                with self.subTest(container=container),self.assertRaises(ValueError):
                    self.ejecutar(self.datos(),container,True)

    def test_ci_conserva_bloqueos_de_base_principal_montajes_y_puerto(self):
        for kind in ['principal','base','usuario','volumen','bind','puerto']:
            d=self.datos()
            if kind=='principal':d['Config']['Labels']={'com.docker.compose.project':'florarte'}
            if kind=='base':d['Config']['Env'].append('POSTGRES_DB=florarte')
            if kind=='usuario':d['Config']['Env'].append('POSTGRES_USER=florarte_app')
            if kind=='volumen':d['Mounts'][0]['Name']='florarte_postgres_data'
            if kind=='bind':d['Mounts'][0]['Type']='bind'
            if kind=='puerto':d['NetworkSettings']['Ports']['5432/tcp'][0]['HostPort']='5432'
            with self.subTest(kind=kind),patch.dict(v.os.environ,{'GITHUB_ACTIONS':'true'}):
                with self.assertRaises(ValueError):self.ejecutar(d,d['Id'],True)

    def test_ci_rechaza_servicio_detenido_imagen_o_identidad_incorrectos(self):
        for kind in ['detenido','imagen','identidad']:
            d=self.datos()
            if kind=='detenido':d['State']['Running']=False
            if kind=='imagen':d['Config']['Image']='postgres:16'
            ident='incorrecto' if kind=='identidad' else '123456789'
            with self.subTest(kind=kind),patch.dict(v.os.environ,{'GITHUB_ACTIONS':'true'}):
                with self.assertRaises(ValueError):self.ejecutar(d,d['Id'],True,ident)
if __name__=='__main__':unittest.main()
