import { login, register } from "./auth.service.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");

document.getElementById("btnRegister").onclick = async () => {
  try {
    await register(emailInput.value, passwordInput.value);
    message.innerText = "Đăng ký thành công!";
  } catch (err) {
    message.innerText = err.message;
  }
};

document.getElementById("btnLogin").onclick = async () => {
  try {
    await login(emailInput.value, passwordInput.value);
    message.innerText = "Đăng nhập thành công!";
  } catch (err) {
    message.innerText = err.message;
  }
};
