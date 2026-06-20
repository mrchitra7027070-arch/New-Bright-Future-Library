const getAuthHeaders = () => {
  const token = localStorage.getItem("admin_token");
  return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
};

export const api = {
  // Public
  async getSettings() {
    const res = await fetch("/api/settings");
    if (!res.ok) throw new Error("Failed to load settings");
    return res.json();
  },

  async getNotices() {
    const res = await fetch("/api/notices");
    if (!res.ok) throw new Error("Failed to load notices");
    return res.json();
  },

  async getStats() {
    const res = await fetch("/api/stats");
    if (!res.ok) throw new Error("Failed to load statistics");
    return res.json();
  },

  async getPublicSeats() {
    const res = await fetch("/api/public-seats");
    if (!res.ok) throw new Error("Failed to load public seats chart");
    return res.json();
  },

  async submitEnquiry(data: { name: string; mobile: string; message: string }) {
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit enquiry");
    }
    return res.json();
  },

  // Auth
  async login(credentials: { username: string; password?: string }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("admin_token", data.token);
    }
    return data;
  },

  async verifyAuth() {
    const token = localStorage.getItem("admin_token");
    if (!token) return null;
    const res = await fetch("/api/auth/verify", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      localStorage.removeItem("admin_token");
      return null;
    }
    return res.json();
  },

  // Secure Dashboard stats
  async getDashboardStats() {
    const res = await fetch("/api/admin/dashboard-stats", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Unauthorized dashboard access");
    return res.json();
  },

  // Seats CRUD
  async getSeats() {
    const res = await fetch("/api/admin/seats", { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed request");
    return res.json();
  },

  async addSeat(data: any) {
    const res = await fetch("/api/admin/seats", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed layout");
    }
    return res.json();
  },

  async editSeat(id: string, data: any) {
    const res = await fetch(`/api/admin/seats/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed update");
    }
    return res.json();
  },

  async deleteSeat(id: string) {
    const res = await fetch(`/api/admin/seats/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Cannot delete seat assigned or occupied");
    }
    return res.json();
  },

  async clearAllSeats() {
    const res = await fetch("/api/admin/seats/clear-all", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to clear all seats");
    }
    return res.json();
  },

  async resetTo103Seats() {
    const res = await fetch("/api/admin/seats/reset-to-103", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to reset to 103 seats");
    }
    return res.json();
  },

  async generateFloorWiseSeats(groundCount: number, firstCount: number, secondCount: number) {
    const res = await fetch("/api/admin/seats/generate-floor-wise", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ groundCount, firstCount, secondCount }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to generate floor-wise seats");
    }
    return res.json();
  },

  // Students CRUD
  async getStudents() {
    const res = await fetch("/api/admin/students", { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed request");
    return res.json();
  },

  async addStudent(data: any) {
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Check details");
    }
    return res.json();
  },

  async editStudent(id: string, data: any) {
    const res = await fetch(`/api/admin/students/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Save failure");
    }
    return res.json();
  },

  async deleteStudent(id: string) {
    const res = await fetch(`/api/admin/students/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Deletion failed");
    return res.json();
  },

  async clearAllStudents() {
    const res = await fetch("/api/admin/students/clear-all", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to clear all students");
    }
    return res.json();
  },

  // Fees CRUD
  async getFees() {
    const res = await fetch("/api/admin/fees", { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed collections loading");
    return res.json();
  },

  async addFee(data: any) {
    const res = await fetch("/api/admin/fees", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Collection entry failed");
    }
    return res.json();
  },

  async editFee(id: string, data: any) {
    const res = await fetch(`/api/admin/fees/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Feerecord edit failed");
    return res.json();
  },

  async deleteFee(id: string) {
    const res = await fetch(`/api/admin/fees/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Deleting fee record failed");
    return res.json();
  },

  async clearAllFees() {
    const res = await fetch("/api/admin/fees/clear-all", {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Clearing all fees failed");
    return res.json();
  },

  // Attendance
  async getAttendanceToday() {
    const res = await fetch("/api/admin/attendance/today", { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Loading error");
    return res.json();
  },

  async getAttendanceHistory() {
    const res = await fetch("/api/admin/attendance", { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Loading history failed");
    return res.json();
  },

  async checkIn(studentId: string) {
    const res = await fetch("/api/admin/attendance/checkin", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ studentId }),
    });
    if (!res.ok) throw new Error("Failure checking in");
    return res.json();
  },

  async checkOut(studentId: string) {
    const res = await fetch("/api/admin/attendance/checkout", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ studentId }),
    });
    if (!res.ok) throw new Error("Failure checking out");
    return res.json();
  },

  // Enquiries
  async getEnquiries() {
    const res = await fetch("/api/admin/enquiries", { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Unauthorized info access");
    return res.json();
  },

  async deleteEnquiry(id: string) {
    const res = await fetch(`/api/admin/enquiries/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Deletion failed");
    return res.json();
  },

  // Notices CRUD
  async getAdminNotices() {
    const res = await fetch("/api/admin/notices", { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Load notices failure");
    return res.json();
  },

  async addNotice(data: any) {
    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Posting notice failed");
    return res.json();
  },

  async editNotice(id: string, data: any) {
    const res = await fetch(`/api/admin/notices/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Editing notice failed");
    return res.json();
  },

  async deleteNotice(id: string) {
    const res = await fetch(`/api/admin/notices/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Deleting notice failed");
    return res.json();
  },

  // Settings PUT
  async updateSettings(data: any) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Updating settings failed");
    return res.json();
  },

  // Testimonials API
  async getTestimonials() {
    const res = await fetch("/api/testimonials");
    if (!res.ok) throw new Error("Failed to load achievements list");
    return res.json();
  },

  async submitTestimonial(data: { name: string; view: string; rating?: number }) {
    const res = await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit achievement review");
    }
    return res.json();
  },

  async deleteTestimonial(id: string) {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete review");
    return res.json();
  },

  async clearAllTestimonials() {
    const res = await fetch("/api/admin/testimonials/clear-all", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to clear all reviews");
    }
    return res.json();
  }
};
