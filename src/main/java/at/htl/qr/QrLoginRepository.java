package at.htl.qr;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class QrLoginRepository {

    @Inject
    EntityManager em;

    public Optional<QrLogin> findByToken(String token) {
        List<QrLogin> res = em.createQuery("SELECT q FROM QrLogin q WHERE q.token = :token", QrLogin.class)
                .setParameter("token", token)
                .setMaxResults(1)
                .getResultList();
        return res.isEmpty() ? Optional.empty() : Optional.of(res.get(0));
    }

    public Optional<QrLogin> findByMobileToken(String mobileToken) {
        List<QrLogin> res = em.createQuery("SELECT q FROM QrLogin q WHERE q.mobileToken = :mt", QrLogin.class)
                .setParameter("mt", mobileToken)
                .setMaxResults(1)
                .getResultList();
        return res.isEmpty() ? Optional.empty() : Optional.of(res.get(0));
    }

    public void persist(QrLogin q) {
        em.persist(q);
    }
}
