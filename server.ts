import "dotenv/config";
import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { dbStore } from "./src/server/db.js";
import { Seat, Student, FeeRecord, AttendanceRecord, Enquiry, Notice, LibrarySettings } from "./src/types";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const JWT_SECRET = process.env.JWT_SECRET || "library-seat-secret-key-123";

app.use(express.json());

const formatSeatNumber = (value: any) => {
  const raw = String(value || '').trim().toUpperCase();
  const numeric = raw.replace(/^S\s*-?\s*/, '').replace(/\D/g, '');
  if (!numeric) return '';
  return `S-${numeric.padStart(2, '0')}`;
};

// Token verification middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

/* ==========================================================================
   PUBLIC VISITOR ENDPOINTS
   ========================================================================== */

// Get library settings
app.get("/api/settings", (req, res) => {
  try {
    const db = dbStore.get();
    res.json(db.library_settings);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get notices
app.get("/api/notices", (req, res) => {
  try {
    const db = dbStore.get();
    // Return sorted notices by date descending
    const sorted = [...db.notices].sort((a, b) => b.date.localeCompare(a.date));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Public live statistics
app.get("/api/stats", (req, res) => {
  try {
    const db = getManagedDb();

    const total = db.seats.length;
    const occupied = db.seats.filter((s: any) => s.status !== 'Available').length;
    const reserved = db.seats.filter((s: any) => s.status === 'Morning Assigned' || s.status === 'Evening Assigned').length;
    const available = db.seats.filter((s: any) => s.status === 'Available').length;

    const { availableFullDaySeats, availableHalfDaySeats, availableMorningSlots, availableEveningSlots } = getSeatAvailability(db);

    res.json({
      totalSeats: total,
      occupiedSeats: occupied,
      reservedSeats: reserved,
      availableSeats: available,
      availableFullDaySeats,
      availableHalfDaySeats,
      availableMorningSlots,
      availableEveningSlots
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Secure Public Dynamic Seat List (returns seat registry layout with anonymous allocation metadata)
app.get("/api/public-seats", (req, res) => {
  try {
    const db = getManagedDb();

    const result = db.seats.map((seat: any) => {
      const actives = db.students.filter((s: any) => s.seatNumber === seat.seatNumber && s.status === 'Active');
      const hasMorning = actives.some((s: any) => s.shift === 'Morning Shift');
      const hasEvening = actives.some((s: any) => s.shift === 'Evening Shift');
      const hasFullDay = actives.some((s: any) => s.shift === 'Full Day');

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        floor: seat.floor,
        seatType: seat.seatType,
        status: seat.status,
        isMorningBooked: hasMorning || hasFullDay,
        isEveningBooked: hasEvening || hasFullDay,
        isFullDayBooked: hasFullDay,
        hasOccupants: actives.length > 0
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error loading public seats" });
  }
});

// Create inquiry
app.post("/api/enquiries", (req, res) => {
  try {
    const { name, mobile, message } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ error: "Name and mobile number are required" });
    }

    const db = dbStore.get();
    const newEnquiry: Enquiry = {
      id: `enq-${Date.now()}`,
      name,
      mobile,
      message: message || "",
      date: new Date().toISOString()
    };

    db.enquiries.push(newEnquiry);
    dbStore.save(db);

    res.status(201).json({ success: true, enquiry: newEnquiry });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Testimonials Endpoints (achievers say view)
app.get("/api/testimonials", (req, res) => {
  try {
    const db = dbStore.get();
    const list = db.testimonials || [];
    // Sort by newest date first
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/testimonials", (req, res) => {
  try {
    const { name, view, rating } = req.body;
    if (!name || !view) {
      return res.status(400).json({ error: "Name and view content are required" });
    }

    const db = dbStore.get();
    if (!db.testimonials) {
      db.testimonials = [];
    }

    const newTestimonial = {
      id: `t-${Date.now()}`,
      name: name.toString().trim(),
      view: view.toString().trim(),
      date: new Date().toISOString().split('T')[0],
      rating: Number(rating) || 5
    };

    db.testimonials.push(newTestimonial);
    dbStore.save(db);

    res.status(201).json({ success: true, testimonial: newTestimonial });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/testimonials/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = dbStore.get();
    if (!db.testimonials) {
      db.testimonials = [];
    }

    const index = db.testimonials.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    db.testimonials.splice(index, 1);
    dbStore.save(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/testimonials/clear-all", authenticateToken, (req, res) => {
  try {
    const db = dbStore.get();
    db.testimonials = [];
    dbStore.save(db);
    res.json({ success: true, message: "All achiever feed and testimonial reviews cleared successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear testimonial reviews." });
  }
});

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

// Admin Auth
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const db = dbStore.get();
    const admin = db.admins.find(a => a.username.toLowerCase() === username.toLowerCase());

    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const validPassword = bcrypt.compareSync(password, admin.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: { id: admin.id, username: admin.username } });
  } catch (error) {
    res.status(500).json({ error: "Auth failed" });
  }
});

// Verify Auth Token
app.get("/api/auth/verify", authenticateToken, (req: any, res) => {
  res.json({ success: true, user: req.user });
});

/* ==========================================================================
   ADMIN SECURE ENDPOINTS
   ========================================================================== */

// Admin Dashboard stats
app.get("/api/admin/dashboard-stats", authenticateToken, (req, res) => {
  try {
    const db = getManagedDb();
    
    // Seats
    const totalSeats = db.seats.length;
    const availableSeats = db.seats.filter(s => s.status === 'Available').length;
    const occupiedSeats = db.seats.filter(s => s.status !== 'Available').length;
    const reservedSeats = db.seats.filter(s => s.status === 'Morning Assigned' || s.status === 'Evening Assigned').length;

    // Students
    const totalStudents = db.students.length;
    const activeStudents = db.students.filter(s => s.status === 'Active').length;
    const inactiveStudents = db.students.filter(s => s.status === 'Inactive').length;

    // Calculate shift segment metrics
    const fullDayStudents = db.students.filter(s => s.status === 'Active' && s.shift === 'Full Day').length;
    const halfDayStudents = db.students.filter(s => s.status === 'Active' && (s.shift === 'Morning Shift' || s.shift === 'Evening Shift')).length;

    // Fees info: pending fees calculated from Student profile status directly of Active members
    const pendingFees = db.students
      .filter(s => s.status === 'Active' && s.feeStatus === 'Pending')
      .reduce((sum, s) => sum + s.feeAmount, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    const currentYearPrefix = todayStr.substring(0, 4); // YYYY

    // Today's Attendance
    const todayAttendanceCount = db.attendance.filter(a => a.date === todayStr && a.status === 'Present').length;

    let todayCollection = 0;
    let monthlyCollection = 0;
    let yearlyCollection = 0;

    db.fees.forEach(f => {
      if (f.status === 'Paid' && f.paymentDate) {
        if (f.paymentDate === todayStr) {
          todayCollection += f.amount;
        }
        if (f.paymentDate.startsWith(currentMonthPrefix)) {
          monthlyCollection += f.amount;
        }
        if (f.paymentDate.startsWith(currentYearPrefix)) {
          yearlyCollection += f.amount;
        }
      }
    });

    // Lists for helper widgets
    const pendingFeeList = db.students
      .filter(s => s.status === 'Active' && s.feeStatus === 'Pending')
      .map(s => {
        return {
          id: `f-${s.id}`,
          studentId: s.id,
          studentName: s.fullName,
          amount: s.feeAmount,
          dueDate: s.dueDate,
          studentMobile: s.mobile,
          status: 'Pending'
        };
      });

    res.json({
      totalSeats,
      availableSeats,
      occupiedSeats,
      reservedSeats,
      totalStudents,
      activeStudents,
      inactiveStudents,
      fullDayStudents,
      halfDayStudents,
      pendingFees,
      todayAttendance: todayAttendanceCount,
      todayCollection,
      monthlyCollection,
      yearlyCollection,
      pendingFeeList
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
});

/* --- SEATS CRUD --- */
app.get("/api/admin/seats", authenticateToken, (req, res) => {
  try {
    const db = getManagedDb();
    res.json(db.seats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch seats" });
  }
});

app.post("/api/admin/seats", authenticateToken, (req, res) => {
  try {
    const { floor, status } = req.body;
    const normalizedSeatNumber = formatSeatNumber(req.body.seatNumber);
    if (!normalizedSeatNumber || !floor) {
      return res.status(400).json({ error: "Missing required seat parameters" });
    }

    const db = dbStore.get();

    // Check duplicate
    if (db.seats.some(s => s.seatNumber.toLowerCase() === normalizedSeatNumber.toLowerCase())) {
      return res.status(400).json({ error: `Seat with number ${normalizedSeatNumber} already exists` });
    }

    const newSeat: Seat = {
      id: `seat-${Date.now()}`,
      seatNumber: normalizedSeatNumber,
      floor,
      seatType: 'Dynamic Seat',
      status: status || 'Available'
    };

    db.seats.push(newSeat);
    normalizeDbState(db);
    dbStore.save(db);
    res.status(201).json(newSeat);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/admin/seats/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { floor, status } = req.body;
    const normalizedSeatNumber = req.body.seatNumber !== undefined ? formatSeatNumber(req.body.seatNumber) : "";

    const db = dbStore.get();
    const index = db.seats.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Seat not found" });
    }

    const oldSeatNumber = db.seats[index].seatNumber;

    // Check duplicate if seatNumber is changing
    if (req.body.seatNumber !== undefined && !normalizedSeatNumber) {
      return res.status(400).json({ error: "Seat number must contain digits, for example 02 for S-02." });
    }

    if (normalizedSeatNumber && db.seats[index].seatNumber !== normalizedSeatNumber) {
      if (db.seats.some(s => s.seatNumber.toLowerCase() === normalizedSeatNumber.toLowerCase())) {
        return res.status(400).json({ error: "Seat number already occupied" });
      }
    }

    const nextSeatNumber = normalizedSeatNumber || db.seats[index].seatNumber;

    const updated: Seat = {
      ...db.seats[index],
      seatNumber: nextSeatNumber,
      floor: floor || db.seats[index].floor,
      seatType: 'Dynamic Seat',
      status: status || db.seats[index].status
    };

    db.seats[index] = updated;
    if (normalizedSeatNumber && nextSeatNumber !== oldSeatNumber) {
      db.students.forEach((student: any) => {
        if (student.seatNumber === oldSeatNumber) {
          student.seatNumber = nextSeatNumber;
        }
      });
    }
    normalizeDbState(db);
    dbStore.save(db);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/seats/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = dbStore.get();
    const index = db.seats.findIndex(s => s.id === id);

    if (index === -1) return res.status(404).json({ error: "Seat not found" });

    // Check if seat is currently assigned to a student
    const seat = db.seats[index];
    const hasStudent = db.students.some(s => s.seatNumber === seat.seatNumber && s.status === 'Active');
    if (hasStudent) {
      return res.status(400).json({ error: "Cannot delete seat while it is assigned to an active student" });
    }

    db.seats.splice(index, 1);
    normalizeDbState(db);
    dbStore.save(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/seats/clear-all", authenticateToken, (req, res) => {
  try {
    const db = dbStore.get();
    
    // Reset non-empty seat numbers of students to avoid stale associations
    db.students.forEach(s => {
      s.seatNumber = "";
    });
    
    db.seats = [];
    normalizeDbState(db);
    dbStore.save(db);
    res.json({ success: true, message: "All seats cleared successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear all seats" });
  }
});

app.post("/api/admin/seats/reset-to-103", authenticateToken, (req, res) => {
  try {
    const db = dbStore.get();
    
    // Generate exactly S-01 to S-103 seats
    const newSeats: Seat[] = Array.from({ length: 103 }, (_, i) => {
      const seatNo = String(i + 1).padStart(2, '0');
      const floorMatch = i < 40 ? 'Ground Floor' : i < 80 ? '1st Floor' : '2nd Floor';
      const type: Seat['seatType'] = 'Dynamic Seat';
      return {
        id: `seat-s${seatNo}`,
        seatNumber: `S-${seatNo}`,
        floor: floorMatch,
        seatType: type,
        status: 'Available' as const
      };
    });

    db.seats = newSeats;
    syncSeatStatuses(db);
    dbStore.save(db);

    res.json({ success: true, message: "Successfully populated exactly 103 standard seats layout." });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset seats to 103" });
  }
});

app.post("/api/admin/seats/generate-floor-wise", authenticateToken, (req, res) => {
  try {
    const { groundCount, firstCount, secondCount } = req.body;
    
    const gNum = parseInt(groundCount, 10);
    const fNum = parseInt(firstCount, 10);
    const sNum = parseInt(secondCount, 10);

    if (isNaN(gNum) || isNaN(fNum) || isNaN(sNum) || gNum < 0 || fNum < 0 || sNum < 0) {
      return res.status(400).json({ error: "Please provide valid seat counts for all floors." });
    }

    const db = dbStore.get();
    const newSeats: Seat[] = [];
    let seatIndex = 1;

    // Ground Floor
    for (let i = 0; i < gNum; i++) {
      const seatNo = String(seatIndex++).padStart(2, '0');
      newSeats.push({
        id: `seat-s${seatNo}`,
        seatNumber: `S-${seatNo}`,
        floor: 'Ground Floor',
        seatType: 'Dynamic Seat',
        status: 'Available'
      });
    }

    // 1st Floor
    for (let i = 0; i < fNum; i++) {
      const seatNo = String(seatIndex++).padStart(2, '0');
      newSeats.push({
        id: `seat-s${seatNo}`,
        seatNumber: `S-${seatNo}`,
        floor: '1st Floor',
        seatType: 'Dynamic Seat',
        status: 'Available'
      });
    }

    // 2nd Floor
    for (let i = 0; i < sNum; i++) {
      const seatNo = String(seatIndex++).padStart(2, '0');
      newSeats.push({
        id: `seat-s${seatNo}`,
        seatNumber: `S-${seatNo}`,
        floor: '2nd Floor',
        seatType: 'Dynamic Seat',
        status: 'Available'
      });
    }

    db.seats = newSeats;
    syncSeatStatuses(db);
    dbStore.save(db);

    res.json({ success: true, message: `Successfully generated ${newSeats.length} seats floor-wise.` });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate floor-wise seats" });
  }
});

/* --- STUDENTS CRUD --- */
/* --- STUDENTS CRUD HELPERS --- */
const syncSeatStatuses = (db: any) => {
  db.seats.forEach((seat: any) => {
    // Find all active students currently assigned to this seat
    const actives = db.students.filter((s: any) => s.seatNumber === seat.seatNumber && s.status === 'Active');
    
    const hasFullDay = actives.some((s: any) => s.shift === 'Full Day');
    const hasMorning = actives.some((s: any) => s.shift === 'Morning Shift');
    const hasEvening = actives.some((s: any) => s.shift === 'Evening Shift');

    if (hasFullDay) {
      seat.status = 'Full Day Assigned';
    } else if (hasMorning && hasEvening) {
      seat.status = 'Morning + Evening Assigned';
    } else if (hasMorning) {
      seat.status = 'Morning Assigned';
    } else if (hasEvening) {
      seat.status = 'Evening Assigned';
    } else {
      seat.status = 'Available';
    }
  });
};

const normalizeShift = (shift: any): Student['shift'] => {
  if (shift === 'Morning Shift') return 'Morning Shift';
  if (shift === 'Evening Shift') return 'Evening Shift';
  return 'Full Day';
};

const normalizeStudentFeeStatus = (status: any): Student['feeStatus'] => {
  return status === 'Paid' ? 'Paid' : 'Pending';
};

const normalizeFeeStatus = (status: any): FeeRecord['status'] => {
  if (status === 'Paid' || status === 'Overdue') return status;
  return 'Pending';
};

const syncFeeRecordsWithStudents = (db: any) => {
  db.fees.forEach((fee: any) => {
    const student = db.students.find((s: any) => s.id === fee.studentId);
    if (student) {
      fee.studentName = student.fullName;
      fee.amount = Number(fee.amount) || Number(student.feeAmount) || 0;
    } else {
      fee.amount = Number(fee.amount) || 0;
    }
    fee.paymentMode = fee.paymentMode || 'Cash';
    fee.paymentDate = fee.paymentDate || '';
    fee.status = normalizeFeeStatus(fee.status);
  });

  db.students.forEach((student: any) => {
    const relatedFees = db.fees.filter((fee: any) => fee.studentId === student.id);
    if (relatedFees.length === 0) {
      student.feeStatus = normalizeStudentFeeStatus(student.feeStatus);
      return;
    }
    const latestFee = relatedFees[relatedFees.length - 1];
    student.feeStatus = latestFee.status === 'Paid' ? 'Paid' : 'Pending';
  });
};

const normalizeDbState = (db: any) => {
  db.seats = Array.isArray(db.seats) ? db.seats : [];
  db.students = Array.isArray(db.students) ? db.students : [];
  db.fees = Array.isArray(db.fees) ? db.fees : [];
  db.attendance = Array.isArray(db.attendance) ? db.attendance : [];
  db.enquiries = Array.isArray(db.enquiries) ? db.enquiries : [];
  db.notices = Array.isArray(db.notices) ? db.notices : [];
  db.testimonials = Array.isArray(db.testimonials) ? db.testimonials : [];

  const seatNumberMap = new Map<string, string>();
  const usedSeatNumbers = new Set<string>();

  db.seats.forEach((seat: any, index: number) => {
    const oldSeatNumber = seat.seatNumber;
    let nextSeatNumber = formatSeatNumber(seat.seatNumber) || `S-${String(index + 1).padStart(2, '0')}`;
    let numeric = Number(nextSeatNumber.replace(/\D/g, '')) || index + 1;

    while (usedSeatNumbers.has(nextSeatNumber)) {
      numeric += 1;
      nextSeatNumber = `S-${String(numeric).padStart(2, '0')}`;
    }

    usedSeatNumbers.add(nextSeatNumber);
    seatNumberMap.set(String(oldSeatNumber || ''), nextSeatNumber);
    seat.seatNumber = nextSeatNumber;
    seat.floor = seat.floor || 'Ground Floor';
    seat.seatType = 'Dynamic Seat';
  });

  db.students.forEach((student: any) => {
    const mappedSeat = seatNumberMap.get(String(student.seatNumber || ''));
    student.fullName = String(student.fullName || '').trim();
    student.fatherName = String(student.fatherName || '').trim();
    student.mobile = String(student.mobile || '').trim();
    student.email = String(student.email || '').trim();
    student.address = String(student.address || '').trim();
    student.aadhaar = String(student.aadhaar || '').trim();
    student.seatNumber = mappedSeat || formatSeatNumber(student.seatNumber) || '';
    student.shift = normalizeShift(student.shift);
    student.seatType = student.shift === 'Full Day' ? 'Full Day Seat' : 'Half Day Seat';
    student.joiningDate = student.joiningDate || new Date().toISOString().split('T')[0];
    student.endDate = student.endDate || '';
    student.profilePhoto = student.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop';
    student.feeAmount = Number(student.feeAmount) || (student.shift === 'Full Day' ? 750 : 550);
    student.feeStatus = normalizeStudentFeeStatus(student.feeStatus);
    student.dueDate = student.dueDate || student.joiningDate;
    student.status = student.status === 'Inactive' ? 'Inactive' : 'Active';
  });

  syncFeeRecordsWithStudents(db);
  syncSeatStatuses(db);
  return db;
};

const getManagedDb = () => {
  const db = dbStore.get();
  normalizeDbState(db);
  dbStore.save(db);
  return db;
};

const getSeatAvailability = (db: any) => {
  let availableFullDaySeats = 0;
  let availableHalfDaySeats = 0;
  let availableMorningSlots = 0;
  let availableEveningSlots = 0;

  db.seats.forEach((seat: any) => {
    const actives = db.students.filter((s: any) => s.seatNumber === seat.seatNumber && s.status === 'Active');
    const hasFullDay = actives.some((s: any) => s.shift === 'Full Day');
    const hasMorning = actives.some((s: any) => s.shift === 'Morning Shift');
    const hasEvening = actives.some((s: any) => s.shift === 'Evening Shift');

    if (!hasFullDay && !hasMorning && !hasEvening) {
      availableFullDaySeats += 1;
    }

    const canMorning = !hasFullDay && !hasMorning;
    const canEvening = !hasFullDay && !hasEvening;

    if (canMorning) availableMorningSlots += 1;
    if (canEvening) availableEveningSlots += 1;
    if (canMorning || canEvening) availableHalfDaySeats += 1;
  });

  return { availableFullDaySeats, availableHalfDaySeats, availableMorningSlots, availableEveningSlots };
};

const generateStudentId = (db: any): string => {
  let highest = 1000;
  db.students.forEach((s: any) => {
    const match = s.id.match(/^STU-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  });
  return `STU-${highest + 1}`;
};

const validateStudent = (payload: any, existingId: string | null, db: any) => {
  const { fullName, mobile, seatNumber, shift, feeAmount, id, dueDate, feeStatus } = payload;

  if (!fullName || !fullName.trim()) {
    throw new Error("Student Name is required.");
  }
  if (!mobile || !mobile.trim()) {
    throw new Error("Mobile Number is required.");
  }
  if (!dueDate || !dueDate.trim()) {
    throw new Error("Due Date is required.");
  }

  // Same mobile number cannot be registered twice
  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  const mobileConflict = db.students.find((s: any) => s.id !== existingId && s.mobile.replace(/[^0-9]/g, '') === cleanMobile);
  if (mobileConflict) {
    throw new Error(`Mobile number '${mobile}' is already registered under student '${mobileConflict.fullName}' (ID: ${mobileConflict.id}).`);
  }

  // Same Student ID cannot exist twice
  if (id && db.students.some((s: any) => s.id !== existingId && s.id === id)) {
    throw new Error(`Student ID '${id}' already exists.`);
  }

  if (seatNumber) {
    const seat = db.seats.find((s: any) => s.seatNumber === seatNumber);
    if (!seat) {
      throw new Error(`Seat number '${seatNumber}' does not exist in the seating database.`);
    }

    const fee = parseFloat(feeAmount);
    if (isNaN(fee) || fee <= 0) {
      throw new Error(`Daily/Monthly fee must be a valid number greater than 0.`);
    }

    // Find other active students assigned to this seat
    const otherActives = db.students.filter((s: any) => s.id !== existingId && s.status === 'Active' && s.seatNumber === seatNumber);

    if (shift === 'Full Day') {
      if (otherActives.length > 0) {
        throw new Error(`Seat '${seatNumber}' is already assigned. Full Day booking blocks Morning and Evening shifts.`);
      }
    } else {
      const fullDayConflict = otherActives.find((s: any) => s.shift === 'Full Day');
      if (fullDayConflict) {
        throw new Error(`Seat '${seatNumber}' is already assigned for Full Day.`);
      }

      const shiftConflict = otherActives.find((s: any) => s.shift === shift);
      if (shiftConflict) {
        const slotName = shift === 'Morning Shift' ? 'Morning' : 'Evening';
        throw new Error(`Seat already assigned for ${slotName} shift.`);
      }
    }
  }
};

const ensureInitialFeeRecord = (student: Student, db: any) => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g. "June 2026"
  const existsIdx = db.fees.findIndex((f: any) => f.studentId === student.id && f.month === currentMonth);
  if (existsIdx === -1) {
    db.fees.push({
      id: `fee-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: student.id,
      studentName: student.fullName,
      amount: student.feeAmount,
      month: currentMonth,
      paymentDate: student.feeStatus === 'Paid' ? new Date().toISOString().split('T')[0] : '',
      paymentMode: 'Cash',
      status: student.feeStatus === 'Paid' ? 'Paid' : 'Pending'
    });
  } else {
    // Sync status if it exists
    db.fees[existsIdx].status = student.feeStatus;
    if (student.feeStatus === 'Paid' && !db.fees[existsIdx].paymentDate) {
      db.fees[existsIdx].paymentDate = new Date().toISOString().split('T')[0];
    }
  }
};

app.get("/api/admin/students", authenticateToken, (req, res) => {
  try {
    const db = getManagedDb();
    res.json(db.students);
  } catch (error) {
    res.status(500).json({ error: "Failed to download students" });
  }
});

app.post("/api/admin/students", authenticateToken, (req, res) => {
  try {
    const db = getManagedDb();
    const payload = req.body;

    // Enforce default values for optional values
    if (!payload.shift) {
      payload.shift = 'Full Day';
    }
    if (!payload.feeAmount) {
      payload.feeAmount = payload.shift === 'Full Day' ? 750 : 550;
    }
    if (!payload.feeStatus) {
      payload.feeStatus = 'Pending';
    }
    if (!payload.dueDate) {
      // Set to 30 days from now
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      payload.dueDate = thirtyDays.toISOString().split('T')[0];
    }

    payload.seatType = payload.shift === 'Full Day' ? 'Full Day Seat' : 'Half Day Seat';

    // Run strict validations
    try {
      validateStudent(payload, null, db);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    // Generate STU-ID
    const nextId = generateStudentId(db);

    const newStudent: Student = {
      id: nextId,
      fullName: payload.fullName.trim(),
      fatherName: (payload.fatherName || "").trim(),
      mobile: payload.mobile.trim(),
      email: (payload.email || "").trim(),
      address: (payload.address || "").trim(),
      aadhaar: (payload.aadhaar || "").trim(),
      seatNumber: payload.seatNumber || "",
      seatType: payload.seatType,
      shift: payload.shift,
      joiningDate: payload.joiningDate || new Date().toISOString().split('T')[0],
      endDate: payload.endDate || "",
      profilePhoto: payload.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
      feeAmount: parseFloat(payload.feeAmount),
      feeStatus: payload.feeStatus,
      dueDate: payload.dueDate,
      status: payload.status || 'Active'
    };

    db.students.push(newStudent);

    // Guarantee the initial fee record for transaction history
    ensureInitialFeeRecord(newStudent, db);

    normalizeDbState(db);
    dbStore.save(db);
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ error: "Server error during student registration" });
  }
});

app.put("/api/admin/students/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getManagedDb();
    const index = db.students.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    const oldStudent = db.students[index];
    const payload = req.body;

    // Enforce fallback states
    const merged = {
      ...oldStudent,
      ...payload
    };

    merged.seatType = merged.shift === 'Full Day' ? 'Full Day Seat' : 'Half Day Seat';

    // Validate
    try {
      validateStudent(merged, id, db);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    const updatedStudent: Student = {
      id: oldStudent.id,
      fullName: merged.fullName.trim(),
      fatherName: merged.fatherName.trim(),
      mobile: merged.mobile.trim(),
      email: merged.email.trim(),
      address: merged.address.trim(),
      aadhaar: merged.aadhaar.trim(),
      seatNumber: merged.seatNumber,
      seatType: merged.seatType,
      shift: merged.shift,
      joiningDate: merged.joiningDate,
      endDate: merged.endDate,
      profilePhoto: merged.profilePhoto,
      feeAmount: parseFloat(merged.feeAmount),
      feeStatus: merged.feeStatus,
      dueDate: merged.dueDate,
      status: merged.status
    };

    db.students[index] = updatedStudent;

    // Maintain unified fee record sync
    ensureInitialFeeRecord(updatedStudent, db);

    normalizeDbState(db);
    dbStore.save(db);
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: "Server error during student update" });
  }
});

app.delete("/api/admin/students/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getManagedDb();
    const index = db.students.findIndex(s => s.id === id);

    if (index === -1) return res.status(404).json({ error: "Student not found" });

    // Remove student
    db.students.splice(index, 1);

    normalizeDbState(db);
    dbStore.save(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error during student deletion" });
  }
});

app.post("/api/admin/students/clear-all", authenticateToken, (req, res) => {
  try {
    const db = getManagedDb();
    db.students = [];
    
    // Release all seat assignments
    if (db.seats) {
      db.seats.forEach((seat: any) => {
        seat.status = "Available";
      });
    }
    
    normalizeDbState(db);
    dbStore.save(db);
    res.json({ success: true, message: "All student registry records was cleared successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear students registries" });
  }
});

/* --- FEES CRUD --- */
app.get("/api/admin/fees", authenticateToken, (req, res) => {
  try {
    const db = getManagedDb();
    res.json(db.fees);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/fees", authenticateToken, (req, res) => {
  try {
    const { studentId, amount, month, paymentDate, paymentMode, status } = req.body;
    if (!studentId || !amount || !month) {
      return res.status(400).json({ error: "Student, amount and month are required" });
    }

    const db = getManagedDb();
    const student = db.students.find(s => s.id === studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const newFee: FeeRecord = {
      id: `fee-${Date.now()}`,
      studentId,
      studentName: student.fullName,
      amount: parseFloat(amount),
      month,
      paymentDate: paymentDate || "",
      paymentMode: paymentMode || 'Cash',
      status: status || 'Pending'
    };

    db.fees.push(newFee);
    normalizeDbState(db);
    dbStore.save(db);

    res.status(201).json(newFee);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/admin/fees/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { amount, month, paymentDate, paymentMode, status } = req.body;

    const db = getManagedDb();
    const index = db.fees.findIndex(f => f.id === id);

    if (index === -1) return res.status(404).json({ error: "Fee record not found" });

    db.fees[index] = {
      ...db.fees[index],
      amount: amount !== undefined ? parseFloat(amount) : db.fees[index].amount,
      month: month || db.fees[index].month,
      paymentDate: paymentDate !== undefined ? paymentDate : db.fees[index].paymentDate,
      paymentMode: paymentMode || db.fees[index].paymentMode,
      status: status || db.fees[index].status
    };

    normalizeDbState(db);
    dbStore.save(db);
    res.json(db.fees[index]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/fees/clear-all", authenticateToken, (req, res) => {
  try {
    const db = getManagedDb();
    db.fees = [];
    normalizeDbState(db);
    dbStore.save(db);
    res.json({ success: true, message: "All fee records cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/fees/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getManagedDb();
    const index = db.fees.findIndex(f => f.id === id);
    if (index === -1) return res.status(404).json({ error: "Fee record not found" });

    db.fees.splice(index, 1);
    normalizeDbState(db);
    dbStore.save(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* --- ATTENDANCE MANAGEMENT --- */
app.get("/api/admin/attendance", authenticateToken, (req, res) => {
  try {
    const db = dbStore.get();
    // Return sorted attendance records
    const sorted = [...db.attendance].sort((a, b) => b.date.localeCompare(a.date));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/attendance/today", authenticateToken, (req, res) => {
  try {
    const db = dbStore.get();
    const todayStr = new Date().toISOString().split('T')[0];

    // Find all today's records
    const todaysLog = db.attendance.filter(a => a.date === todayStr);

    // List of active students to cross-reference (so we can see present and absent lists)
    const activeStudents = db.students.filter(s => s.status === 'Active');

    const summaryList = activeStudents.map(student => {
      const todayRecord = todaysLog.find(a => a.studentId === student.id);
      return {
        studentId: student.id,
        fullName: student.fullName,
        seatNumber: student.seatNumber,
        mobile: student.mobile,
        isCheckedIn: todayRecord ? todayRecord.status === 'Present' && todayRecord.checkIn !== '' : false,
        isCheckedOut: todayRecord ? todayRecord.checkOut !== '' : false,
        checkIn: todayRecord ? todayRecord.checkIn : '',
        checkOut: todayRecord ? todayRecord.checkOut : '',
        status: todayRecord ? todayRecord.status : 'Absent',
        recordId: todayRecord ? todayRecord.id : null
      };
    });

    res.json(summaryList);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/attendance/checkin", authenticateToken, (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "Student ID required" });

    const db = dbStore.get();
    const student = db.students.find(s => s.id === studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    let attIdx = db.attendance.findIndex(a => a.studentId === studentId && a.date === todayStr);

    if (attIdx !== -1) {
      db.attendance[attIdx].checkIn = timeStr;
      db.attendance[attIdx].status = 'Present';
    } else {
      const newAtt: AttendanceRecord = {
        id: `att-${Date.now()}`,
        studentId,
        studentName: student.fullName,
        date: todayStr,
        checkIn: timeStr,
        checkOut: "",
        status: 'Present'
      };
      db.attendance.push(newAtt);
    }

    dbStore.save(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/attendance/checkout", authenticateToken, (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: "Student ID required" });

    const db = dbStore.get();
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const attIdx = db.attendance.findIndex(a => a.studentId === studentId && a.date === todayStr);

    if (attIdx !== -1) {
      db.attendance[attIdx].checkOut = timeStr;
    } else {
      // Checked out without checking in? Create a late log.
      const student = db.students.find(s => s.id === studentId);
      const newAtt: AttendanceRecord = {
        id: `att-${Date.now()}`,
        studentId,
        studentName: student ? student.fullName : "Unknown",
        date: todayStr,
        checkIn: "",
        checkOut: timeStr,
        status: 'Present'
      };
      db.attendance.push(newAtt);
    }

    dbStore.save(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* --- ENQUIRIES ADMIN --- */
app.get("/api/admin/enquiries", authenticateToken, (req, res) => {
  try {
    const db = dbStore.get();
    const sorted = [...db.enquiries].sort((a, b) => b.date.localeCompare(a.date));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/enquiries/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = dbStore.get();
    const index = db.enquiries.findIndex(e => e.id === id);

    if (index === -1) return res.status(404).json({ error: "Enquiry not found" });

    db.enquiries.splice(index, 1);
    dbStore.save(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* --- NOTICE BOARD ADMIN --- */
app.get("/api/admin/notices", authenticateToken, (req, res) => {
  try {
    const db = dbStore.get();
    res.json(db.notices);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/notices", authenticateToken, (req, res) => {
  try {
    const { title, content, date } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const db = dbStore.get();
    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      title,
      content,
      date: date || new Date().toISOString().split('T')[0]
    };

    db.notices.push(newNotice);
    dbStore.save(db);
    res.status(201).json(newNotice);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/admin/notices/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, date } = req.body;

    const db = dbStore.get();
    const index = db.notices.findIndex(n => n.id === id);

    if (index === -1) return res.status(404).json({ error: "Notice not found" });

    db.notices[index] = {
      ...db.notices[index],
      title: title || db.notices[index].title,
      content: content || db.notices[index].content,
      date: date || db.notices[index].date
    };

    dbStore.save(db);
    res.json(db.notices[index]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/notices/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = dbStore.get();
    const index = db.notices.findIndex(n => n.id === id);

    if (index === -1) return res.status(404).json({ error: "Notice not found" });

    db.notices.splice(index, 1);
    dbStore.save(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* --- SETTINGS ADMIN --- */
app.put("/api/admin/settings", authenticateToken, (req, res) => {
  try {
    const updates = req.body;
    const db = dbStore.get();

    db.library_settings = {
      ...db.library_settings,
      ...updates
    };

    dbStore.save(db);
    res.json(db.library_settings);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


const listen = () => {
  const server = app.listen(PORT, HOST, () => {
    const mode = process.env.NODE_ENV === "production" ? "production" : "dev";
    const dbMode = dbStore.isMongoEnabled() ? "MongoDB Atlas" : `local db.json (${path.join(process.cwd(), "db.json")})`;
    console.log(`Server is running in ${mode} mode on http://localhost:${PORT}`);
    console.log(`Database: ${dbMode}`);
  });

  server.on("error", (err: any) => {
    if (err?.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the old server or set a different PORT.`);
    } else {
      console.error("Failed to start server", err);
    }
    process.exit(1);
  });
};

const bootstrap = async () => {
  await dbStore.init();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  listen();
};

bootstrap().catch((err) => {
  console.error("Failed to bootstrap application", err);
  process.exit(1);
});
