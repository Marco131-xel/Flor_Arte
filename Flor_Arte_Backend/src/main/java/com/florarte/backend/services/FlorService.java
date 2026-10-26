package com.florarte.backend.services;

import com.florarte.backend.dtos.FlorDTO;
import com.florarte.backend.entities.Color;
import com.florarte.backend.entities.Flor;
import com.florarte.backend.entities.TipoFlor;
import com.florarte.backend.repositories.ColorRepository;
import com.florarte.backend.repositories.FlorRepository;
import com.florarte.backend.repositories.TipoFlorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FlorService {

    private final FlorRepository florRepository;
    private final TipoFlorRepository tipoFlorRepository;
    private final ColorRepository colorRepository;

    @Autowired
    public FlorService(FlorRepository florRepository,
                       TipoFlorRepository tipoFlorRepository,
                       ColorRepository colorRepository) {
        this.florRepository = florRepository;
        this.tipoFlorRepository = tipoFlorRepository;
        this.colorRepository = colorRepository;
    }

    // Crear una flor
    public FlorDTO save(FlorDTO dto) {
        TipoFlor tipoFlor = tipoFlorRepository.findById(dto.getIdTipoFlor())
                .orElseThrow(() -> new RuntimeException("Tipo de flor no encontrado con id: " + dto.getIdTipoFlor()));

        Color color = colorRepository.findById(dto.getIdColor())
                .orElseThrow(() -> new RuntimeException("Color no encontrado con id: " + dto.getIdColor()));

        if (florRepository.existsByIdTipoFlorAndIdColor(dto.getIdTipoFlor(), dto.getIdColor())) {
            throw new IllegalArgumentException("Ya existe una flor registrada con el tipo de flor y color especificados");
        }

        if (dto.getPrecio() != null && dto.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo");
        }

        if (dto.getStock() != null && dto.getStock() < 0) {
            throw new IllegalArgumentException("El stock no puede ser negativo");
        }

        Flor flor = new Flor();
        flor.setIdTipoFlor(dto.getIdTipoFlor());
        flor.setIdColor(dto.getIdColor());
        flor.setPrecio(dto.getPrecio());
        flor.setStock(dto.getStock() != null ? dto.getStock() : 0);
        flor.setEstado(dto.getEstado() != null ? dto.getEstado() : true);

        Flor guardada = florRepository.save(flor);
        return toDto(guardada, tipoFlor.getNombre(), color.getNombre());
    }

    // Listar todas las flores con sus relaciones
    public List<FlorDTO> findAll() {
        return florRepository.findAllWithDetails()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Buscar flor por id con relaciones
    public Optional<FlorDTO> findById(Integer id) {
        return florRepository.findByIdWithDetails(id).map(this::toDto);
    }

    // Actualizar una flor
    public FlorDTO update(Integer id, FlorDTO dto) {
        Flor flor = florRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Flor no encontrada con id: " + id));

        TipoFlor tipoFlor = tipoFlorRepository.findById(dto.getIdTipoFlor())
                .orElseThrow(() -> new RuntimeException("Tipo de flor no encontrado con id: " + dto.getIdTipoFlor()));

        Color color = colorRepository.findById(dto.getIdColor())
                .orElseThrow(() -> new RuntimeException("Color no encontrado con id: " + dto.getIdColor()));

        if (florRepository.existsByIdTipoFlorAndIdColorAndIdFlorNot(dto.getIdTipoFlor(), dto.getIdColor(), id)) {
            throw new IllegalArgumentException("Ya existe otra flor con el tipo de flor y color especificados");
        }

        if (dto.getPrecio() != null && dto.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo");
        }

        if (dto.getStock() != null && dto.getStock() < 0) {
            throw new IllegalArgumentException("El stock no puede ser negativo");
        }

        flor.setIdTipoFlor(dto.getIdTipoFlor());
        flor.setIdColor(dto.getIdColor());
        flor.setPrecio(dto.getPrecio());
        flor.setStock(dto.getStock());
        if (dto.getEstado() != null) {
            flor.setEstado(dto.getEstado());
        }

        Flor actualizada = florRepository.save(flor);
        return toDto(actualizada, tipoFlor.getNombre(), color.getNombre());
    }

    // Eliminar una flor por id
    public void deleteById(Integer id) {
        if (!florRepository.existsById(id)) {
            throw new RuntimeException("Flor no encontrada con id: " + id);
        }
        florRepository.deleteById(id);
    }

    private FlorDTO toDto(Flor flor) {
        String nombreTipoFlor = flor.getTipoFlor() != null ? flor.getTipoFlor().getNombre() : null;
        String nombreColor = flor.getColor() != null ? flor.getColor().getNombre() : null;
        return toDto(flor, nombreTipoFlor, nombreColor);
    }

    private FlorDTO toDto(Flor flor, String nombreTipoFlor, String nombreColor) {
        return new FlorDTO(
                flor.getIdFlor(),
                flor.getIdTipoFlor(),
                nombreTipoFlor,
                flor.getIdColor(),
                nombreColor,
                flor.getPrecio(),
                flor.getStock(),
                flor.getEstado()
        );
    }
}
