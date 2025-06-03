import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axiosInstance from "@/api/axiosInstance";
import { useState } from "react";

// Validation Schema
const schema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  password: Yup.string().min(6).required("Password is required"),
  terms: Yup.boolean().oneOf([true], "You must accept the terms"),
});

export function SignUp() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        fullName: data.name,       // Rename 'name' to 'fullName'
        email: data.email,
        phoneNumber: data.phone,   // Rename 'phone' to 'phoneNumber'
        address: data.address,
        password: data.password,
        role: 'admin'               // Required by backend
      };

      const response = await axiosInstance.post("/auth/register/user", payload);
      console.log("response", response.data);
      navigate("/auth/sign-in");
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <section className="m-8 flex">
      <div className="w-2/5 hidden lg:block">
        <img
          src="/img/pattern.png"
          className="h-full w-full object-cover rounded-3xl"
          alt="Registration Pattern"
        />
      </div>

      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">
            Join Us Today
          </Typography>
          <Typography
            variant="paragraph"
            color="blue-gray"
            className="text-lg font-normal"
          >
            Enter your email and password to register.
          </Typography>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2"
        >
          <div className="mb-1 flex flex-col gap-6">
            <div>
              <Typography variant="small" className="mb-1 font-medium">
                Your Email
              </Typography>
              <Input
                {...register("email")}
                type="email"
                label="Email"
                placeholder="name@mail.com"
                error={!!errors.email}
              />
              <p className="text-red-500 text-sm">{errors.email?.message}</p>
            </div>

            <div>
              <Typography variant="small" className="mb-1 font-medium">
                Your Name
              </Typography>
              <Input
                {...register("name")}
                type="text"
                label="Name"
                placeholder="John Doe"
                error={!!errors.name}
              />
              <p className="text-red-500 text-sm">{errors.name?.message}</p>
            </div>

            <div>
              <Typography variant="small" className="mb-1 font-medium">
                Your Phone Number
              </Typography>
              <Input
                {...register("phone")}
                type="tel"
                label="Phone"
                placeholder="+212 6 12 34 56 78"
                error={!!errors.phone}
              />
              <p className="text-red-500 text-sm">{errors.phone?.message}</p>
            </div>

            <div>
              <Typography variant="small" className="mb-1 font-medium">
                Your Address
              </Typography>
              <Input
                {...register("address")}
                type="text"
                label="Address"
                placeholder="123 Main St"
                error={!!errors.address}
              />
              <p className="text-red-500 text-sm">{errors.address?.message}</p>
            </div>

            <div>
              <Typography variant="small" className="mb-1 font-medium">
                Your Password
              </Typography>
              <Input
                {...register("password")}
                type="password"
                label="Password"
                placeholder="********"
                error={!!errors.password}
              />
              <p className="text-red-500 text-sm">{errors.password?.message}</p>
            </div>
          </div>

          <div className="mt-4">
            <Checkbox
              {...register("terms")}
              label={
                <Typography variant="small" className="flex items-center">
                  I agree to the&nbsp;
                  <a href="#" className="underline">
                    Terms and Conditions
                  </a>
                </Typography>
              }
              containerProps={{ className: "-ml-2.5" }}
            />
            <p className="text-red-500 text-sm">{errors.terms?.message}</p>
          </div>

          {serverError && (
            <p className="text-red-500 text-sm mt-2">{serverError}</p>
          )}

          <Button type="submit" className="mt-6" fullWidth>
            Register Now
          </Button>

          <Typography
            variant="paragraph"
            className="text-center text-blue-gray-500 font-medium mt-4"
          >
            Already have an account?
            <Link to="/auth/sign-in" className="text-gray-900 ml-1">
              Sign in
            </Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;
