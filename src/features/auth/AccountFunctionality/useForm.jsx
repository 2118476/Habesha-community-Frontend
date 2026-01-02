import { useState } from "react";
// Use the shared axios instance rather than creating a new one.
import api from '../../../api/axiosInstance';
import { useNavigate } from "react-router-dom";

const useForm = (validateForm) => {
  const navigate = useNavigate();
  //fields in sign up form
  //values set to empty
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    country: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  //this is used to check errors for the sign up form
  const [errors, setErrors] = useState({});

  // take user to login after registration.  We no longer use a
  // separate confirmation screen so this helper is unused.

  const handleChange = (e) => {
    //get the value from user input
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //check the values in the signup form
    const errors = validateForm(values);
    if (Object.keys(errors).length === 0) {
      const { firstName, lastName, country, phone, email, password } = values;
      // Map the registration values from the E‑Learning form to the
      // Habesha registration request.  The backend expects a single
      // name field, a city rather than country and a fixed role.  We
      // default the role to USER for all registrations via this form.
      const registration = {
        name: `${firstName} ${lastName}`.trim(),
        email: email,
        phone: phone,
        city: country,
        password: password,
        role: 'USER',
      };
      try {
        // Use the unified /auth/register endpoint.  The shared
        // axios instance will prefix the baseURL automatically.
        const res = await api.post('/auth/register', registration);
        if (res.status === 200 || res.status === 201) {
          // Reset form values after successful registration
          setValues({
            firstName: '',
            lastName: '',
            dob: '',
            country: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: '',
          });
          setErrors({});
          // Redirect the user to the login page after registration
          navigate('/login');
        }
      } catch (error) {
        // In case of error we simply log it.  Additional user
        // feedback could be added here using SweetAlert or toast.
        console.error(error);
      }
    } else {
      setErrors(errors);
    }
  };

  return {
    handleChange,
    values,
    handleSubmit,
    errors,
    showErrors: Object.keys(errors).length > 0,
  };
};

export default useForm;
