import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import { Button, Input, Card, LoadingSpinner } from "../../components/ui";
import { FaRoute, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../services/api";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { values, errors, handleChange, handleBlur, isValid, setValues } =
    useFormValidation(
      {
        email: "",
        password: "",
        otp: "",
        rememberMe: false,
        forgotEmail: "",
      },
      {
        email: {
          required: true,
          email: true,
        },
        password: loginMethod === "password" ? {
          required: true,
          minLength: 8,
        } : {},
        otp: loginMethod === "otp" && otpSent ? {
          required: true,
          minLength: 6,
          maxLength: 6,
        } : {},
        forgotEmail: {
          email: true,
        },
      }
    );

  const from = location.state?.from?.pathname || "/dashboard";

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedEmail && rememberMe) {
      setValues(prev => ({
        ...prev,
        email: savedEmail,
        rememberMe: true,
      }));
    }
  }, [setValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    try {
      if (loginMethod === "password") {
        // Password login
        if (values.rememberMe) {
          localStorage.setItem('rememberedEmail', values.email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }

        const result = await login(values.email, values.password);
        if (result.success) {
          navigate(from, { replace: true });
        }
      } else if (loginMethod === "otp" && otpSent) {
        // OTP verification
        const response = await api.post("/auth/verify-otp", {
          email: values.email,
          otp: values.otp,
        });

        if (response.data.success) {
          // Store tokens
          localStorage.setItem("token", response.data.accessToken);
          toast.success("Login successful!");
          navigate(from, { replace: true });
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!values.email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/send-otp", {
        email: values.email,
      });

      if (response.data.success) {
        setOtpSent(true);
        toast.success("OTP sent to your email!");
        
        // Show OTP in development mode
        if (process.env.NODE_ENV === "development" && response.data.otp) {
          toast.success(`Development OTP: ${response.data.otp}`, { duration: 10000 });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!values.forgotEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", {
        email: values.forgotEmail,
      });

      if (response.data.success) {
        toast.success("Password reset link sent to your email!");
        
        // Show reset token in development mode
        if (process.env.NODE_ENV === "development" && response.data.resetToken) {
          toast.success(`Development Reset Token: ${response.data.resetToken}`, { duration: 10000 });
        }
        
        setShowForgotPasswordModal(false);
        setValues(prev => ({ ...prev, forgotEmail: "" }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpSent(false);
    setValues(prev => ({ ...prev, otp: "" }));
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/50 dark:to-gray-900 flex items-center justify-center py-6 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background - Hidden on mobile for performance and cleaner look */}
      <div className="hidden md:block absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex items-center justify-center"
        >
          <div className="w-full">
            <div className="text-center mb-6 hidden md:block">
              <motion.div
                className="flex justify-center mb-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75"></div>
                  <div className="relative bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-lg">
                    <FaRoute className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                AI Trip Planner
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome Back
              </p>
            </div>

            <Card className="p-3 md:p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl">
              {/* Login Method Toggle */}
              <div className="mb-6">
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("password");
                      setOtpSent(false);
                      setValues(prev => ({ ...prev, otp: "" }));
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      loginMethod === "password"
                        ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("otp");
                      setValues(prev => ({ ...prev, password: "" }));
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      loginMethod === "otp"
                        ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    OTP Login
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="Enter email"
                    icon={FaEnvelope}
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                    required
                    className="py-2.5 text-sm"
                  />
                </div>

                {loginMethod === "password" && (
                  <div>
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      label="Password"
                      placeholder="Enter password"
                      icon={FaLock}
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.password}
                      required
                      className="py-2.5 text-sm"
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      }
                    />
                  </div>
                )}

                {loginMethod === "otp" && otpSent && (
                  <div>
                    <Input
                      name="otp"
                      type="text"
                      label="Enter OTP"
                      placeholder="6-digit code"
                      icon={FaLock}
                      value={values.otp}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.otp}
                      required
                      maxLength={6}
                      className="py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                      Resend OTP
                    </button>
                  </div>
                )}

                {loginMethod === "password" && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="rememberMe"
                        name="rememberMe"
                        type="checkbox"
                        checked={values.rememberMe}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="rememberMe"
                        className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                      >
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type={loginMethod === "otp" && !otpSent ? "button" : "submit"}
                  onClick={loginMethod === "otp" && !otpSent ? handleSendOTP : undefined}
                  variant="primary"
                  size="lg"
                  className="w-full mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-md transform active:scale-95 transition-all duration-200 py-3 text-base min-h-[48px]"
                  disabled={!isValid || isLoading || (loginMethod === "password" && !values.password) || (loginMethod === "otp" && otpSent && !values.otp)}
                  loading={isLoading}
                >
                  {isLoading
                    ? loginMethod === "otp" && !otpSent
                      ? "Sending OTP..."
                      : "Signing in..."
                    : loginMethod === "otp" && !otpSent
                    ? "Send OTP"
                    : "Sign in"}
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline p-1"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </Card>
          </div>
        </motion.div>

        {/* Forgot Password Modal */}
        <AnimatePresence mode="wait">
          {showForgotPasswordModal && (
            <motion.div
              key="forgot-password-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowForgotPasswordModal(false)}
            >
              <motion.div
                key="forgot-password-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              >
                <button
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="text-xl" />
                </button>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Forgot Password?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <Input
                  name="forgotEmail"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  icon={FaEnvelope}
                  value={values.forgotEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.forgotEmail}
                  required
                  className="py-2.5 text-sm mb-4"
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleForgotPassword}
                    disabled={!values.forgotEmail || isLoading}
                    loading={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    Send Reset Link
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Login;
