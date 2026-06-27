package com.couplecalendar.category;

import com.couplecalendar.common.ApiException;
import com.couplecalendar.user.User;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDtos.CategoryResponse> list(User user) {
        return categoryRepository.findAccessibleCategories(user.getId(), user.getCoupleId()).stream()
                .map(category -> new CategoryDtos.CategoryResponse(
                        category.getId(),
                        category.getName(),
                        category.getColorHex(),
                        category.getType(),
                        category.getUser().getId(),
                        category.getUser().getNickname()))
                .toList();
    }

    @Transactional
    public CategoryDtos.CategoryResponse create(User user, CategoryDtos.CategoryRequest request) {
        Category category = categoryRepository.save(new Category(request.name(), request.colorHex(), request.type(), user));
        return new CategoryDtos.CategoryResponse(
                category.getId(),
                category.getName(),
                category.getColorHex(),
                category.getType(),
                category.getUser().getId(),
                category.getUser().getNickname()
        );
    }

    @Transactional
    public CategoryDtos.CategoryResponse update(User user, Long categoryId, CategoryDtos.CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot modify another user's category");
        }
        category.update(request.name(), request.colorHex(), request.type());
        return new CategoryDtos.CategoryResponse(
                category.getId(),
                category.getName(),
                category.getColorHex(),
                category.getType(),
                category.getUser().getId(),
                category.getUser().getNickname()
        );
    }
}
