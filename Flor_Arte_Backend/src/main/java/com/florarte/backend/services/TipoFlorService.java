package com.florarte.backend.services;

import com.florarte.backend.dtos.TipoFlorDTO;
import com.florarte.backend.entities.TipoFlor;
import com.florarte.backend.repositories.FlorRepository;
import com.florarte.backend.repositories.TipoFlorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TipoFlorService {

    private final TipoFlorRepository tipoFlorRepository;
    private final FlorRepository florRepository;

    @Autowired
    public TipoFlorService(TipoFlorRepository tipoFlorRepository, FlorRepository florRepository) {
        this.tipoFlorRepository = tipoFlorRepository;
        this.florRepository = florRepository;
    }

    // Crear tipo de flor
    public TipoFlorDTO save(TipoFlorDTO dto) {
        if (dto.getNombre() != null && tipoFlorRepository.existsByNombreIgnoreCase(dto.getNombre().trim())) {
            throw new IllegalArgumentException("Ya existe un tipo de flor con el nombre: " + dto.getNombre());
        }

        TipoFlor tipoFlor = new TipoFlor();
        tipoFlor.setNombre(dto.getNombre().trim());
        tipoFlor.setDescripcion(dto.getDescripcion());

        TipoFlor nuevo = tipoFlorRepository.save(tipoFlor);
        return toDto(nuevo);
    }

    // Listar todos los tipos de flor
    public List<TipoFlorDTO> findAll() {
        return tipoFlorRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Buscar tipo de flor por id
    public Optional<TipoFlorDTO> findById(Integer id) {
        return tipoFlorRepository.findById(id).map(this::toDto);
    }

    // Actualizar tipo de flor
    public TipoFlorDTO update(Integer id, TipoFlorDTO dto) {
        TipoFlor tipoFlor = tipoFlorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de flor no encontrado con id: " + id));

        String nuevoNombre = dto.getNombre().trim();
        if (!tipoFlor.getNombre().equalsIgnoreCase(nuevoNombre) && tipoFlorRepository.existsByNombreIgnoreCase(nuevoNombre)) {
            throw new IllegalArgumentException("Ya existe un tipo de flor con el nombre: " + nuevoNombre);
        }

        tipoFlor.setNombre(nuevoNombre);
        tipoFlor.setDescripcion(dto.getDescripcion());

        TipoFlor actualizado = tipoFlorRepository.save(tipoFlor);
        return toDto(actualizado);
    }

    // Eliminar tipo de flor por id
    public void deleteById(Integer id) {
        if (!tipoFlorRepository.existsById(id)) {
            throw new RuntimeException("Tipo de flor no encontrado con id: " + id);
        }

        if (florRepository.existsByIdTipoFlor(id)) {
            throw new IllegalArgumentException("No se puede eliminar el tipo de flor porque está asociado a una o más flores");
        }

        tipoFlorRepository.deleteById(id);
    }

    private TipoFlorDTO toDto(TipoFlor tipoFlor) {
        return new TipoFlorDTO(
                tipoFlor.getIdTipoFlor(),
                tipoFlor.getNombre(),
                tipoFlor.getDescripcion()
        );
    }
}
