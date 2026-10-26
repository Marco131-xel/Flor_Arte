package com.florarte.backend.services;

import java.sql.Timestamp;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.Map;

public record PeriodoReporte(LocalDate desde,LocalDate hasta) {
    public static PeriodoReporte de(String periodo,String fecha) {
        try {
            LocalDate referencia=LocalDate.parse(fecha);
            if(referencia.getYear()<1900||referencia.getYear()>9998)throw new IllegalArgumentException("Selecciona un año entre 1900 y 9998");
            LocalDate inicio=switch(periodo) {
                case "DIA" -> referencia;
                case "SEMANA" -> referencia.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                case "MES" -> referencia.withDayOfMonth(1);
                case "ANIO" -> referencia.withDayOfYear(1);
                default -> throw new IllegalArgumentException("Período inválido: día, semana, mes o año");
            };
            LocalDate fin=switch(periodo){case "DIA"->inicio.plusDays(1);case "SEMANA"->inicio.plusWeeks(1);case "MES"->inicio.plusMonths(1);default->inicio.plusYears(1);};
            return new PeriodoReporte(inicio,fin);
        }catch(DateTimeException ex){throw new IllegalArgumentException("La fecha del reporte no es válida");}
    }
    public Map<String,Object> parametros(){return Map.of("desde",Timestamp.valueOf(desde.atStartOfDay()),"hasta",Timestamp.valueOf(hasta.atStartOfDay()));}
    public Map<String,String> descripcion(){return Map.of("desde",desde.toString(),"hasta",hasta.minusDays(1).toString());}
}
