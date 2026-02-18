/**
 * App Càmera amb Materialize SideNav
 */

let sidenav;
let photoCollection = [];

// Wait for the deviceready event before using any of Cordova's device APIs
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    
    // Initialize Materialize components
    const sidenavElements = document.querySelectorAll('.sidenav');
    sidenav = M.Sidenav.init(sidenavElements);
    
    // Set up camera button
    const captureBtn = document.getElementById('captureBtn');
    captureBtn.addEventListener('click', capturePhoto);
    
    console.log('App initialized and ready!');
}

function capturePhoto() {
    // Use cordova-plugin-camera to capture photo
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
}

function onPhotoSuccess(imageData) {
    // Create image data URI
    const imageDataURI = 'data:image/jpeg;base64,' + imageData;
    
    // Add to collection
    const photoObj = {
        id: Date.now(),
        data: imageDataURI,
        timestamp: new Date().toLocaleString('ca-ES')
    };
    
    photoCollection.push(photoObj);
    
    // Display in preview
    document.getElementById('photo-preview').src = imageDataURI;
    document.getElementById('preview-container').style.display = 'block';
    
    // Add to SideNav
    addPhotoToSidebar(photoObj);
    
    // Clear error message
    document.getElementById('error-message').style.display = 'none';
    
    console.log('Photo captured successfully');
}

function onPhotoError(message) {
    console.error('Failed to capture photo: ' + message);
    
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = 'Error: ' + message;
    errorDiv.style.display = 'block';
}

function addPhotoToSidebar(photoObj) {
    const photosList = document.getElementById('photos-list');
    
    // Create photo item
    const photoItem = document.createElement('li');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
        <a href="#" class="photo-link" data-id="${photoObj.id}">
            <div class="photo-thumb">
                <img src="${photoObj.data}" alt="Photo" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                <div style="font-size: 12px; margin-left: 10px;">
                    <p style="margin: 0; font-weight: bold;">Foto ${photoCollection.length}</p>
                    <p style="margin: 0; color: #999;">${photoObj.timestamp}</p>
                </div>
            </div>
        </a>
    `;
    
    // Style for flex layout
    photoItem.style.display = 'flex';
    photoItem.style.alignItems = 'center';
    photoItem.style.padding = '10px 0';
    photoItem.style.borderBottom = '1px solid #eee';
    
    // Add click listener to view photo
    const photoLink = photoItem.querySelector('.photo-link');
    photoLink.addEventListener('click', (e) => {
        e.preventDefault();
        viewPhoto(photoObj.id);
    });
    
    photosList.appendChild(photoItem);
}

function viewPhoto(photoId) {
    const photo = photoCollection.find(p => p.id === photoId);
    if (photo) {
        document.getElementById('photo-preview').src = photo.data;
        document.getElementById('preview-container').style.display = 'block';
        
        // Close sidebar
        sidenav.close();
        
        // Scroll to preview
        document.getElementById('preview-container').scrollIntoView({ behavior: 'smooth' });
    }
}
