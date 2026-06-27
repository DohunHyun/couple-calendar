package com.couplecalendar.category;

import com.couplecalendar.user.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUser(User user);

    @Query("""
            select c from Category c
            where c.user.id = :userId
               or (
                   c.type = com.couplecalendar.category.CategoryType.SHARED
                   and :coupleId is not null
                   and c.user.couple is not null
                   and c.user.couple.id = :coupleId
               )
            order by c.createdAt asc
            """)
    List<Category> findAccessibleCategories(@Param("userId") Long userId, @Param("coupleId") Long coupleId);
}
