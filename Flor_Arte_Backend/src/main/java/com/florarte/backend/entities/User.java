package com.florarte.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuario")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "token", length = 500)
    private String token;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "id_persona", nullable = false, unique = true)
    private Long idPersona;

    // Relación con Persona (uno a uno)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_persona", insertable = false, updatable = false)
    private Persona persona;
}