/**
 * Firebase Cloud Functions for JobTracker Pro
 * Automatically triggered when a new document is added to "line_notifications" collection
 * or when a job in "jobs" collection is created/updated.
 *
 * Deployment command:
 *   firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const DEFAULT_LINE_TOKEN =
  process.env.LINE_CHANNEL_ACCESS_TOKEN ||
  'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=';
const DEFAULT_LINE_GROUP = process.env.LINE_TARGET_GROUP_ID || 'C341417bcb6e853c320eaf9d80963cda3';

/**
 * Trigger 1: Firestore trigger on new "line_notifications" entry
 */
exports.onLineNotificationCreated = functions.firestore
  .document('line_notifications/{notifId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || data.status === 'sent') return null;

    const token = data.channelAccessToken || DEFAULT_LINE_TOKEN;
    const target = data.targetId || DEFAULT_LINE_GROUP;
    const payload = data.payload;

    if (!payload) {
      console.warn('No payload found for notification:', snap.id);
      return null;
    }

    try {
      const linePayload = {
        to: target,
        messages: Array.isArray(payload) ? payload : [payload],
      };

      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(linePayload),
      });

      const resText = await res.text();
      if (res.ok) {
        console.log(`LINE notification ${snap.id} delivered successfully.`);
        return snap.ref.update({
          status: 'sent',
          sentAt: new Date().toISOString(),
          lineApiResponse: resText,
        });
      } else {
        console.error(`LINE API Error (${res.status}):`, resText);
        return snap.ref.update({
          status: 'failed',
          error: `HTTP ${res.status}: ${resText}`,
          failedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error sending LINE notification:', err);
      return snap.ref.update({
        status: 'failed',
        error: err.message || String(err),
        failedAt: new Date().toISOString(),
      });
    }
  });

/**
 * HTTPS Relay endpoint for direct client calls (e.g. from GitHub Pages)
 */
exports.sendLineRelay = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const { targetId, channelAccessToken, payload } = req.body;
    const token = channelAccessToken || DEFAULT_LINE_TOKEN;
    const target = targetId || DEFAULT_LINE_GROUP;

    const linePayload = {
      to: target,
      messages: Array.isArray(payload) ? payload : [payload],
    };

    const apiRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(linePayload),
    });

    const data = await apiRes.text();
    return res.status(apiRes.status).send(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});
