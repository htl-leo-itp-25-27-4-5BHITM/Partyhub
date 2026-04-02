package at.htl.qr;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "qr_login")
public class QrLogin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String token;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used;

    @Column(unique = true)
    private String mobileToken;

    @Column
    private Instant mobileTokenExpiresAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public String getMobileToken() { return mobileToken; }
    public void setMobileToken(String mobileToken) { this.mobileToken = mobileToken; }

    public Instant getMobileTokenExpiresAt() { return mobileTokenExpiresAt; }
    public void setMobileTokenExpiresAt(Instant mobileTokenExpiresAt) { this.mobileTokenExpiresAt = mobileTokenExpiresAt; }
}
