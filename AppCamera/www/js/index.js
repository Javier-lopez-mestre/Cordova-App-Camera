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
if (typeof cordova !== "undefined") {
  document.addEventListener("deviceready", onDeviceReady, false);
  // Timeout de 3 segundos - si deviceready no se dispara, asumir que es Go Live
  initTimeout = setTimeout(() => {
    if (!appInitialized) {
      console.log("Deviceready timeout - assuming browser environment");
      initApp();
    }
  }, 3000);
} else {
  // Direct initialization for browser
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
}

function onDeviceReady() {
  clearTimeout(initTimeout);
  isCordova = true;
  console.log(
    "Cordova is ready - Running on: " +
      cordova.platformId +
      "@" +
      cordova.version,
  );

  // Request permissions for Android 6+
  if (cordova.platformId === "android") {
    requestPermissions();
  } else {
    initApp();
  }
}

// Request runtime permissions for Android
function requestPermissions() {
  // Si cordova-plugin-android-permissions no está disponible, continuar
  if (!cordova.plugins || !cordova.plugins.permissions) {
    console.log("Permissions plugin not available, continuing...");
    initApp();
    return;
  }

  const permissions = [
    "android.permission.CAMERA",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
  ];

  cordova.plugins.permissions.hasPermission(permissions[0], function (status) {
    if (!status.hasPermission) {
      cordova.plugins.permissions.requestPermission(
        permissions,
        onPermissionsSuccess,
        onPermissionsError,
      );
    } else {
      initApp();
    }
  });
}

function onPermissionsSuccess(status) {
  console.log("Permissions granted:", status);
  initApp();
}

function onPermissionsError(status) {
  console.warn("Permissions not granted:", status);
  // Continue with app initialization even if permissions denied
  initApp();
}

function initApp() {
  if (appInitialized) return;
  appInitialized = true;
  clearTimeout(initTimeout);

  console.log("Initializing app... (Cordova: " + isCordova + ")");

  // Wait for Materialize to load
  if (typeof M === "undefined") {
    setTimeout(initApp, 100);
    return;
  }

  try {
    // Initialize Materialize Sidenav
    const sidenavElements = document.querySelectorAll(".sidenav");
    if (sidenavElements.length > 0) {
      sidenav = M.Sidenav.init(sidenavElements);
    }

    // Set up camera button
    const captureBtn = document.getElementById("captureBtn");
    if (captureBtn) {
      captureBtn.addEventListener("click", capturePhoto);
    }

    console.log("App initialized successfully!");
  } catch (error) {
    console.error("Error initializing app:", error);
    showError("Error initializing app: " + error.message);
  }
}

function capturePhoto() {
  if (isCordova && navigator.camera) {
    // Use Cordova Camera Plugin for real device
    navigator.camera.getPicture(onPhotoSuccess, onPhotoError, {
      quality: 50,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: Camera.MediaType.PICTURE,
      correctOrientation: true,
      targetWidth: 800,
      targetHeight: 800,
    });
  } else {
    // Use web camera for browser
    captureFromWebCamera();
  }
}

// Capture from web camera using getUserMedia
function captureFromWebCamera() {
  const constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "environment",
    },
    audio: false,
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      openCameraModal(stream);
    })
    .catch((err) => {
      console.error("Error accessing camera:", err);
      showError("No se puede acceder a la cámara: " + err.message);
    });
}

// Open camera modal for capturing
function openCameraModal(stream) {
  // Create modal HTML
  const modalHTML = `
    <div id="cameraModal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    ">
      <div style="
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <video id="cameraVideo" style="
          width: 100%;
          height: 100%;
          object-fit: contain;
        "></video>
        <div style="
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 20px;
        ">
          <button id="captureBtn2" style="
            background: #26a69a;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            cursor: pointer;
            font-size: 24px;
          ">📷</button>
          <button id="closeBtn" style="
            background: #ef5350;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">Cancelar</button>
        </div>
        <canvas id="photoCanvas" style="display: none;"></canvas>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("photoCanvas");
  const captureBtn2 = document.getElementById("captureBtn2");
  const closeBtn = document.getElementById("closeBtn");
  const modal = document.getElementById("cameraModal");

  // Set video source
  video.srcObject = stream;
  video.play();

  // Capture button
  captureBtn2.addEventListener("click", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    // Stop stream
    stream.getTracks().forEach((track) => track.stop());

    // Remove modal
    modal.remove();

    // Process photo
    onPhotoSuccess(imageData, true);
  });

  // Close button
  closeBtn.addEventListener("click", () => {
    stream.getTracks().forEach((track) => track.stop());
    modal.remove();
  });

  // Close on escape
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      closeBtn.click();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);
}

function onPhotoSuccess(imageData, isDataUrl = false) {
  try {
    // Create image data URI
    let imageDataURI;
    if (isDataUrl) {
      imageDataURI = imageData;
    } else {
      // If it's base64 from Cordova
      if (typeof imageData === "string" && !imageData.startsWith("data:")) {
        imageDataURI = "data:image/jpeg;base64," + imageData;
      } else {
        imageDataURI = imageData;
      }
    }

    // Add to collection
    const photoObj = {
      id: Date.now(),
      data: imageDataURI,
      timestamp: new Date().toLocaleString("ca-ES"),
    };

    photoCollection.push(photoObj);

    // Display in preview
    const photoPreview = document.getElementById("photo-preview");
    if (photoPreview) {
      photoPreview.src = imageDataURI;
    }

    const previewContainer = document.getElementById("preview-container");
    if (previewContainer) {
      previewContainer.style.display = "block";
    }

    // Add to SideNav
    addPhotoToSidebar(photoObj);

    // Clear error message
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.style.display = "none";
    }

    console.log("Photo processed successfully");

    // Scroll to preview
    setTimeout(() => {
      const previewEl = document.getElementById("preview-container");
      if (previewEl) {
        previewEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  } catch (error) {
    console.error("Error processing photo:", error);
    showError("Error al processar la foto: " + error.message);
  }
}

function onPhotoError(message) {
  console.error("Failed to capture photo: " + message);
  showError("Error: " + message);
}

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function addPhotoToSidebar(photoObj) {
  try {
    const photosList = document.getElementById("photos-list");
    if (!photosList) return;

    // Remove the "no photos" message if it exists
    const noPhotosMsg = photosList.querySelector('p[style*="color: #999"]');
    if (noPhotosMsg) {
      noPhotosMsg.remove();
    }

    // Create photo item
    const photoItem = document.createElement("li");
    photoItem.className = "photo-item";
    photoItem.style.display = "flex";
    photoItem.style.alignItems = "center";
    photoItem.style.padding = "10px 20px";
    photoItem.style.borderBottom = "1px solid #eee";

    const photoLink = document.createElement("a");
    photoLink.href = "#";
    photoLink.style.textDecoration = "none";
    photoLink.style.display = "flex";
    photoLink.style.alignItems = "center";
    photoLink.style.width = "100%";
    photoLink.style.cursor = "pointer";

    photoLink.addEventListener("click", (e) => {
      e.preventDefault();
      viewPhoto(photoObj.id);
    });

    // Create thumbnail container
    const thumbContainer = document.createElement("div");
    thumbContainer.style.display = "flex";
    thumbContainer.style.alignItems = "center";
    thumbContainer.style.width = "100%";
    thumbContainer.style.cursor = "pointer";

    // Create thumbnail image
    const thumbImg = document.createElement("img");
    thumbImg.src = photoObj.data;
    thumbImg.style.width = "50px";
    thumbImg.style.height = "50px";
    thumbImg.style.objectFit = "cover";
    thumbImg.style.borderRadius = "4px";
    thumbImg.style.marginRight = "15px";
    thumbImg.style.flexShrink = "0";

    // Create info container
    const infoContainer = document.createElement("div");
    infoContainer.style.minWidth = "0";

    const titleP = document.createElement("p");
    titleP.textContent = "Foto " + photoCollection.length;
    titleP.style.margin = "0";
    titleP.style.fontWeight = "bold";
    titleP.style.fontSize = "14px";
    titleP.style.color = "#333";

    const dateP = document.createElement("p");
    dateP.textContent = photoObj.timestamp;
    dateP.style.margin = "5px 0 0 0";
    dateP.style.fontSize = "12px";
    dateP.style.color = "#999";
    dateP.style.overflow = "hidden";
    dateP.style.textOverflow = "ellipsis";
    dateP.style.whiteSpace = "nowrap";

    infoContainer.appendChild(titleP);
    infoContainer.appendChild(dateP);

    thumbContainer.appendChild(thumbImg);
    thumbContainer.appendChild(infoContainer);

    photoLink.appendChild(thumbContainer);
    photoItem.appendChild(photoLink);

    photosList.appendChild(photoItem);
  } catch (error) {
    console.error("Error adding photo to sidebar:", error);
  }
}

function viewPhoto(photoId) {
  try {
    const photo = photoCollection.find((p) => p.id === photoId);
    if (photo) {
      const photoPreview = document.getElementById("photo-preview");
      if (photoPreview) {
        photoPreview.src = photo.data;
      }

      const previewContainer = document.getElementById("preview-container");
      if (previewContainer) {
        previewContainer.style.display = "block";
      }

      // Close sidebar if it exists
      if (sidenav) {
        sidenav.close();
      }

      // Scroll to preview
      setTimeout(() => {
        const previewEl = document.getElementById("preview-container");
        if (previewEl) {
          previewEl.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  } catch (error) {
    console.error("Error viewing photo:", error);
  }
}
