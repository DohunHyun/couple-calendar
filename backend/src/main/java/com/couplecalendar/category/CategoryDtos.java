package com.couplecalendar.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;

public class CategoryDtos {

    public record CategoryRequest(
            @NotBlank String name,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String colorHex,
            @NotNull CategoryType type
    ) {}

    public record CategoryResponse(
            Long id,
            String name,
            String colorHex,
            CategoryType type,
            Long ownerUserId,
            String ownerNickname
    ) {}
}
