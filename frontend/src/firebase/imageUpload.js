import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

/**
 * Upload a single image to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - The path in Firebase Storage to upload to
 * @param {Function} progressCallback - Callback function for upload progress
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const uploadImage = async (file, path, progressCallback = null) => {
  try {
    // Create a unique filename
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const fullPath = `${path}/${fileName}`;
    
    // Create a storage reference
    const storageRef = ref(storage, fullPath);
    
    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise that resolves with the download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (progressCallback) {
            progressCallback(progress);
          }
        },
        (error) => {
          // Handle errors
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          // Upload completed successfully, get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
};

/**
 * Upload multiple images to Firebase Storage
 * @param {File[]} files - Array of files to upload
 * @param {string} path - The path in Firebase Storage to upload to
 * @param {Function} progressCallback - Callback function for overall upload progress
 * @returns {Promise<string[]>} - A promise that resolves to an array of download URLs
 */
export const uploadMultipleImages = async (files, path, progressCallback = null) => {
  try {
    const uploadPromises = [];
    const totalFiles = files.length;
    let completedFiles = 0;
    
    // Create upload promises for each file
    for (const file of files) {
      const uploadPromise = uploadImage(
        file, 
        path, 
        (fileProgress) => {
          // Calculate overall progress
          if (progressCallback) {
            const overallProgress = 
              ((completedFiles / totalFiles) * 100) + 
              (fileProgress / totalFiles);
            progressCallback(overallProgress);
          }
        }
      );
      
      // When a file completes, increment the counter
      uploadPromise.then(() => {
        completedFiles++;
      });
      
      uploadPromises.push(uploadPromise);
    }
    
    // Wait for all uploads to complete
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error("Error in uploadMultipleImages:", error);
    throw error;
  }
};
