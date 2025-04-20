// Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyAtj5j3xYmxRMOMR6ZOy8ucoqqhsD0jlZo",
      authDomain: "fdhf-4403b.firebaseapp.com",
      databaseURL: "https://fdhf-4403b-default-rtdb.firebaseio.com",
      projectId: "fdhf-4403b",
      storageBucket: "fdhf-4403b.appspot.com",
      messagingSenderId: "805654928789",
      appId: "1:805654928789:web:c7d541db0c1f92196e2a9c",
      measurementId: "G-KZNZ6JQ4FL",
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // DOM Elements
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const menuLogout = document.getElementById('menu-logout');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const profileImageUpload = document.getElementById('profile-image-upload');
    
    // Authentication state observer
    auth.onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in
        console.log("User is signed in:", user.email);
        
        // Update user email in nav dropdown
        document.getElementById('menu-user-email').textContent = user.email;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-contact-email').textContent = user.email;
        
        // Load user profile data
        loadUserProfile(user.uid);
        
        // Load attendance statistics
        loadAttendanceStats(user.uid);
        
        // Load enrolled courses
        loadEnrolledCourses(user.uid);
      } else {
        // User is signed out, redirect to login page
        window.location.href = 'login.html';
      }
    });
    
    // Toggle dropdown menu
    userMenuBtn.addEventListener('click', function() {
      userMenuDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (userMenuBtn && userMenuDropdown && 
          !userMenuBtn.contains(event.target) && 
          !userMenuDropdown.contains(event.target)) {
        userMenuDropdown.classList.add('hidden');
      }
    });
    
    // Logout function
    function logoutUser() {
      auth.signOut()
        .then(() => {
          window.location.href = 'login.html';
        })
        .catch((error) => {
          console.error("Error signing out: ", error);
          showNotification('Error signing out. Please try again.', 'error');
        });
    }
    
    // Add event listeners for logout
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    if (menuLogout) menuLogout.addEventListener('click', logoutUser);
    
    // Profile image upload
    if (profileImageUpload) {
      profileImageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if the file is an image
        if (!file.type.match('image.*')) {
          showNotification('Please select an image file', 'error');
          return;
        }
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showNotification('Image size should be less than 5MB', 'error');
          return;
        }
        
        const user = auth.currentUser;
        if (!user) return;
        
        // Show loading notification
        showNotification('Uploading profile image...', 'info');
        
        // Create a storage reference
        const storageRef = storage.ref();
        const profileImageRef = storageRef.child(`profile_images/${user.uid}/${file.name}`);
        
        // Upload file
        const uploadTask = profileImageRef.put(file);
        
        // Monitor upload progress
        uploadTask.on('state_changed', 
          (snapshot) => {
            // Progress function
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          }, 
          (error) => {
            // Error function
            console.error('Upload failed:', error);
            showNotification('Upload failed. Please try again.', 'error');
          }, 
          () => {
            // Complete function
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
              console.log('File available at', downloadURL);
              
              // Update profile image in UI
              document.getElementById('profile-image').src = downloadURL;
              document.getElementById('user-avatar').src = downloadURL;
              
              // Update profile image URL in Firestore
              db.collection('users').doc(user.uid).update({
                profileImage: downloadURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              })
              .then(() => {
                showNotification('Profile image updated successfully', 'success');
              })
              .catch((error) => {
                console.error('Error updating profile:', error);
                showNotification('Error updating profile image', 'error');
              });
            });
          }
        );
      });
    }
    
    // Edit profile modal
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', function() {
        // Populate the form with current user data
        const user = auth.currentUser;
        if (!user) return;
        
        db.collection('users').doc(user.uid).get()
          .then((doc) => {
            if (doc.exists) {
              const userData = doc.data();
              
              // Basic Information
              document.getElementById('edit-first-name').value = userData.firstName || '';
              document.getElementById('edit-last-name').value = userData.lastName || '';
              document.getElementById('edit-email').value = userData.email || '';
              document.getElementById('edit-student-id').value = userData.studentId || '';
              document.getElementById('edit-rfid').value = userData.rfid || '';
              document.getElementById('edit-dob').value = userData.dob || '';
              
              // Set gender if available
              const genderSelect = document.getElementById('edit-gender');
              if (userData.gender && genderSelect) {
                for (let i = 0; i < genderSelect.options.length; i++) {
                  if (genderSelect.options[i].value === userData.gender) {
                    genderSelect.selectedIndex = i;
                    break;
                  }
                }
              }
              
              // Academic Information
              document.getElementById('edit-department').value = userData.department || '';
              
              // Set year if available
              const yearSelect = document.getElementById('edit-year');
              if (userData.year && yearSelect) {
                for (let i = 0; i < yearSelect.options.length; i++) {
                  if (yearSelect.options[i].value === userData.year) {
                    yearSelect.selectedIndex = i;
                    break;
                  }
                }
              }
              
              document.getElementById('edit-program').value = userData.program || '';
              document.getElementById('edit-semester').value = userData.semester || '';
              
              // Contact Information
              document.getElementById('edit-phone').value = userData.phone || '';
              document.getElementById('edit-address').value = userData.address || '';
              
              // Show the modal
              editProfileModal.classList.remove('hidden');
            } else {
              showNotification('User profile not found', 'error');
            }
          })
          .catch((error) => {
            console.error('Error loading profile data:', error);
            showNotification('Error loading profile data', 'error');
          });
      });
    }
    
    // Close modal buttons
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', function() {
        editProfileModal.classList.add('hidden');
      });
    }
    
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', function() {
        editProfileModal.classList.add('hidden');
      });
    }
    
    // Click outside modal to close
    editProfileModal.addEventListener('click', function(event) {
      if (event.target === editProfileModal) {
        editProfileModal.classList.add('hidden');
      }
    });
    
    // Edit profile form submission
    editProfileForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const firstName = document.getElementById('edit-first-name').value.trim();
      const lastName = document.getElementById('edit-last-name').value.trim();
      
      if (!firstName || !lastName) {
        showNotification('First name and last name are required', 'error');
        return;
      }
      
      const user = auth.currentUser;
      if (!user) return;
      
      // Create updated user data object
      const updatedData = {
        firstName: firstName,
        lastName: lastName,
        name: `${firstName} ${lastName}`,
        dob: document.getElementById('edit-dob').value || '',
        gender: document.getElementById('edit-gender').value || '',
        department: document.getElementById('edit-department').value || '',
        year: document.getElementById('edit-year').value || '',
        program: document.getElementById('edit-program').value || '',
        semester: document.getElementById('edit-semester').value || '',
        phone: document.getElementById('edit-phone').value || '',
        address: document.getElementById('edit-address').value || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Update the user document in Firestore
      db.collection('users').doc(user.uid).update(updatedData)
        .then(() => {
          showNotification('Profile updated successfully', 'success');
          editProfileModal.classList.add('hidden');
          
          // Reload profile data to show changes
          loadUserProfile(user.uid);
        })
        .catch((error) => {
          console.error('Error updating profile:', error);
          showNotification('Error updating profile: ' + error.message, 'error');
        });
    });
    
    // Updated loadUserProfile function
    function loadUserProfile(userId) {
      db.collection('users').doc(userId).get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            
            // Update profile name and header
            const fullName = userData.firstName && userData.lastName ? 
              `${userData.firstName} ${userData.lastName}` : (userData.name || 'User');
            
            // Update displayed name and email
            document.getElementById('profile-name').textContent = fullName;
            document.getElementById('profile-email').textContent = userData.email || '';
            document.getElementById('profile-contact-email').textContent = userData.email || '';
            
            // Update role badge
            document.getElementById('profile-role').textContent = userData.role || 'Student';
            
            // Update basic information
            document.getElementById('profile-first-name').textContent = userData.firstName || '';
            document.getElementById('profile-last-name').textContent = userData.lastName || '';
            document.getElementById('profile-student-id').textContent = userData.studentId || '';
            document.getElementById('profile-rfid').textContent = userData.rfid || 'Not assigned';
            document.getElementById('profile-dob').textContent = userData.dob || '';
            document.getElementById('profile-gender').textContent = userData.gender || '';
            
            // Update academic information
            document.getElementById('profile-department').textContent = userData.department || '';
            document.getElementById('profile-year').textContent = userData.year || '';
            document.getElementById('profile-program').textContent = userData.program || '';
            document.getElementById('profile-semester').textContent = userData.semester || '';
            
            // Update contact information
            document.getElementById('profile-phone').textContent = userData.phone || '';
            document.getElementById('profile-address').textContent = userData.address || '';
            
            // Update join date if available
            if (userData.createdAt) {
              const joinDate = userData.createdAt.toDate();
              document.getElementById('profile-joined-date').textContent = joinDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
              });
            }
          } else {
            console.log("No user data found");
          }
        })
        .catch((error) => {
          console.error("Error getting user data:", error);
        });
    }
    
    // Load attendance statistics
    function loadAttendanceStats(userId) {
      db.collection('attendance')
        .where('userId', '==', userId)
        .get()
        .then((snapshot) => {
          if (snapshot.empty) {
            updateStatsUI(0, 0, 0, 0);
            return;
          }
          
          // Initialize counters
          let totalClasses = snapshot.size;
          let presentCount = 0;
          let earlyCount = 0;
          let lateCount = 0;
          
          // Process each record
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            if (data.clockInTime) {
              presentCount++;
              
              if (data.earlyLateStatus === 'early') {
                earlyCount++;
              } else if (data.earlyLateStatus === 'late') {
                lateCount++;
              }
            }
          });
          
          // Calculate final stats
          const absenceCount = totalClasses - presentCount;
          const attendanceRate = totalClasses > 0 ? 
            Math.round((presentCount / totalClasses) * 100) : 0;
          
          // Update UI with stats
          updateStatsUI(attendanceRate, absenceCount, lateCount, earlyCount);
        })
        .catch((error) => {
          console.error("Error loading attendance stats:", error);
          updateStatsUI(0, 0, 0, 0);
        });
    }
    
    // Update statistics UI
    function updateStatsUI(attendanceRate, absenceCount, lateCount, earlyCount) {
      document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;
      document.getElementById('absence-count').textContent = absenceCount;
      document.getElementById('late-count').textContent = lateCount;
      document.getElementById('early-count').textContent = earlyCount;
    }
    
    // Load enrolled courses
    function loadEnrolledCourses(userId) {
      // This would typically come from your Firebase database
      console.log("Loading enrolled courses for user:", userId);
      
      // For the demo, the courses are already in the HTML
      // In a real implementation, you would fetch this from Firebase
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 rounded-md shadow-lg p-4 max-w-md transform transition-all duration-300 ease-in-out translate-y-0 z-50';
      
      // Set background color based on type
      switch(type) {
        case 'success':
          notification.classList.add('bg-green-500', 'text-white');
          break;
        case 'error':
          notification.classList.add('bg-red-500', 'text-white');
          break;
        case 'warning':
          notification.classList.add('bg-yellow-500', 'text-white');
          break;
        default:
          notification.classList.add('bg-blue-500', 'text-white');
          break;
      }
      
      notification.innerHTML = `
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}</span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">${message}</p>
          </div>
          <div class="ml-auto pl-3">
            <button type="button" class="inline-flex text-white focus:outline-none">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(notification);
      
      // Set up close button
      notification.querySelector('button').addEventListener('click', () => {
        notification.classList.add('opacity-0', '-translate-y-4');
        setTimeout(() => {
          notification.remove();
        }, 300);
      });
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        notification.classList.add('opacity-0', '-translate-y-4');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 5000);
    }
    
    // Initialize page when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      console.log("Account page loaded");
    });
  