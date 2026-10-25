package com.florarte.backend.services;

import java.nio.file.*;
import java.io.IOException;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PrimerAdministradorService {
  private final JdbcTemplate jdbc;
  public PrimerAdministradorService(JdbcTemplate jdbc) {this.jdbc=jdbc;}
  @Transactional(rollbackFor=Exception.class)
  public void crear(String email,String nombre,Path archivoHash) throws IOException {
    if(email==null||email.length()>150||!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")
        ||nombre==null||nombre.isBlank()||nombre.length()>100||archivoHash==null||!archivoHash.isAbsolute())
      throw new IllegalArgumentException("Bootstrap requiere correo, nombre y archivo absoluto del hash");
    if(Files.size(archivoHash)>128)throw new IllegalArgumentException("Archivo de hash invalido");
    String hash=Files.readString(archivoHash).strip();
    if(!hash.matches("\\$2[aby]\\$(1[2-6])\\$[./A-Za-z0-9]{53}"))
      throw new IllegalArgumentException("Bootstrap requiere un hash BCrypt con costo entre 12 y 16");
    jdbc.execute("LOCK TABLE public.usuario,public.persona IN EXCLUSIVE MODE");
    Long usuarios=jdbc.queryForObject("SELECT count(*) FROM usuario",Long.class);
    Long personas=jdbc.queryForObject("SELECT count(*) FROM persona",Long.class);
    if(usuarios==null||usuarios!=0||personas==null||personas!=0)
      throw new IllegalStateException("Bootstrap solo permitido en instalacion nueva sin personas ni usuarios; no se modifica ninguna cuenta");
    Long rol=jdbc.queryForObject("SELECT id_rol FROM rol WHERE tipo='ADMINISTRADOR'",Long.class);
    Long persona=jdbc.queryForObject("INSERT INTO persona(nombre,id_rol) VALUES (?,?) RETURNING id_persona",Long.class,nombre.strip(),rol);
    jdbc.update("INSERT INTO usuario(name,email,password,id_persona) VALUES (?,?,?,?)","administrador",email,hash,persona);
  }
}
