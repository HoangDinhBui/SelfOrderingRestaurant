package com.example.SelfOrderingRestaurant.Entity;
import com.example.SelfOrderingRestaurant.Entity.Enum.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Notification_ID")
    private Integer notificationId;

    @ManyToOne
    @JoinColumn(name = "User_ID", referencedColumnName = "User_ID")
    private User user;

    @Column(name = "Title")
    private String title;

    @Column(name = "Content", columnDefinition = "TEXT")
    private String content;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "CreateAt", nullable = false)
    private Date createAt = new Date();

    @Column(name = "IsRead")
    private Boolean isRead = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type")
    private NotificationType type;
}
