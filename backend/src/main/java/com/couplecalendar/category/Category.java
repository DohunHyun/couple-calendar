package com.couplecalendar.category;

import com.couplecalendar.common.BaseTimeEntity;
import com.couplecalendar.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.Size;

@Entity
public class Category extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 30)
    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 7)
    private String colorHex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoryType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    protected Category() {
    }

    public Category(String name, String colorHex, CategoryType type, User user) {
        this.name = name;
        this.colorHex = colorHex;
        this.type = type;
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getColorHex() {
        return colorHex;
    }

    public CategoryType getType() {
        return type;
    }

    public User getUser() {
        return user;
    }

    public void update(String name, String colorHex, CategoryType type) {
        this.name = name;
        this.colorHex = colorHex;
        this.type = type;
    }
}
