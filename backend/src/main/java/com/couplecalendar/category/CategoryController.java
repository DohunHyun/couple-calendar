package com.couplecalendar.category;

import com.couplecalendar.common.CurrentUser;
import com.couplecalendar.user.User;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CurrentUser currentUser;
    private final CategoryService categoryService;

    public CategoryController(CurrentUser currentUser, CategoryService categoryService) {
        this.currentUser = currentUser;
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryDtos.CategoryResponse> list(Authentication authentication) {
        User user = currentUser.require(authentication);
        return categoryService.list(user);
    }

    @PostMapping
    public CategoryDtos.CategoryResponse create(Authentication authentication, @Valid @RequestBody CategoryDtos.CategoryRequest request) {
        User user = currentUser.require(authentication);
        return categoryService.create(user, request);
    }

    @PutMapping("/{categoryId}")
    public CategoryDtos.CategoryResponse update(
            Authentication authentication,
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryDtos.CategoryRequest request
    ) {
        User user = currentUser.require(authentication);
        return categoryService.update(user, categoryId, request);
    }
}
