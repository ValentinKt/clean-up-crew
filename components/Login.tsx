import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

// --- SVG Icons ---
const MailIcon = () => <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>;
const LockIcon = () => <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const EyeIcon = ({ Slashed }: { Slashed: boolean }) => Slashed ? <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.14 2.14" /></svg> : <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const KeyIcon = () => <svg className="w-16 h-16 text-teal-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
const EmailSentIcon = () => <svg className="w-16 h-16 text-teal-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
const LoadingSpinner = () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (isRegistering) {
      checkPasswordStrength(password);
    }
  }, [password, isRegistering]);

  useEffect(() => {
    // Load remember me preference from localStorage (default true)
    const stored = localStorage.getItem('rememberMe');
    if (stored === 'false') setRememberMe(false);
  }, []);

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    setPasswordStrength(score);
  };
  
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegistering) {
        // Basic email and password validations
        if (!email || !password) {
            setError('Please enter your email and password.');
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        if (passwordStrength < 3) { // Require 'Good' strength
            setError('Please choose a stronger password.');
            setLoading(false);
            return;
        }
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: 'New User', // Default name, can be changed in profile
                    avatar_url: `https://i.pravatar.cc/150?u=${email}`
                }
            }
        });
        
        if (error) {
            setError(error.message);
        } else if (data.user) {
            setIsVerifying(true);
            // Persist remember me preference to localStorage
            localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
        }
    } else { // Logging in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
      // Save remember me preference (used by App for session handling semantics)
      localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
      // onAuthStateChange in App.tsx will handle successful login
    }
    setLoading(false);
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        setError('Please enter your email address.');
        return;
    }
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });

    if (error) {
        setError(error.message);
    } else {
        setIsResetSent(true);
        setIsForgotPassword(false);
    }
    setLoading(false);
  };

  const renderVerificationScreen = () => (
    <div className="text-center p-8 flex flex-col items-center justify-center">
        <EmailSentIcon />
        <h2 className="text-2xl font-bold text-teal-800 mt-4 mb-2">Verify Your Email</h2>
        <p className="text-gray-600 mb-6 max-w-sm">A verification link has been sent to <span className="font-semibold text-teal-700">{email}</span>. Please click the link to complete your registration.</p>
        <button
            onClick={() => { setIsVerifying(false); setIsRegistering(false); }}
            className="w-full max-w-sm mt-6 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 transform hover:scale-105"
        >
            Back to Login
        </button>
    </div>
  );
  
  const renderForgotPasswordScreen = () => (
    <div className="p-8">
        <div className="text-center">
            <KeyIcon />
            <h2 className="text-2xl font-bold text-teal-800 mt-4 mb-2">Reset Your Password</h2>
            <p className="text-gray-600 mb-6">Enter your email and we'll send you instructions to reset your password.</p>
        </div>
        <form className="space-y-4" onSubmit={handlePasswordReset}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MailIcon /></div>
                <input 
                    id="email-address-reset" 
                    name="email" 
                    type="email" 
                    required 
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" 
                    placeholder="Email address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
                >
                    {loading && <LoadingSpinner />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </div>
        </form>
        <button
            onClick={() => { setIsForgotPassword(false); setError(''); }}
            className="w-full mt-4 text-sm font-medium text-center text-teal-600 hover:text-teal-500"
        >
            Back to Login
        </button>
    </div>
  );
  
  const renderResetSentScreen = () => (
    <div className="text-center p-8 flex flex-col items-center justify-center">
        <EmailSentIcon />
        <h2 className="text-2xl font-bold text-teal-800 mt-4 mb-2">Check Your Email</h2>
        <p className="text-gray-600 mb-6 max-w-sm">A password reset link has been sent to <span className="font-semibold text-teal-700">{email}</span>. Please click the link to complete the process.</p>
        <button
            onClick={() => { setIsResetSent(false); }}
            className="w-full max-w-sm mt-6 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 transform hover:scale-105"
        >
            Back to Login
        </button>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1536968319159-478a29359489?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=2000&fit=max&auto=format')"}}>
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full bg-white rounded-lg shadow-2xl overflow-hidden animate-fade-in">
        <div className="hidden md:flex flex-col justify-center p-12 bg-teal-600 text-white bg-cover" style={{backgroundImage: "url('https://images.unsplash.com/photo-1618481187862-904021f56177?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&fit=max&auto=format')"}}>
           <div className="relative z-10 bg-teal-700/50 p-6 rounded-lg backdrop-blur-sm">
            <h2 className="text-3xl font-bold leading-tight">Join the Movement</h2>
            <p className="mt-4 opacity-90">Become part of a global community dedicated to cleaning our planet. Your actions make a world of difference.</p>
           </div>
        </div>
        
        <div className="p-8">
        { isVerifying ? renderVerificationScreen() : 
          isResetSent ? renderResetSentScreen() :
          isForgotPassword ? renderForgotPasswordScreen() : (
            <>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-teal-600">Eco-Cleanup Crew</h1>
                    <p className="mt-2 text-gray-500">{isRegistering ? 'Create an account to start making a difference' : 'Welcome back, environmental hero!'}</p>
                </div>
                
                <form className="space-y-4" onSubmit={handleSubmit} aria-describedby={error ? 'auth-error' : undefined}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MailIcon /></div>
                        <input id="email-address" name="email" type="email" required aria-invalid={!!error} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockIcon /></div>
                        <input id="password" name="password" type={showPassword ? 'text' : 'password'} required aria-invalid={!!error} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-teal-600"><EyeIcon Slashed={showPassword} /></button>
                    </div>

                    {!isRegistering && (
                         <div className="text-right -mt-2">
                            <button 
                                type="button" 
                                onClick={() => { setIsForgotPassword(true); setIsRegistering(false); setError(''); }} 
                                className="font-medium text-sm text-teal-600 hover:text-teal-500"
                            >
                                Forgot your password?
                            </button>
                        </div>
                    )}
                    {!isRegistering && (
                        <div className="flex items-center justify-between mt-2">
                          <label className="inline-flex items-center">
                            <input type="checkbox" id="remember-me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                            <span className="ml-2 text-sm text-gray-700">Remember me</span>
                          </label>
                        </div>
                    )}
                   
                    {isRegistering && (
                        <div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div className={`h-2 rounded-full transition-all duration-300 ${strengthColors[passwordStrength-1] || 'bg-gray-200'}`} style={{ width: `${passwordStrength * 25}%` }}></div>
                            </div>
                             <div className="text-right text-xs font-semibold text-gray-500 mt-1 pr-1">
                                <span>{strengthLabels[passwordStrength-1] || ''}</span>
                            </div>
                        </div>
                    )}

                    {isRegistering && (
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockIcon /></div>
                          <input id="confirm-password" name="confirm-password" type="password" required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    )}

                    {error && <p id="auth-error" role="alert" aria-live="assertive" className="text-red-500 text-sm text-center">{error}</p>}
                    
                    <div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait">
                            {loading && <LoadingSpinner />}
                            {loading ? (isRegistering ? 'Creating...' : 'Signing In...') : (isRegistering ? 'Create Account' : 'Sign in')}
                        </button>
                    </div>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-xs text-gray-500">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div>
                     <button type="button" className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <img src="https://www.google.com/favicon.ico" alt="Google icon" className="w-5 h-5 mr-2" />
                        Continue with Google
                    </button>
                </div>
                
                <div className="text-center mt-6">
                    <button onClick={() => { setIsRegistering(!isRegistering); setError(''); setPassword(''); }} className="font-medium text-sm text-teal-600 hover:text-teal-500">
                        {isRegistering ? 'Already have an account? Sign in' : 'Don\'t have an account? Register'}
                    </button>
                </div>
            </>
        )}
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Login;
