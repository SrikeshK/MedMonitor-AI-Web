import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COLLECTION_NAME = 'family_members';

/**
 * Subscribe to real-time updates for family members of a specific user
 * @param {string} userId - The authenticated user's ID
 * @param {function} callback - Function to handle the data updates
 */
export const subscribeToFamilyMembers = (userId, callback) => {
  if (!userId) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(members);
  }, (error) => {
    console.error("Error subscribing to family members:", error);
    callback([]);
  });
};

/**
 * Add a new family member to Firestore
 * @param {object} memberData - The member data to add
 */
export const addFamilyMember = async (memberData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...memberData,
      lastAlertTime: null,
      status: 'Active',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding family member:", error);
    throw error;
  }
};

/**
 * Update an existing family member
 * @param {string} memberId - The document ID
 * @param {object} updateData - Data to update
 */
export const updateFamilyMember = async (memberId, updateData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, memberId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating family member:", error);
    throw error;
  }
};

/**
 * Delete a family member
 * @param {string} memberId - The document ID to delete
 */
export const deleteFamilyMember = async (memberId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, memberId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting family member:", error);
    throw error;
  }
};
