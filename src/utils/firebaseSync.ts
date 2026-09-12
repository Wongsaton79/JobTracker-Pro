import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import { JobItem } from '../types';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDAwvyukCFaNVNVEdwfIVdym5iYjRALQrM',
  authDomain: 'jobtracker-db.firebaseapp.com',
  projectId: 'jobtracker-db',
  storageBucket: 'jobtracker-db.firebasestorage.app',
  messagingSenderId: '106894894608',
  appId: '1:106894894608:web:5b2e182a0b7b7538634c95',
};

let firestoreInstance: Firestore | null = null;

export const getFirestoreDb = (): Firestore | null => {
  try {
    if (!firestoreInstance) {
      const app = getApps().length === 0 ? initializeApp(DEFAULT_FIREBASE_CONFIG) : getApp();
      firestoreInstance = getFirestore(app);
    }
    return firestoreInstance;
  } catch (err) {
    console.error('Failed to initialize Firestore:', err);
    return null;
  }
};

/**
 * Real-time listener for Firestore "jobs" collection
 */
export const subscribeToFirebaseJobs = (
  onJobsReceived: (jobs: JobItem[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const db = getFirestoreDb();
  if (!db) {
    if (onError) onError(new Error('Firebase is not initialized'));
    return () => {};
  }

  try {
    const jobsCollection = collection(db, 'jobs');
    const q = query(jobsCollection);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobs: JobItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as JobItem;
          jobs.push({
            ...data,
            id: docSnap.id || data.id,
          });
        });
        onJobsReceived(jobs);
      },
      (err) => {
        console.warn('Firestore snapshot error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Subscribe to Firebase failed:', err);
    if (onError) onError(err as Error);
    return () => {};
  }
};

/**
 * Save / Update a job in Firestore
 */
export const saveJobToFirebase = async (job: JobItem): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'jobs', job.id);
    // Sanitize undefined fields for Firestore
    const cleanJob = JSON.parse(JSON.stringify(job));
    await setDoc(docRef, cleanJob, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving job to Firebase Firestore:', err);
    return false;
  }
};

/**
 * Delete a job from Firestore
 */
export const deleteJobFromFirebase = async (jobId: string): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'jobs', jobId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting job from Firebase Firestore:', err);
    return false;
  }
};

/**
 * Fetch all jobs once from Firestore
 */
export const fetchJobsFromFirebaseOnce = async (): Promise<JobItem[]> => {
  const db = getFirestoreDb();
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, 'jobs'));
    const jobs: JobItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as JobItem;
      jobs.push({
        ...data,
        id: docSnap.id || data.id,
      });
    });
    return jobs;
  } catch (err) {
    console.error('Error fetching jobs from Firebase:', err);
    return [];
  }
};

/**
 * Bulk upload / seed all jobs into Firebase Firestore
 */
export const syncAllJobsToFirebase = async (jobs: JobItem[]): Promise<number> => {
  const db = getFirestoreDb();
  if (!db || !jobs || jobs.length === 0) return 0;

  let successCount = 0;
  for (const job of jobs) {
    try {
      const docRef = doc(db, 'jobs', job.id);
      const cleanJob = JSON.parse(JSON.stringify(job));
      await setDoc(docRef, cleanJob, { merge: true });
      successCount++;
    } catch (err) {
      console.warn(`Failed to sync job ${job.id} to Firebase:`, err);
    }
  }
  return successCount;
};

