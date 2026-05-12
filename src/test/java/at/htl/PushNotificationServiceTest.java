package at.htl;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class PushNotificationServiceTest {

    @Test
    void testNotifyParticipants_noTokens() {
        EntityManager em = mock(EntityManager.class);
        Query query = mock(Query.class);

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());

        PushNotificationService service = new PushNotificationService();
        service.em = em;

        service.notifyParticipants(1L, "Test message");

        verify(query).getResultList();
    }

    @Test
    void testNotifyParticipants_withTokens() {
        EntityManager em = mock(EntityManager.class);
        Query query = mock(Query.class);

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of("token1", "token2"));

        PushNotificationService service = new PushNotificationService();
        service.em = em;

        service.notifyParticipants(1L, "Test message");

        verify(query).getResultList();
    }

    @Test
    void testNotifyParticipants_nullPartyId() {
        EntityManager em = mock(EntityManager.class);
        Query query = mock(Query.class);

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());

        PushNotificationService service = new PushNotificationService();
        service.em = em;

        service.notifyParticipants(null, "Test message");

        verify(query).setParameter("partyId", null);
    }
}
