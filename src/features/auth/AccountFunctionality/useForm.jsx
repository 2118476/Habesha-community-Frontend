import { useState } from "react";
import api from '../../../api/axiosInstance';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const useForm = (validateForm) => {
  const navigate = useNavigate();

  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(values);

    if (Object.keys(validationErrors).length === 0) {
      const registration = {
        name: values.fullName.trim(),
        email: values.email,
        password: values.password,
      };

      try {
        const res = await api.post('/auth/register', registration);

        if (res.status === 200 || res.status === 201) {
          setValues({ fullName: '', email: '', password: '', confirmPassword: '' });
          setErrors({});
          await Swal.fire({
            icon: 'success',
            title: 'Check Your Email',
            text: 'We sent a verification link to your email. Please verify to activate your account.',
            confirmButtonColor: '#5995fd',
          });
          navigate('/login');
        }
      } catch (error) {
        console.error('Registration failed:', error);

        let errorMessage = 'Registration failed. Please try again.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setErrors({ submit: errorMessage });
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: errorMessage,
          confirmButtonColor: '#5995fd',
        });
      }
    } else {
      setErrors(validationErrors);
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
