// src/services/adminNotificationService.ts

// IMPORTANT: This URL must point to your *local backend* server,
// NOT the admin panel's own URL (which is localhost:5173).
// This must be the IP address of the computer running the backend.
const LOCAL_BACKEND_URL = 'http://10.145.44.103:4242'; // Use the same IP as your mobile app's config/api.ts

/**
 * Calls the local backend to send a push notification and create an inbox message.
 * @param userId - The ID of the user to notify (the provider's ID).
 * @param title - The title of the notification.
 * @param body - The body message of the notification.
 */
export const triggerNotification = async (
  userId: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  if (!userId || !title || !body) {
    console.error('[Admin] TriggerNotification called with missing parameters.');
    return { success: false, error: 'Missing parameters.' };
  }

  console.log(`[Admin] Triggering notification for user ${userId}...`);
  try {
    const response = await fetch(`${LOCAL_BACKEND_URL}/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, title, body }),
    });

    if (!response.ok) {
      // Try to get a specific error message from the backend
      let errorData;
      try {
          errorData = await response.json();
      } catch (parseError) {
          // If the response isn't JSON (e.g., HTML error page), use the status text
          errorData = { error: response.statusText || `Server responded with ${response.status}` };
      }
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('[Admin] Notification triggered successfully:', data);
    return { success: true };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Admin] Error triggering notification:', message);
    return { success: false, error: message };
  }
};