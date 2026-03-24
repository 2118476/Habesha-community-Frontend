function validateSignUpForm(values) {
  let errors = {};

  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Full Name
  if (!values.fullName || !values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters.";
  }

  // Email
  if (!values.email) {
    errors.email = "Email is required.";
  } else if (!regexEmail.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  // Password
  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export default validateSignUpForm;
