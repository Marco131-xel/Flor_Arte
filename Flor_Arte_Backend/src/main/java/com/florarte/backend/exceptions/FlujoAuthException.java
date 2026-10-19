package com.florarte.backend.exceptions;

public class FlujoAuthException extends RuntimeException {
  public final int status;
  public final String codigo;

  public FlujoAuthException(int status, String codigo, String mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}
