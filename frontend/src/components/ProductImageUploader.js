import React, { useState, useRef, useCallback } from 'react';
import { Button, Image, ProgressBar, Form } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaTrash, FaImage } from 'react-icons/fa';
import { uploadMultipleImages } from '../utils/imageUpload';
import './ProductImageUploader.css';

/**
 * Component for uploading product images directly to Django backend
 */
const ProductImageUploader = ({ productId, onImagesUploaded, maxImages = 10 }) => {
  // State for managing images
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Reference to the file input element
  const fileInputRef = useRef(null);
  
  // Handle file selection from the file input
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };
  
  // Process the selected files
  const processFiles = (files) => {
    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images. You already have ${selectedFiles.length} images.`);
      return;
    }
    
    // Reset error if any
    setError('');
    
    const newFiles = [];
    const newPreviewUrls = [...previewUrls];
    
    files.forEach(file => {
      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select image files only (JPEG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image size should be less than 5MB');
        return;
      }
      
      newFiles.push(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviewUrls.push(reader.result);
        setPreviewUrls([...newPreviewUrls]);
      };
      reader.readAsDataURL(file);
    });
    
    setSelectedFiles([...selectedFiles, ...newFiles]);
  };
  
  // Handle drag and drop functionality
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      processFiles(acceptedFiles);
    }
  }, [selectedFiles, previewUrls]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: maxImages
  });
  
  // Remove an image from the selection
  const removeImage = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviewUrls = [...previewUrls];
    
    newFiles.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
    
    // Adjust active index if needed
    if (index === activeImageIndex) {
      setActiveImageIndex(Math.max(0, index - 1));
    } else if (index < activeImageIndex) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  };
  
  // Upload the selected images
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Upload the images to the backend
      const imageUrls = await uploadMultipleImages(
        selectedFiles,
        productId,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Call the callback with the uploaded image URLs
      if (onImagesUploaded) {
        onImagesUploaded(imageUrls);
      }
      
      // Reset the component state
      setSelectedFiles([]);
      setPreviewUrls([]);
      setActiveImageIndex(0);
      setError('');
    } catch (error) {
      setError('Failed to upload images. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="product-image-uploader">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {/* Image preview grid */}
      {previewUrls.length > 0 && (
        <div className="image-preview-container mb-4">
          <h5 className="mb-3">Selected Images ({previewUrls.length})</h5>
          <div className="image-preview-grid">
            {previewUrls.map((previewUrl, index) => (
              <div
                key={index}
                className={`image-preview-item ${index === activeImageIndex ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(index)}
              >
                <div className="image-actions">
                  <Button
                    variant="danger"
                    size="sm"
                    className="btn-remove-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                  >
                    <FaTrash />
                  </Button>
                </div>
                <Image
                  src={previewUrl}
                  alt={`Preview ${index + 1}`}
                  thumbnail
                  className="preview-image"
                />
                <span className="image-number">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload progress */}
      {isUploading && (
        <div className="upload-progress-container p-4 bg-light rounded text-center mb-4">
          <h5 className="mb-3">Uploading Images</h5>
          <ProgressBar
            now={uploadProgress}
            label={`${Math.round(uploadProgress)}%`}
            variant="info"
            animated
            className="mb-3"
          />
          <p className="text-muted">
            Uploading {selectedFiles.length} images...
          </p>
        </div>
      )}
      
      {/* Upload area */}
      {!isUploading && selectedFiles.length < maxImages && (
        <div {...getRootProps()} className={`image-upload-container ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} multiple />
          <div className="text-center">
            <FaUpload size={40} className="mb-3 text-primary" />
            <p>Drag & drop product images here, or click to select</p>
            <p className="text-muted small">Supported formats: JPEG, PNG, GIF (Max: 5MB each)</p>
            <p className="text-muted small">You can select multiple images at once (Max: {maxImages})</p>
          </div>
        </div>
      )}
      
      {/* Hidden file input */}
      <Form.Control
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
      />
      
      {/* Upload button */}
      {selectedFiles.length > 0 && !isUploading && (
        <Button
          variant="primary"
          className="mt-3 w-100"
          onClick={handleUpload}
        >
          <FaImage className="me-2" />
          Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'}
        </Button>
      )}
    </div>
  );
};

export default ProductImageUploader;
