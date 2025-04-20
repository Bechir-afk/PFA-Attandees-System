
    function showNotification(message, type) {
      const notification = document.createElement("div");
      notification.classList.add("notification", type);
      notification.textContent = message;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add("show");
      }, 10);

      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, 3000);
    }
    window.showNotification = showNotification;

    
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
    import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
    import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

    const firebaseConfig = {
      apiKey: "AIzaSyAtj5j3xYmxRMOMR6ZOy8ucoqqhsD0jlZo",
      authDomain: "fdhf-4403b.firebaseapp.com",
      databaseURL: "https://fdhf-4403b-default-rtdb.firebaseio.com",
      projectId: "fdhf-4403b",
      storageBucket: "fdhf-4403b.appspot.com",
      messagingSenderId: "805654928789",
      appId: "1:805654928789:web:c7d541db0c1f92196e2a9c",
      measurementId: "G-KZNZ6JQ4FL"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    window.firebaseApp = { app, auth, db, storage };

    // Add firebase event handlers when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      // Signup Function
      const signupBtn = document.getElementById("signup-btn");
      if (signupBtn) {
        signupBtn.addEventListener("click", function (e) {
          e.preventDefault();

          const email = document.getElementById("signup-email").value;
          const password = document.getElementById("signup-password").value;
          const confirmPassword = document.getElementById("signup-confirm-password").value;

          if (password !== confirmPassword) {
            showNotification("Passwords do not match.", "error");
            return;
          }

          createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              const user = userCredential.user;
              showNotification("Signup successful!", "success");
              setTimeout(() => {
                window.location.href = "index.html";
              }, 1500);
            })
            .catch((error) => {
              const errorCode = error.code;
              const errorMessage = error.message;

              showNotification(`Signup failed: ${errorMessage}`, "error");
            });
        });
      }
    });
  
 