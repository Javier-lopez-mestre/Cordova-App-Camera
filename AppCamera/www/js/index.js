/**
 * App Càmera amb Materialize SideNav
 * Compatible amb Cordova i navegador (Go Live)
 */

let sidenav;
let photoCollection = [];
let isCordova = false;
let appInitialized = false;
let initTimeout;

// Detectar si és Cordova o navegador amb timeout de fallback
if (typeof cordova !== 'undefined') {
    document.addEventListener('deviceready', onDeviceReady, false);
    // Timeout de 3 segundos - si deviceready no se dispara, asumir que es Go Live
    initTimeout = setTimeout(() => {
        if (!appInitialized) {
            console.log('Deviceready timeout - assuming browser environment');
            initApp();
        }
    }, 3000);
} else {
    // Direct initialization for browser
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}

function onDeviceReady() {
    clearTimeout(initTimeout);
    isCordova = true;
    console.log('Cordova is ready - Running on: ' + cordova.platformId + '@' + cordova.version);
    initApp();
}

function initApp() {
    if (appInitialized) return;
    appInitialized = true;
    clearTimeout(initTimeout);
    
    console.log('Initializing app... (Cordova: ' + isCordova + ')');
    
    // Wait for Materialize to load
    if (typeof M === 'undefined') {
        setTimeout(initApp, 100);
        return;
    }
    
    try {
        // Initialize Materialize Sidenav
        const sidenavElements = document.querySelectorAll('.sidenav');
        if (sidenavElements.length > 0) {
            sidenav = M.Sidenav.init(sidenavElements);
        }
        
        // Set up camera button
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', capturePhoto);
        }
        
        // Set up hidden file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }
        
        console.log('App initialized successfully!');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Error initializing app: ' + error.message);
    }
}

function capturePhoto() {
    if (isCordova && navigator.camera) {
        // Use Cordova Camera Plugin for real device
        navigator.camera.getPicture(
            onPhotoSuccess,
            onPhotoError,
            {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                encodingType: Camera.EncodingType.JPEG,
                mediaType: Camera.MediaType.PICTURE,
                correctOrientation: true,
                targetWidth: 800,
                targetHeight: 800
            }
        );
    } else {
        // Use file input for browser (Go Live) or fallback
        document.getElementById('fileInput').click();
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            onPhotoSuccess(e.target.result, true);
        };
        reader.onerror = function() {
            showError('Error al llegir el fitxer');
        };
        reader.readAsDataURL(file);
    }
    // Reset input for future selections
    event.target.value = '';
}

function onPhotoSuccess(imageData, isDataUrl = false) {
    try {
        // Create image data URI
        let imageDataURI;
        if (isDataUrl) {
            imageDataURI = imageData;
        } else {
            // If it's base64 from Cordova
            if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
                imageDataURI = 'data:image/jpeg;base64,' + imageData;
            } else {
                imageDataURI = imageData;
            }
        }
        
        // Add to collection
        const photoObj = {
            id: Date.now(),
            data: imageDataURI,
            timestamp: new Date().toLocaleString('ca-ES')
        };
        
        photoCollection.push(photoObj);
        
        // Display in preview
        const photoPreview = document.getElementById('photo-preview');
        if (photoPreview) {
            photoPreview.src = imageDataURI;
        }
        
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'block';
        }
        
        // Add to SideNav
        addPhotoToSidebar(photoObj);
        
        // Clear error message
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        console.log('Photo processed successfully');
        
        // Scroll to preview
        setTimeout(() => {
            const previewEl = document.getElementById('preview-container');
            if (previewEl) {
                previewEl.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    } catch (error) {
        console.error('Error processing photo:', error);
        showError('Error al processar la foto: ' + error.message);
    }
}

function onPhotoError(message) {
    console.error('Failed to capture photo: ' + message);
    showError('Error: ' + message);
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function addPhotoToSidebar(photoObj) {
    try {
        const photosList = document.getElementById('photos-list');
        if (!photosList) return;
        
        // Remove the "no photos" message if it exists
        const noPhotosMsg = photosList.querySelector('p[style*="color: #999"]');
        if (noPhotosMsg) {
            noPhotosMsg.remove();
        }
        
        // Create photo item
        const photoItem = document.createElement('li');
        photoItem.className = 'photo-item';
        photoItem.style.display = 'flex';
        photoItem.style.alignItems = 'center';
        photoItem.style.padding = '10px 20px';
        photoItem.style.borderBottom = '1px solid #eee';
        
        const photoLink = document.createElement('a');
        photoLink.href = '#';
        photoLink.style.textDecoration = 'none';
        photoLink.style.display = 'flex';
        photoLink.style.alignItems = 'center';
        photoLink.style.width = '100%';
        photoLink.style.cursor = 'pointer';
        
        photoLink.addEventListener('click', (e) => {
            e.preventDefault();
            viewPhoto(photoObj.id);
        });
        
        // Create thumbnail container
        const thumbContainer = document.createElement('div');
        thumbContainer.style.display = 'flex';
        thumbContainer.style.alignItems = 'center';
        thumbContainer.style.width = '100%';
        thumbContainer.style.cursor = 'pointer';
        
        // Create thumbnail image
        const thumbImg = document.createElement('img');
        thumbImg.src = photoObj.data;
        thumbImg.style.width = '50px';
        thumbImg.style.height = '50px';
        thumbImg.style.objectFit = 'cover';
        thumbImg.style.borderRadius = '4px';
        thumbImg.style.marginRight = '15px';
        thumbImg.style.flexShrink = '0';
        
        // Create info container
        const infoContainer = document.createElement('div');
        infoContainer.style.minWidth = '0';
        
        const titleP = document.createElement('p');
        titleP.textContent = 'Foto ' + photoCollection.length;
        titleP.style.margin = '0';
        titleP.style.fontWeight = 'bold';
        titleP.style.fontSize = '14px';
        titleP.style.color = '#333';
        
        const dateP = document.createElement('p');
        dateP.textContent = photoObj.timestamp;
        dateP.style.margin = '5px 0 0 0';
        dateP.style.fontSize = '12px';
        dateP.style.color = '#999';
        dateP.style.overflow = 'hidden';
        dateP.style.textOverflow = 'ellipsis';
        dateP.style.whiteSpace = 'nowrap';
        
        infoContainer.appendChild(titleP);
        infoContainer.appendChild(dateP);
        
        thumbContainer.appendChild(thumbImg);
        thumbContainer.appendChild(infoContainer);
        
        photoLink.appendChild(thumbContainer);
        photoItem.appendChild(photoLink);
        
        photosList.appendChild(photoItem);
    } catch (error) {
        console.error('Error adding photo to sidebar:', error);
    }
}

function viewPhoto(photoId) {
    try {
        const photo = photoCollection.find(p => p.id === photoId);
        if (photo) {
            const photoPreview = document.getElementById('photo-preview');
            if (photoPreview) {
                photoPreview.src = photo.data;
            }
            
            const previewContainer = document.getElementById('preview-container');
            if (previewContainer) {
                previewContainer.style.display = 'block';
            }
            
            // Close sidebar if it exists
            if (sidenav) {
                sidenav.close();
            }
            
            // Scroll to preview
            setTimeout(() => {
                const previewEl = document.getElementById('preview-container');
                if (previewEl) {
                    previewEl.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error viewing photo:', error);
    }
}
