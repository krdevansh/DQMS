import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  role: 'customer' | 'salon' | 'admin' | 'hospital_admin' | 'doctor' | 'patient' | 'school_admin' | 'teacher' | 'student';
  schoolId?: string;
  name?: string;
  phone?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface RegisterBody {
  name?: string;
  salonName?: string;
  email?: string;
  phone: string;
  pin: string;
  role: 'customer' | 'salon' | 'hospital_admin' | 'doctor' | 'patient' | 'school_admin' | 'teacher' | 'student';
}

export interface LoginBody {
  phone: string;
  pin: string;
  role: 'customer' | 'salon' | 'hospital_admin' | 'doctor' | 'patient' | 'school_admin' | 'teacher' | 'student';
}

export interface AdminLoginBody {
  adminId: string;
  password: string;
}
