import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Service to handle User Profile and Family/Care Circle
 * Preserves Android App Schema
 */

export const subscribeToUserProfile = (userId, callback) => {
  return onSnapshot(doc(db, 'Users', userId), (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      // Ensure we use fullName as per Android schema
      callback({
        id: doc.id,
        ...data,
        name: data.fullName // Mapping for components that might still expect 'name'
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error fetching user profile:", error);
  });
};

export const subscribeToFamilyMembers = (userId, callback) => {
  // Use EXACT Android collection name: FamilyMembers
  const q = query(
    collection(db, 'FamilyMembers'),
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

export const subscribeToPatientCaregivers = (userId, callback) => {
  // Use EXACT Android linkage: caregiverId
  // This might be used by a patient to see their caregivers
  const q = query(
    collection(db, 'patients'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const connections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(connections);
  }, (error) => {
    console.error("Error subscribing to patient caregivers:", error);
    callback([]);
  });
};

export const updateUserProfileName = async (userId, newName) => {
  const userRef = doc(db, 'Users', userId);
  await updateDoc(userRef, { fullName: newName });
};
