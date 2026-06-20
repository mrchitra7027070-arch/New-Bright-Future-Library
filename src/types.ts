export type SeatType = 'Dynamic Seat' | 'Full Day Seat' | 'Half Day Seat' | 'Normal' | 'Premium' | 'Cabin' | 'AC Cabin';
export type SeatStatus = 'Available' | 'Morning Assigned' | 'Evening Assigned' | 'Full Day Assigned' | 'Morning + Evening Assigned';

export interface Seat {
  id: string; // unique ID
  seatNumber: string;
  floor: string;
  seatType: SeatType;
  status: SeatStatus;
}

export type StudentStatus = 'Active' | 'Inactive';
export type StudentShift = 'Full Day' | 'Morning Shift' | 'Evening Shift';
export type StudentFeeStatus = 'Paid' | 'Pending';

export interface Student {
  id: string; // STU-XXXX format
  fullName: string;
  fatherName: string;
  mobile: string;
  email: string;
  address: string;
  aadhaar: string;
  seatNumber: string; // references seatNumber or '' if unassigned
  seatType: 'Dynamic Seat' | 'Full Day Seat' | 'Half Day Seat';
  shift: StudentShift;
  joiningDate: string; // YYYY-MM-DD
  endDate?: string;
  profilePhoto: string;
  feeAmount: number; // Monthly Fee
  feeStatus: StudentFeeStatus; // Paid or Pending
  dueDate: string; // YYYY-MM-DD
  status: StudentStatus;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer';
export type FeeStatus = 'Paid' | 'Pending' | 'Overdue';

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  month: string; // e.g. "January 2026"
  paymentDate: string; // YYYY-MM-DD or ''
  paymentMode: PaymentMode;
  status: FeeStatus;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM or ''
  checkOut: string; // HH:MM or ''
  status: 'Present' | 'Absent';
}

export interface Enquiry {
  id: string;
  name: string;
  mobile: string;
  message: string;
  date: string; // ISO date / readable
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
}

export interface Testimonial {
  id: string;
  name: string;
  view: string;
  date: string; // YYYY-MM-DD
  rating: number;
}

export interface LibrarySettings {
  libraryName: string;
  logo: string;
  address: string;
  contactNumber: string;
  whatsapp: string;
  email: string;
  website: string;
  googleMapsLocation: string; // iframe map url or text
  openingTime: string;
  closingTime: string;
  facilities: string[];
  facebook: string;
  twitter: string;
  instagram: string;
}
