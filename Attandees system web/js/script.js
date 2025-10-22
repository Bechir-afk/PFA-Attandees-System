// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

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

// Notification Function (if not already defined in HTML)
function showNotification(message, type) {
  if (window.showNotification) {
    // If already defined in HTML, use that
    window.showNotification(message, type);
    return;
  }

  const notification = document.createElement("div");
  notification.classList.add("notification", type);
  notification.textContent = message;

  document.body.appendChild(notification);

  // Show the notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Hide the notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 500); // Wait for the fade-out animation to complete
  }, 3000);
}

// Add firebase event handlers and animation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Login Function
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", function (e) {
      e.preventDefault();

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;

          // Fetch user role from Firestore
          const userDocRef = doc(db, "users", user.uid);
          getDoc(userDocRef).then((docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              const role = userData.role;

              // Redirect based on role
              if (role === "admin") {
                window.location.href = "../html/home.html";
              } else if (role === "teacher") {
                window.location.href = "../html/dashboard.html";
              } else {
                window.location.href = "../html/home.html";
              }
            } else {
              alert("No role assigned to this user.");
            }
          });
        })
        .catch((error) => {
          console.log("Firebase Auth login failed, checking Firestore...");
          // If Firebase Auth login fails, check Firestore
          firebase.firestore().collection("users")
            .where("email", "==", email)
            .where("password", "==", password)
            .get()
            .then((snapshot) => {
              if (!snapshot.empty) {
                // Login successful via Firestore
                const userData = snapshot.docs[0].data();
                sessionStorage.setItem('userId', snapshot.docs[0].id);
                sessionStorage.setItem('userRole', userData.role);
                sessionStorage.setItem('userEmail', userData.email);

                // Redirect based on role
                if (userData.role === "student") {
                  window.location.href = "../html/home.html";
                } else if (userData.role === "admin") {
                  window.location.href = "../html/home.html";
                } else if (userData.role === "teacher") {
                  window.location.href = "../html/home.html";
                } else {
                  window.location.href = "../html/home.html";  // Default fallback
                }
              } else {
                // No matching user found
                alert("Login failed. Please check your credentials.");
              }
            })
            .catch(err => {
              console.error("Firestore check failed:", err);
              alert("Login failed. Please check your credentials.");
            });
        });
    });
  }

  // Forgot Password Function
  const forgotPasswordLink = document.getElementById("forgot-password");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();

      const email = prompt("Please enter your email address:");

      if (email) {
        sendPasswordResetEmail(auth, email)
          .then(() => {
            showNotification("Password reset email sent. Check your inbox.", "success");
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            if (errorCode === "auth/user-not-found") {
              showNotification("User not found.", "error");
            } else {
              showNotification(`Error sending password reset email: ${errorMessage}`, "error");
            }
          });
      } else {
        showNotification("Please enter a valid email address.", "error");
      }
    });
  }
});

// Export any functions you need to access from other scripts
export { showNotification };