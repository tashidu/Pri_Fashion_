/**
 * Utility functions for uploading images directly to Django backend
 */
import axios from 'axios';

/**
 * Upload a single image to Django backend
 * @param {File} file - The file to upload
 * @param {number} productId - The ID of the product to associate the image with
 * @param {Function} progressCallback - Optional callback for upload progress
 * @returns {Promise<string>} - A promise that resolves to the image URL
 */
export const uploadImage = async (file, productId, progressCallback = null) => {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('image', file);
    
    // Make the API request with progress tracking
    const response = await axios.post(
      `http://localhost:8000/api/finished_product/upload-image/${productId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            progressCallback(percentCompleted);
          }
        },
      }
    );
    
    // Return the image URL from the response
    return response.data.image_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Django backend
 * @param {File[]} files - Array of files to upload
 * @param {number} productId - The ID of the product to associate the images with
 * @param {Function} progressCallback - Optional callback for overall upload progress
 * @returns {Promise<string[]>} - A promise that resolves to an array of image URLs
 */
export const uploadMultipleImages = async (files, productId, progressCallback = null) => {
  try {
    // Create a FormData object to send all files
    const formData = new FormData();
    
    // Append each file to the FormData
    files.forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });
    
    // Make the API request with progress tracking
    const response = await axios.post(
      `http://localhost:8000/api/finished_product/upload-multiple-images/${productId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            progressCallback(percentCompleted);
          }
        },
      }
    );
    
    // Return the array of image URLs from the response
    return response.data.image_urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};
