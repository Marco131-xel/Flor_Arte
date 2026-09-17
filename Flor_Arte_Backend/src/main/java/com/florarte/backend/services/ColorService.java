package com.florarte.backend.services;

import com.florarte.backend.dtos.ColorDTO;
import com.florarte.backend.entities.Color;
import com.florarte.backend.repositories.ColorRepository;
import com.florarte.backend.repositories.FlorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ColorService {

    private final ColorRepository colorRepository;
    private final FlorRepository florRepository;

    @Autowired
    public ColorService(ColorRepository colorRepository, FlorRepository florRepository) {
        this.colorRepository = colorRepository;
        this.florRepository = florRepository;
    }

    // Crear un color
    public ColorDTO save(ColorDTO dto) {
        if (dto.getNombre() != null && colorRepository.existsByNombreIgnoreCase(dto.getNombre().trim())) {
            throw new IllegalArgumentException("Ya existe un color con el nombre: " + dto.getNombre());
        }

        Color color = new Color();
        color.setNombre(dto.getNombre().trim());

        Color nuevo = colorRepository.save(color);
        return toDto(nuevo);
    }

    // Listar todos los colores
    public List<ColorDTO> findAll() {
        return colorRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Buscar color por id
    public Optional<ColorDTO> findById(Integer id) {
        return colorRepository.findById(id).map(this::toDto);
    }

    // Actualizar un color
    public ColorDTO update(Integer id, ColorDTO dto) {
        Color color = colorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Color no encontrado con id: " + id));

        String nuevoNombre = dto.getNombre().trim();
        if (!color.getNombre().equalsIgnoreCase(nuevoNombre) && colorRepository.existsByNombreIgnoreCase(nuevoNombre)) {
            throw new IllegalArgumentException("Ya existe un color con el nombre: " + nuevoNombre);
        }

        color.setNombre(nuevoNombre);
        Color actualizado = colorRepository.save(color);
        return toDto(actualizado);
    }

    // Eliminar un color por id
    public void deleteById(Integer id) {
        if (!colorRepository.existsById(id)) {
            throw new RuntimeException("Color no encontrado con id: " + id);
        }

        if (florRepository.existsByIdColor(id)) {
            throw new IllegalArgumentException("No se puede eliminar el color porque está asociado a una o más flores");
        }

        colorRepository.deleteById(id);
    }

    private ColorDTO toDto(Color color) {
        return new ColorDTO(color.getIdColor(), color.getNombre());
    }
}
