// Temporary "database" with a pre-registered user
var users = [
    {
      name: "Abdullahi",
      email: "abdullahikunji@gmail.com",
      password: "abdullahi090@1"
    }
  ];
  
  // Show forms
  function showSignup() {
    document.getElementById("login").style.display = "none";
    document.getElementById("signup").style.display = "block";
  }
  
  function showLogin() {
    document.getElementById("login").style.display = "block";
    document.getElementById("signup").style.display = "none";
  }
  
  // Signup
  function signup() {
    var name = document.getElementById("signupName").value;
    var email = document.getElementById("signupEmail").value;
    var password = document.getElementById("signupPassword").value;
  
    if(users.find(u => u.email === email)) {
      alert("⚠️ Email already exists!");
      return;
    }
  
    users.push({name: name, email: email, password: password});
    alert("✅ Account created! Please login.");
    showLogin();
  }
  
  // Login
  function login() {
    var email = document.getElementById("loginEmail").value;
    var password = document.getElementById("loginPassword").value;
  
    var user = users.find(u => u.email === email && u.password === password);
    if(user) {
      alert("✅ Login successful!");
      // Redirect to Google Form or your link
      window.location.href = "https://docs.google.com/forms/d/e/1FAIpQLSe6Fd_jNCnZ22220UmBNYqUhZeKCo66RInk3l2kd59DY3SSAw/viewform?usp=header";
    } else {
      alert("❌ Wrong email or password!");
    }
  }
  