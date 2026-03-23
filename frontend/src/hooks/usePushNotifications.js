import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Convierte la VAPID public key de base64url a Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const usePushNotifications = () => {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [supported]                 = useState(
    'serviceWorker' in navigator && 'PushManager' in window
  );

  // Verificar si ya existe suscripción activa
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);
    try {
      // Pedir permiso al usuario
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      // Obtener VAPID public key del backend
      const { data } = await api.get('/notifications/vapid-key');
      const vapidKey = urlBase64ToUint8Array(data.publicKey);

      // Suscribirse al push manager
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      // Guardar suscripción en el backend
      await api.post('/notifications/push/subscribe', { subscription: sub.toJSON() });
      setSubscribed(true);
    } catch (err) {
      console.error('Error al suscribirse a push:', err);
    } finally {
      setLoading(false);
    }
  }, [supported, loading]);

  const unsubscribe = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post('/notifications/push/unsubscribe', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('Error al desuscribirse de push:', err);
    } finally {
      setLoading(false);
    }
  }, [supported, loading]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
};

export default usePushNotifications;
