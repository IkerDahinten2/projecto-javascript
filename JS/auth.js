function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = document.querySelectorAll(".tab");

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    tabs[0].classList.add("active");
    tabs[1].classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");

    tabs[1].classList.add("active");
    tabs[0].classList.remove("active");
  }
}


function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;


  if (email === "admin@eventos.gt" && password === "admin123") {
    localStorage.setItem("currentUser", JSON.stringify({ role: "admin" }));
    window.location.href = "admin.html";
  } 
  else if (email === "usuario@eventos.gt" && password === "user123") {
    localStorage.setItem("currentUser", JSON.stringify({ role: "user" }));
    window.location.href = "events.html";
  } 
  else {
    alert("Credenciales incorrectas");
  }
}


function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;

  alert("Usuario creado: " + name);


  switchTab("login");
}