import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Seat, Student, FeeRecord, AttendanceRecord, Enquiry, Notice, LibrarySettings, Testimonial } from '../types';

const DB_FILE = path.join(process.cwd(), 'db.json');
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'library-seat-management';
const MONGODB_DOC_ID = 'main';

let cachedData: DBData | null = null;
let useMongo = false;
let mongoSaveQueue = Promise.resolve();

const appDataSchema = new mongoose.Schema(
  {
    _id: { type: String, default: MONGODB_DOC_ID },
    data: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { collection: 'app_data', timestamps: true, minimize: false }
);

const AppDataModel: any = mongoose.models.AppData || mongoose.model('AppData', appDataSchema);

const formatSeatNumber = (value: any, fallbackIndex: number) => {
  const raw = String(value || '').trim().toUpperCase();
  const numeric = raw.replace(/^S\s*-?\s*/, '').replace(/\D/g, '');
  const safeNumber = numeric || String(fallbackIndex + 1);
  return `S-${safeNumber.padStart(2, '0')}`;
};

export interface DBData {
  admins: { id: string; username: string; passwordHash: string }[];
  seats: Seat[];
  students: Student[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
  enquiries: Enquiry[];
  notices: Notice[];
  testimonials: Testimonial[];
  library_settings: LibrarySettings;
}

const defaultSettings: LibrarySettings = {
  libraryName: 'New Bright Future Library',
  logo: 'https://i.ibb.co/RGnbLxL0/Gemini-Generated-Image-deqoepdeqoepdeqo-1.png',
  address: 'Grover Market, Near Tibbat Market, Hisar, Haryana',
  contactNumber: '+91 97287 13127',
  whatsapp: '+91 97287 13127',
  email: 'info@brightfuturelibrary.com',
  website: 'www.brightfuturelibrary.com',
  googleMapsLocation: 'https://share.google/mHtoVrAe4sliDlg15',
  openingTime: '07:00 AM',
  closingTime: '08:00 PM',
  facilities: [
    'Free WiFi',
    'Full AC Reading Hall',
    'RO Water',
    'Newspaper',
    'Lunch Room',
    'Free Parking Area'
  ],
  facebook: 'https://facebook.com/brightfuturelibrary',
  twitter: 'https://twitter.com/brightfuturelibrary',
  instagram: 'https://instagram.com/brightfuturelibrary'
};

const defaultNotices: Notice[] = [
  {
    id: 'notice-1',
    title: 'Admission Open for July Batch',
    content: 'We are accepting admissions for the July session. Reserve your premium cabins or corner seats before June 25th to secure a 10% early-bird discount on monthly packages.',
    date: '2026-06-08'
  },
  {
    id: 'notice-2',
    title: 'Power Maintenance Schedule',
    content: 'Please note that scheduled generator testing will take place this Sunday (June 14th) between 2:00 PM and 3:00 PM. High-speed backup power will supply lights and essential routers, but please plan high-intensity downloads accordingly.',
    date: '2026-06-09'
  },
  {
    id: 'notice-3',
    title: 'Drinking Water Purifier Upgraded',
    content: 'We have installed a brand new RO water purification system in the common pantry with hot and cold options. Please keep the dispensing area clean.',
    date: '2026-06-10'
  }
];

const defaultSeats: Seat[] = Array.from({ length: 103 }, (_, i) => {
  const seatNo = String(i + 1).padStart(2, '0');
  const floorMatch = i < 40 ? 'Ground Floor' : i < 80 ? '1st Floor' : '2nd Floor';
  const type: Seat['seatType'] = 'Dynamic Seat';
  let status: Seat['status'] = 'Available';

  return {
    id: `seat-s${seatNo}`,
    seatNumber: `S-${seatNo}`,
    floor: floorMatch,
    seatType: type,
    status
  };
});

const defaultStudents: Student[] = [
  {
    id: 'std-1001',
    fullName: 'Rahul Sharma',
    fatherName: 'Sanjay Sharma',
    mobile: '9876501234',
    email: 'rahul.sharma@gmail.com',
    address: 'H.No. 124, Sector 13, Hisar, Haryana',
    aadhaar: '1234-5678-9012',
    seatNumber: 'S-02',
    seatType: 'Full Day Seat',
    shift: 'Full Day',
    joiningDate: '2026-05-01',
    endDate: '2026-06-12',
    profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop',
    feeAmount: 750,
    feeStatus: 'Paid',
    dueDate: '2026-07-01',
    status: 'Active'
  }
];

const defaultFees: FeeRecord[] = [
  {
    id: 'fee-1',
    studentId: 'std-1001',
    studentName: 'Rahul Sharma',
    amount: 750,
    month: 'May 2026',
    paymentDate: '2026-05-02',
    paymentMode: 'UPI',
    status: 'Paid'
  },
  {
    id: 'fee-2',
    studentId: 'std-1001',
    studentName: 'Rahul Sharma',
    amount: 750,
    month: 'June 2026',
    paymentDate: '2026-06-01',
    paymentMode: 'Cash',
    status: 'Paid'
  }
];

const defaultAttendance: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentId: 'std-1001',
    studentName: 'Rahul Sharma',
    date: '2026-06-10',
    checkIn: '08:15',
    checkOut: '14:30',
    status: 'Present'
  }
];

const defaultEnquiries: Enquiry[] = [
  {
    id: 'enq-1',
    name: 'Vikram Grover',
    mobile: '9898989898',
    message: 'Hello, I want to join the morning slot. Is an AC cabin available on the 1st floor?',
    date: '2026-06-08T10:45:00Z'
  },
  {
    id: 'enq-2',
    name: 'Megha Gupta',
    mobile: '9797979797',
    message: 'What are the charges for a daily trial slot? Do you have high-speed private WiFi?',
    date: '2026-06-09T14:15:00Z'
  }
];

const defaultTestimonials: Testimonial[] = [
  {
    id: 't-1',
    name: 'Vikram Rathore',
    view: 'Bright Future Library is the best study space in Hisar. The pin drop silence and fully air-conditioned cabins helped me clear my SBI PO exam!',
    date: '2026-05-15',
    rating: 5
  },
  {
    id: 't-2',
    name: 'Priya Saini',
    view: 'Bahut hi badhiya environment hai, comfortable seating chairs aur high speed internet hai! Highly recommended for all competitive exam candidates.',
    date: '2026-06-01',
    rating: 5
  },
  {
    id: 't-3',
    name: 'Amit Yadav',
    view: 'A quiet place with zero distractions. The manager is very supportive and ensures complete silence in all slot categories. Cleared my SSC exam studying here.',
    date: '2026-06-07',
    rating: 5
  }
];

export function initDB(): DBData {
  if (fs.existsSync(DB_FILE)) {
    try {
      const info = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(info);
      let hasChanges = false;

      // Ensure we have admins and settings
      if (!data.admins || data.admins.length === 0) {
        data.admins = [{
          id: 'admin-1',
          username: 'admin',
          passwordHash: bcrypt.hashSync('admin', 10)
        }];
        hasChanges = true;
      }

      // Ensure we have a seats array and it has valid length
      if (!data.seats || data.seats.length <= 1) {
        data.seats = defaultSeats;
        hasChanges = true;
      } else {
        // Seats are dynamic; the assigned student's shift decides Full Day or Half Day usage.
        data.seats.forEach((seat: any, index: number) => {
          const normalizedSeatNumber = formatSeatNumber(seat.seatNumber, index);
          if (seat.seatNumber !== normalizedSeatNumber) {
            const oldSeatNumber = seat.seatNumber;
            seat.seatNumber = normalizedSeatNumber;
            if (data.students) {
              data.students.forEach((student: any) => {
                if (student.seatNumber === oldSeatNumber) {
                  student.seatNumber = normalizedSeatNumber;
                }
              });
            }
            hasChanges = true;
          }
          if (seat.seatType !== 'Dynamic Seat') {
            seat.seatType = 'Dynamic Seat';
            hasChanges = true;
          }
          if (![
            'Available',
            'Morning Assigned',
            'Evening Assigned',
            'Full Day Assigned',
            'Morning + Evening Assigned'
          ].includes(seat.status)) {
            seat.status = 'Available';
            hasChanges = true;
          }
        });
      }

      // Ensure students have all properties like seatType, shift, feeStatus, dueDate
      if (data.students) {
        data.students.forEach((s: any) => {
          if (!s.seatType) {
            s.seatType = s.feeAmount <= 650 ? 'Half Day Seat' : 'Full Day Seat';
            hasChanges = true;
          }
          if (!s.shift) {
            s.shift = s.seatType === 'Half Day Seat' ? 'Morning Shift' : 'Full Day';
            hasChanges = true;
          }
          if (!s.feeStatus) {
            s.feeStatus = 'Paid';
            hasChanges = true;
          }
          if (!s.dueDate) {
            s.dueDate = '2026-07-01';
            hasChanges = true;
          }
        });
      }

      // Update contact numbers if they were default placeholders
      if (data.library_settings) {
        if (data.library_settings.contactNumber === '+91 98765 43210') {
          data.library_settings.contactNumber = '+91 97287 13127';
          hasChanges = true;
        }
        if (data.library_settings.whatsapp === '+91 98765 43210') {
          data.library_settings.whatsapp = '+91 97287 13127';
          hasChanges = true;
        }
        if (!data.library_settings.logo || data.library_settings.logo === '📚') {
          data.library_settings.logo = 'https://i.ibb.co/RGnbLxL0/Gemini-Generated-Image-deqoepdeqoepdeqo-1.png';
          hasChanges = true;
        }
      }

      // Ensure we have testimonials array
      if (!data.testimonials) {
        data.testimonials = defaultTestimonials;
        hasChanges = true;
      }

      if (hasChanges) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      }
      return data;
    } catch (e) {
      console.error("Error reading database file, resetting to default...", e);
    }
  }

  // Create a default file
  const initialData: DBData = {
    admins: [{
      id: 'admin-1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin', 10)
    }],
    seats: defaultSeats,
    students: defaultStudents,
    fees: defaultFees,
    attendance: defaultAttendance,
    enquiries: defaultEnquiries,
    notices: defaultNotices,
    testimonials: defaultTestimonials,
    library_settings: defaultSettings
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

export function saveDB(data: DBData) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function initMongoDB(): Promise<DBData> {
  if (!MONGODB_URI) {
    useMongo = false;
    cachedData = initDB();
    console.log(`Using local JSON database: ${DB_FILE}`);
    return cachedData;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10000
    });

    useMongo = true;
    const existing = await AppDataModel.findById(MONGODB_DOC_ID).lean();

    if (existing?.data) {
      cachedData = existing.data as DBData;
    } else {
      cachedData = fs.existsSync(DB_FILE) ? initDB() : {
        admins: [{
          id: 'admin-1',
          username: 'admin',
          passwordHash: bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'admin', 10)
        }],
        seats: defaultSeats,
        students: defaultStudents,
        fees: defaultFees,
        attendance: defaultAttendance,
        enquiries: defaultEnquiries,
        notices: defaultNotices,
        testimonials: defaultTestimonials,
        library_settings: defaultSettings
      };

      await AppDataModel.findByIdAndUpdate(
        MONGODB_DOC_ID,
        { _id: MONGODB_DOC_ID, data: cachedData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`Connected to MongoDB database: ${MONGODB_DB_NAME}`);
    return cachedData;
  } catch (error) {
    console.error('MongoDB connection failed. Falling back to local db.json.', error);
    useMongo = false;
    cachedData = initDB();
    return cachedData;
  }
}

export async function closeMongoDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

export const dbStore = {
  init: () => initMongoDB(),
  get: () => {
    if (!cachedData) {
      cachedData = initDB();
    }
    return cachedData;
  },
  save: (data: DBData) => {
    cachedData = data;

    if (!useMongo) {
      saveDB(data);
      return;
    }

    mongoSaveQueue = mongoSaveQueue
      .then(() => AppDataModel.findByIdAndUpdate(
        MONGODB_DOC_ID,
        { _id: MONGODB_DOC_ID, data },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ))
      .then(() => undefined)
      .catch((error) => {
        console.error('Failed to save data to MongoDB.', error);
      });
  },
  isMongoEnabled: () => useMongo
};
