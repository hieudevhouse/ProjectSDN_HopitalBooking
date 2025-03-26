const express = require('express');
const connectDB = require('./config/db');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const {
  User,
  Patient,
  Doctor,
  Service,
  Appointment,
  MedicalRecord,
  Prescription,
  Medicine,
  PrescriptionDetail,
  Order,
  Payment,
  Feedback,
  News,
  Insurance,
  HealthInfo,
} = require('./models/model');

const app = express();

// Kết nối MongoDB
connectDB();

// Tạo tài khoản admin cố định nếu chưa tồn tại
const createAdminAccount = async () => {
  try {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({
        name: 'Admin',
        email: adminEmail,
        phone: '0123456789',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
      });
      await admin.save();
      console.log('Admin account created successfully:', adminEmail);
    } else {
    }
  } catch (error) {
    console.error('Error creating admin account:', error.message);
  }
};

// Gọi hàm tạo tài khoản admin sau khi kết nối MongoDB
connectDB().then(() => {
  createAdminAccount();
});

// Cấu hình EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware để parse JSON và form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Cấu hình session
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware để kiểm tra đăng nhập (cho API)
const requireLoginAPI = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User must be logged in' });
  }
  req.userId = userId;
  next();
};

// Middleware để kiểm tra đăng nhập (cho giao diện EJS)
const requireLoginEJS = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Middleware để kiểm tra vai trò admin (cho giao diện EJS)
const requireAdminEJS = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  next();
};

// UC01: Register Function (API) - Simplified
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, date_of_birth, gender, address } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword, role, status: 'active' });
    await user.save();

    if (role === 'patient' || role === 'caregiver') {
      const patient = new Patient({ user_id: user._id, date_of_birth, gender, address });
      await patient.save();
    } else if (role === 'doctor') {
      const doctor = new Doctor({ user_id: user._id, specialty: 'General', years_of_experience: 5, location: address });
      await doctor.save();
    }

    res.status(201).json({ message: 'Registration successful', user });
  } catch (error) {
    res.status(500).json({ error: 'System error while saving data: ' + error.message });
  }
});

// UC02: Login Function (API) - Simplified
app.post('/api/login', async (req, res) => {
  try {
    const { email_or_phone, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: email_or_phone }, { phone: email_or_phone }],
    });

    if (!user) {
      return res.status(401).json({ error: 'Incorrect email/phone or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect email/phone or password' });
    }

    res.json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ error: 'System error during authentication: ' + error.message });
  }
});

// UC03: Finance Function (API)
app.get('/api/finance/plans', async (req, res) => {
  try {
    const plans = [
      { id: 'basic', name: 'Basic Plan', price: 50, coverage: 'Basic healthcare coverage' },
      { id: 'family', name: 'Family Plan', price: 120, coverage: 'Comprehensive coverage for families' },
      { id: 'premium', name: 'Premium Plan', price: 200, coverage: 'Full coverage with additional benefits' },
    ];
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving plans: ' + error.message });
  }
});

app.post('/api/finance', requireLoginAPI, async (req, res) => {
  try {
    const { plan_id, payment_details } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    const plans = {
      basic: { name: 'Basic Plan', price: 50, coverage: 'Basic healthcare coverage' },
      family: { name: 'Family Plan', price: 120, coverage: 'Comprehensive coverage for families' },
      premium: { name: 'Premium Plan', price: 200, coverage: 'Full coverage with additional benefits' },
    };

    const plan = plans[plan_id];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    if (!['credit_card', 'digital_wallet'].includes(payment_details.method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const insurance = new Insurance({
      user_id: userId,
      provider: 'HealthHub Insurance',
      policy_number: `POL-${Date.now()}`,
      coverage: plan.coverage,
      status: 'active',
    });
    await insurance.save();

    res.json({ message: 'Insurance purchased successfully', insurance });
  } catch (error) {
    res.status(500).json({ error: 'Payment failure: ' + error.message });
  }
});

// UC04: Health A-Z Function (API)
app.get('/api/health-a-z', requireLoginAPI, async (req, res) => {
  try {
    const { search, category } = req.query;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    let query = {};
    if (search) {
      query.disease_name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }

    const diseases = await HealthInfo.find(query);
    if (diseases.length === 0) {
      return res.status(404).json({ message: 'No results found', suggestions: await HealthInfo.find().limit(5) });
    }

    res.json({
      diseases,
      disclaimer: 'This information is for reference only and does not replace professional medical diagnosis',
    });
  } catch (error) {
    res.status(500).json({ error: 'System failure while retrieving data: ' + error.message });
  }
});

// UC05: Resource Function (API)
// 5.1: Symptoms Checker
app.post('/api/resources/symptoms-checker', requireLoginAPI, async (req, res) => {
  try {
    const { symptoms } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const diseases = await HealthInfo.find({ symptoms: { $regex: symptoms, $options: 'i' } });
    if (diseases.length === 0) {
      return res.status(404).json({ message: 'No matching conditions found', suggestions: await HealthInfo.find().limit(5) });
    }

    res.json({ possible_diseases: diseases });
  } catch (error) {
    res.status(500).json({ error: 'System failure while processing request: ' + error.message });
  }
});

// 5.2: Health Calculator (Tính BMI)
app.post('/api/resources/health-calculator', requireLoginAPI, async (req, res) => {
  try {
    const { height, weight } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    if (!height || !weight) {
      return res.status(400).json({ error: 'Height and weight are required' });
    }

    const bmi = (weight / ((height / 100) * (height / 100))).toFixed(2);
    res.json({ bmi });
  } catch (error) {
    res.status(500).json({ error: 'System failure while processing request: ' + error.message });
  }
});

// 5.3: Find a Doctor
app.get('/api/resources/find-doctor', requireLoginAPI, async (req, res) => {
  try {
    const { specialty, location } = req.query;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    const query = { status: 'active' };
    if (specialty) query.specialty = { $regex: specialty, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };

    const doctors = await Doctor.find(query).populate('user_id');
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'No doctors found', suggestions: await Doctor.find({ status: 'active' }).limit(5) });
    }

    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ error: 'System failure while processing request: ' + error.message });
  }
});

// 5.4: Insurance Guide
app.get('/api/resources/insurance-guide', requireLoginAPI, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    const insurances = await Insurance.find({ user_id: userId }).populate('user_id');
    res.json({ insurances });
  } catch (error) {
    res.status(500).json({ error: 'System failure while processing request: ' + error.message });
  }
});

// 5.5: Ambulance Providence
app.post('/api/resources/ambulance', requireLoginAPI, async (req, res) => {
  try {
    const { location } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    res.json({ message: `Ambulance request sent for user ${userId} at ${location}` });
  } catch (error) {
    res.status(500).json({ error: 'System failure while processing request: ' + error.message });
  }
});

// UC06: Drugs and Supplements Function (API)
app.get('/api/drugs', requireLoginAPI, async (req, res) => {
  try {
    const { type, illness, sort_by_price } = req.query;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    let query = { status: 'available', stock: { $gt: 0 } };
    if (type) query.type = { $regex: type, $options: 'i' };
    if (illness) query.illness = { $regex: illness, $options: 'i' };

    let sort = {};
    if (sort_by_price === 'asc') sort.price = 1;
    if (sort_by_price === 'desc') sort.price = -1;

    const medicines = await Medicine.find(query).sort(sort);
    res.json({ medicines });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load drug data: ' + error.message });
  }
});

app.post('/api/drugs/order', requireLoginAPI, async (req, res) => {
  try {
    const { items, prescription_id, payment_method, delivery_address } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    let totalAmount = 0;
    for (let item of items) {
      const medicine = await Medicine.findById(item.medicine_id);
      if (!medicine) {
        return res.status(404).json({ error: `Medicine ${item.medicine_id} not found` });
      }

      if (medicine.requires_prescription && !prescription_id) {
        return res.status(400).json({ error: `Prescription required for ${medicine.name}` });
      }

      if (medicine.requires_prescription) {
        const prescription = await Prescription.findById(prescription_id);
        if (!prescription || prescription.status !== 'active' || prescription.refills <= 0) {
          return res.status(400).json({ error: 'Invalid or expired prescription' });
        }
        prescription.refills -= 1;
        if (prescription.refills === 0) prescription.status = 'expired';
        await prescription.save();
      }

      if (medicine.stock < item.quantity) {
        return res.status(400).json({ error: `Medicine ${medicine.name} is out of stock` });
      }

      totalAmount += medicine.price * item.quantity;
      medicine.stock -= item.quantity;
      if (medicine.stock === 0) medicine.status = 'out_of_stock';
      await medicine.save();
    }

    const order = new Order({
      user_id: userId,
      prescription_id,
      items,
      total_amount: totalAmount,
      payment_method,
      delivery_address,
      status: 'processing',
    });
    await order.save();

    res.json({ order_id: order._id, status: 'processing', total_amount: totalAmount });
  } catch (error) {
    res.status(500).json({ error: 'System error during order processing: ' + error.message });
  }
});

// UC07: News and Experts Function (API)
app.get('/api/news', requireLoginAPI, async (req, res) => {
  try {
    const { category } = req.query;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    let query = { status: 'published' };
    if (category) query.category = category;

    const news = await News.find(query).sort({ priority: -1, created_at: -1 });
    res.json({ news });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load news: ' + error.message });
  }
});

app.get('/api/experts', requireLoginAPI, async (req, res) => {
  try {
    const { specialty, location } = req.query;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    const query = { status: 'active' };
    if (specialty) query.specialty = { $regex: specialty, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };

    const experts = await Doctor.find(query).populate('user_id');
    if (experts.length === 0) {
      return res.status(404).json({ message: 'No suitable experts found', suggestions: await Doctor.find({ status: 'active' }).limit(5) });
    }

    res.json({ experts });
  } catch (error) {
    res.status(500).json({ error: 'System error: ' + error.message });
  }
});

app.post('/api/experts/book', requireLoginAPI, async (req, res) => {
  try {
    const { doctor_id, date_time, health_issue } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    const doctor = await Doctor.findById(doctor_id);
    if (!doctor || doctor.status !== 'active') {
      return res.status(400).json({ error: 'Expert is unavailable' });
    }

    const existingAppointment = await Appointment.findOne({ doctor_id, date_time });
    if (existingAppointment) {
      return res.status(400).json({ error: 'The appointment is fully booked. Please choose another time' });
    }

    const patient = await Patient.findOne({ user_id: userId });
    if (!patient) {
      return res.status(400).json({ error: 'Patient profile not found' });
    }

    const appointment = new Appointment({
      patient_id: patient._id,
      doctor_id,
      service_id: null,
      date_time,
      health_issue,
      status: 'scheduled',
    });
    await appointment.save();

    res.json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Error during appointment booking: ' + error.message });
  }
});

// UC08: Payment Function (API)
app.post('/api/payment', requireLoginAPI, async (req, res) => {
  try {
    const { service_id, order_id, amount, method, payment_details } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    if (!['credit_card', 'digital_wallet', 'insurance'].includes(method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (method === 'insurance') {
      const insurance = await Insurance.findOne({ user_id: userId, status: 'active' });
      if (!insurance) {
        return res.status(400).json({ error: 'Insurance is not accepted for this transaction' });
      }
    }

    if (order_id) {
      const order = await Order.findById(order_id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
    }
    if (service_id) {
      const service = await Service.findById(service_id);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
    }

    const payment = new Payment({
      user_id: userId,
      amount,
      method,
      service_id: service_id || null,
      order_id: order_id || null,
      status: 'completed',
    });
    await payment.save();

    res.json({ message: 'Payment successful', payment });
  } catch (error) {
    res.status(500).json({ error: 'Payment gateway connection error: ' + error.message });
  }
});

// UC09: Feedback Function (API)
app.post('/api/feedback', requireLoginAPI, async (req, res) => {
  try {
    const { subject, content, attachment } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'User must be logged in and active' });
    }

    if (!subject || !content) {
      return res.status(400).json({ error: 'Please complete all required fields' });
    }

    if (attachment && !attachment.match(/\.(pdf|jpg|png)$/i)) {
      return res.status(400).json({ error: 'Invalid file attachment. Please upload a file in PDF, JPG, or PNG format' });
    }

    const lastFeedback = await Feedback.findOne({
      user_id: userId,
      content,
      last_submission: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (lastFeedback) {
      return res.status(400).json({ error: 'Your feedback has already been submitted. No need to resend' });
    }

    const feedback = new Feedback({
      user_id: userId,
      subject,
      content,
      attachment,
      last_submission: new Date(),
    });
    await feedback.save();

    res.json({ message: 'Thank you for your feedback. We will process it as soon as possible', feedback });
  } catch (error) {
    res.status(500).json({ error: 'Unable to process feedback: ' + error.message });
  }
});

// API bổ sung: Quản lý hồ sơ cá nhân (Profile)
app.get('/api/profile', requireLoginAPI, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = user;
    if (user.role === 'patient' || user.role === 'caregiver') {
      const patient = await Patient.findOne({ user_id: userId });
      profile = { ...user._doc, patient };
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: userId });
      profile = { ...user._doc, doctor };
    }

    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving profile: ' + error.message });
  }
});

app.put('/api/profile', requireLoginAPI, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, phone, address, specialty, years_of_experience } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    await user.save();

    if (user.role === 'patient' || user.role === 'caregiver') {
      const patient = await Patient.findOne({ user_id: userId });
      if (address) patient.address = address;
      await patient.save();
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: userId });
      if (address) doctor.location = address;
      if (specialty) doctor.specialty = specialty;
      if (years_of_experience) doctor.years_of_experience = years_of_experience;
      await doctor.save();
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile: ' + error.message });
  }
});

// API bổ sung: Quản lý lịch hẹn (Appointments)
app.get('/api/appointments', requireLoginAPI, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let appointments = [];
    if (user.role === 'patient' || user.role === 'caregiver') {
      const patient = await Patient.findOne({ user_id: userId });
      appointments = await Appointment.find({ patient_id: patient._id }).populate('doctor_id');
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: userId });
      appointments = await Appointment.find({ doctor_id: doctor._id }).populate('patient_id');
    }

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving appointments: ' + error.message });
  }
});

app.put('/api/appointments/:id', requireLoginAPI, async (req, res) => {
  try {
    const { id } = req.params;
    const { date_time, health_issue, status } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (user.role === 'patient' || user.role === 'caregiver') {
      const patient = await Patient.findOne({ user_id: userId });
      if (appointment.patient_id.toString() !== patient._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized to edit this appointment' });
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: userId });
      if (appointment.doctor_id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized to edit this appointment' });
      }
    }

    if (date_time) {
      const existingAppointment = await Appointment.findOne({ doctor_id: appointment.doctor_id, date_time });
      if (existingAppointment && existingAppointment._id.toString() !== id) {
        return res.status(400).json({ error: 'The appointment time is already booked' });
      }
      appointment.date_time = date_time;
    }
    if (health_issue) appointment.health_issue = health_issue;
    if (status) appointment.status = status;

    await appointment.save();
    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Error updating appointment: ' + error.message });
  }
});

app.delete('/api/appointments/:id', requireLoginAPI, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (user.role === 'patient' || user.role === 'caregiver') {
      const patient = await Patient.findOne({ user_id: userId });
      if (appointment.patient_id.toString() !== patient._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized to delete this appointment' });
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: userId });
      if (appointment.doctor_id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized to delete this appointment' });
      }
    }

    await Appointment.deleteOne({ _id: id });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting appointment: ' + error.message });
  }
});

// API bổ sung: Quản lý đơn thuốc (Prescriptions)
app.get('/api/prescriptions', requireLoginAPI, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let prescriptions = [];
    if (user.role === 'patient' || user.role === 'caregiver') {
      const patient = await Patient.findOne({ user_id: userId });
      prescriptions = await Prescription.find({ patient_id: patient._id })
        .populate('doctor_id')
        .populate('details.medicine_id');
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: userId });
      prescriptions = await Prescription.find({ doctor_id: doctor._id })
        .populate('patient_id')
        .populate('details.medicine_id');
    }

    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving prescriptions: ' + error.message });
  }
});

app.post('/api/prescriptions', requireLoginAPI, async (req, res) => {
  try {
    const { patient_id, details, refills } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can create prescriptions' });
    }

    const doctor = await Doctor.findOne({ user_id: userId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    for (let detail of details) {
      const medicine = await Medicine.findById(detail.medicine_id);
      if (!medicine) {
        return res.status(404).json({ error: `Medicine ${detail.medicine_id} not found` });
      }
    }

    const prescription = new Prescription({
      patient_id,
      doctor_id: doctor._id,
      details,
      refills,
      status: 'active',
    });
    await prescription.save();

    res.json({ message: 'Prescription created successfully', prescription });
  } catch (error) {
    res.status(500).json({ error: 'Error creating prescription: ' + error.message });
  }
});

// API bổ sung: Quản lý hồ sơ y tế (Medical Records)
app.get('/medical-records', requireLoginEJS, async (req, res) => {
  try {
    const user = req.session.user;

    let records = [];
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user_id: user._id });
      if (!patient) {
        return res.render('medical-records', { user, records: [], error: 'Patient profile not found' });
      }
      records = await MedicalRecord.find({ patient_id: patient._id })
        .populate({
          path: 'patient_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'doctor_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'prescription_id',
          populate: { path: 'medicine_ids', select: 'name' },
        })
        .sort({ created_at: -1 });
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: user._id });
      if (!doctor) {
        return res.render('medical-records', { user, records: [], error: 'Doctor profile not found' });
      }
      records = await MedicalRecord.find({ doctor_id: doctor._id })
        .populate({
          path: 'patient_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'doctor_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'prescription_id',
          populate: { path: 'medicine_ids', select: 'name' },
        })
        .sort({ created_at: -1 });
    } else {
      return res.render('medical-records', { user, records: [], error: 'Access denied' });
    }

    res.render('medical-records', { user, records, error: null });
  } catch (error) {
    res.render('medical-records', { user: req.session.user, records: [], error: 'Error fetching medical records: ' + error.message });
  }
});

app.post('/api/medical-records', requireLoginAPI, async (req, res) => {
  try {
    const { patient_id, diagnosis, treatment, notes } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can create medical records' });
    }

    const doctor = await Doctor.findOne({ user_id: userId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const medicalRecord = new MedicalRecord({
      patient_id,
      doctor_id: doctor._id,
      diagnosis,
      treatment,
      notes,
    });
    await medicalRecord.save();

    res.json({ message: 'Medical record created successfully', medicalRecord });
  } catch (error) {
    res.status(500).json({ error: 'Error creating medical record: ' + error.message });
  }
});

// API bổ sung: Quản lý dịch vụ (Services)
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving services: ' + error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, description, price } = req.body;

    const service = new Service({
      name,
      description,
      price,
    });
    await service.save();

    res.json({ message: 'Service created successfully', service });
  } catch (error) {
    res.status(500).json({ error: 'Error creating service: ' + error.message });
  }
});

// API bổ sung: Quản lý đơn hàng (Orders)
app.get('/api/orders', requireLoginAPI, async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({ user_id: userId }).populate('items.medicine_id');
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving orders: ' + error.message });
  }
});

app.put('/api/orders/:id', requireLoginAPI, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, delivery_address } = req.body;
    const userId = req.userId;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this order' });
    }

    if (status) order.status = status;
    if (delivery_address) order.delivery_address = delivery_address;

    await order.save();
    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    res.status(500).json({ error: 'Error updating order: ' + error.message });
  }
});

// API bổ sung: Quản lý thanh toán (Payments)
app.get('/api/payments', requireLoginAPI, async (req, res) => {
  try {
    const userId = req.userId;
    const payments = await Payment.find({ user_id: userId });
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving payments: ' + error.message });
  }
});

// Routes để render giao diện EJS
// Home Page
app.get('/', async (req, res) => {
  res.render('home', { user: req.session.user });
});

// Subscribe (giả lập)
app.post('/subscribe', (req, res) => {
  res.redirect('/');
});

// Profile Page
app.get('/profile', requireLoginEJS, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user_id: req.session.user._id });
    res.render('profile', { user: req.session.user, feedbacks, error: null });
  } catch (error) {
    res.render('profile', { user: req.session.user, feedbacks: [], error: 'Error retrieving feedbacks: ' + error.message });
  }
});

// UC01: Register Function (EJS)
app.get('/register', (req, res) => {
  res.render('register', { user: null, error: null });
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, date_of_birth, gender, address } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.render('register', { user: null, error: 'Email or phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword, role, status: 'active' });
    await user.save();

    if (role === 'patient' || role === 'caregiver') {
      const patient = new Patient({ user_id: user._id, date_of_birth, gender, address });
      await patient.save();
    } else if (role === 'doctor') {
      const doctor = new Doctor({ user_id: user._id, specialty: 'General', years_of_experience: 5, location: address });
      await doctor.save();
    }

    res.redirect('/login');
  } catch (error) {
    res.render('register', { user: null, error: 'System error while saving data: ' + error.message });
  }
});

// UC02: Login Function (EJS)
app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { email_or_phone, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: email_or_phone }, { phone: email_or_phone }],
    });

    if (!user) {
      return res.render('login', { user: null, error: 'Incorrect email/phone or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { user: null, error: 'Incorrect email/phone or password' });
    }

    req.session.user = user;

    // Kiểm tra vai trò của người dùng
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }

    res.redirect('/');
  } catch (error) {
    res.render('login', { user: null, error: 'System error during authentication: ' + error.message });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// UC03: Finance Function (EJS)
app.get('/finance', requireLoginEJS, (req, res) => {
  res.render('finance', { user: req.session.user, error: null });
});

app.post('/finance', requireLoginEJS, async (req, res) => {
  try {
    const { plan_id } = req.body;
    const user = req.session.user;

    const plans = {
      basic: { name: 'Basic Plan', price: 50, coverage: 'Basic healthcare coverage' },
      family: { name: 'Family Plan', price: 120, coverage: 'Comprehensive coverage for families' },
      premium: { name: 'Premium Plan', price: 200, coverage: 'Full coverage with additional benefits' },
    };

    const plan = plans[plan_id];
    if (!plan) {
      return res.render('finance', { user: req.session.user, error: 'Invalid plan selected' });
    }

    const insurance = new Insurance({
      user_id: user._id,
      provider: 'HealthHub Insurance',
      policy_number: `POL-${Date.now()}`,
      coverage: plan.coverage,
      status: 'active',
    });
    await insurance.save();

    res.redirect('/payment');
  } catch (error) {
    res.render('finance', { user: req.session.user, error: 'Payment failure: ' + error.message });
  }
});

// UC04: Health A-Z Function (EJS)
app.get('/health-a-z', requireLoginEJS, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.disease_name = { $regex: search, $options: 'i' };
    }

    const diseases = await HealthInfo.find(query);
    res.render('health-a-z', { user: req.session.user, diseases, error: null });
  } catch (error) {
    res.render('health-a-z', {
      user: req.session.user,
      diseases: [],
      error: 'System failure while retrieving data: ' + error.message,
    });
  }
});

// UC05: Resource Function (EJS)
// 5.2: Health Calculator
app.get('/resources/health-calculator', requireLoginEJS, (req, res) => {
  res.render('health-calculator', { user: req.session.user, bmi: null, error: null });
});

app.post('/resources/health-calculator', requireLoginEJS, (req, res) => {
  try {
    const { height, weight } = req.body;
    if (!height || !weight) {
      return res.render('health-calculator', { user: req.session.user, bmi: null, error: 'Height and weight are required' });
    }

    const bmi = (weight / ((height / 100) * (height / 100))).toFixed(2);
    res.render('health-calculator', { user: req.session.user, bmi, error: null });
  } catch (error) {
    res.render('health-calculator', {
      user: req.session.user,
      bmi: null,
      error: 'System failure while processing request: ' + error.message,
    });
  }
});
// Route để tạo bệnh án (Medical Record)
app.post('/create-medical-record', requireLoginEJS, async (req, res) => {
  try {
    if (req.session.user.role !== 'doctor') {
      return res.status(403).render('error', {
        user: req.session.user,
        error: 'Access denied: Only doctors can create medical records.',
      });
    }

    const { appointment_id, diagnosis, treatment } = req.body;

    // Kiểm tra xem diagnosis và treatment có được điền không
    if (!diagnosis || !treatment) {
      return res.redirect('/doctor-appointments?error=Diagnosis and treatment are required');
    }

    const appointment = await Appointment.findById(appointment_id)
      .populate('patient_id')
      .populate('doctor_id');
    if (!appointment) {
      return res.redirect('/doctor-appointments?error=Appointment not found');
    }

    const doctor = await Doctor.findOne({ user_id: req.session.user._id });
    if (!doctor) {
      return res.redirect('/doctor-appointments?error=Doctor profile not found');
    }

    const existingRecord = await MedicalRecord.findOne({
      patient_id: appointment.patient_id._id,
      doctor_id: doctor._id,
      created_at: { $gte: appointment.date_time },
    });
    if (existingRecord) {
      return res.redirect('/doctor-appointments?error=Medical record already exists for this appointment');
    }

    const newMedicalRecord = new MedicalRecord({
      patient_id: appointment.patient_id._id,
      doctor_id: doctor._id,
      diagnosis: diagnosis,
      treatment: treatment, // Lưu treatment từ form
      status: 'open',
      created_at: new Date(),
      updated_at: new Date(),
    });
    await newMedicalRecord.save();

    res.redirect('/doctor-appointments?success=Medical record created successfully');
  } catch (error) {
    res.redirect('/doctor-appointments?error=Error creating medical record: ' + error.message);
  }
});
// Route để tạo đơn thuốc (Prescription)
app.post('/create-prescription', requireLoginEJS, async (req, res) => {
  try {
    if (req.session.user.role !== 'doctor') {
      return res.status(403).render('error', {
        user: req.session.user,
        error: 'Access denied: Only doctors can create prescriptions.',
      });
    }

    const { appointment_id, instructions, medicine_ids } = req.body;

    // Kiểm tra xem có chọn thuốc nào không
    if (!medicine_ids || medicine_ids.length === 0) {
      return res.redirect('/doctor-appointments?error=Please select at least one medicine');
    }

    const appointment = await Appointment.findById(appointment_id)
      .populate('patient_id')
      .populate('doctor_id');
    if (!appointment) {
      return res.redirect('/doctor-appointments?error=Appointment not found');
    }

    const doctor = await Doctor.findOne({ user_id: req.session.user._id });
    if (!doctor) {
      return res.redirect('/doctor-appointments?error=Doctor profile not found');
    }

    const existingPrescription = await Prescription.findOne({
      patient_id: appointment.patient_id._id,
      doctor_id: doctor._id,
      created_at: { $gte: appointment.date_time },
    });
    if (existingPrescription) {
      return res.redirect('/doctor-appointments?error=Prescription already exists for this appointment');
    }

    const newPrescription = new Prescription({
      patient_id: appointment.patient_id._id,
      doctor_id: doctor._id,
      medicine_ids: medicine_ids, // Lưu mảng medicine_ids
      instructions: instructions || 'Chưa có hướng dẫn',
      refills: 0,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    await newPrescription.save();

    res.redirect('/doctor-appointments?success=Prescription created successfully');
  } catch (error) {
    res.redirect('/doctor-appointments?error=Error creating prescription: ' + error.message);
  }
});
// 5.3: Find a Doctor
app.get('/find-doctor', requireLoginEJS, async (req, res) => {
  try {
    const { specialty, location } = req.query;
    const query = { status: 'active' };
    if (specialty) query.specialty = { $regex: specialty, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };

    const doctors = await Doctor.find(query).populate('user_id');
    res.render('find-doctor', { user: req.session.user, doctors, error: null });
  } catch (error) {
    res.render('find-doctor', {
      user: req.session.user,
      doctors: [],
      error: 'System failure while processing request: ' + error.message,
    });
  }
});
app.get('/doctor-appointments', requireLoginEJS, async (req, res) => {
  try {
    // Kiểm tra xem người dùng có phải là bác sĩ không
    if (req.session.user.role !== 'doctor') {
      return res.status(403).render('error', {
        user: req.session.user,
        error: 'Access denied: Only doctors can view this page.',
      });
    }

    // Tìm doctor dựa trên user_id của bác sĩ hiện tại
    const doctor = await Doctor.findOne({ user_id: req.session.user._id });
    if (!doctor) {
      return res.render('doctor-appointments', {
        user: req.session.user,
        appointments: [],
        error: 'Doctor profile not found.',
        success: null, // Thêm success để tránh lỗi undefined
      });
    }

    // Tìm tất cả lịch hẹn của bác sĩ này
    const appointments = await Appointment.find({ doctor_id: doctor._id })
      .populate('patient_id')
      .populate({
        path: 'patient_id',
        populate: { path: 'user_id', select: 'name' },
      })
      .populate({
        path: 'doctor_id',
        populate: { path: 'user_id', select: 'name' },
      })
      .sort({ date_time: -1 });

    // Lấy thông báo từ query string
    const errorMessage = req.query.error || null;
    const successMessage = req.query.success || null;

    res.render('doctor-appointments', {
      user: req.session.user,
      appointments,
      error: errorMessage, // Truyền error từ query string
      success: successMessage, // Truyền success từ query string
    });
  } catch (error) {
    res.render('doctor-appointments', {
      user: req.session.user,
      appointments: [],
      error: 'Error fetching appointments: ' + error.message,
      success: null, // Thêm success để tránh lỗi undefined
    });
  }
});
// Route để lấy danh sách thuốc
app.get('/get-medicines', async (req, res) => {
  try {
    const medicines = await Medicine.find({}, 'name'); // Chỉ lấy trường name
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching medicines: ' + error.message });
  }
});
// 5.4: Insurance Guide
app.get('/resources/insurance-guide', requireLoginEJS, async (req, res) => {
  try {
    const insurances = await Insurance.find({ user_id: req.session.user._id }).populate('user_id');
    res.render('insurance-guide', { user: req.session.user, insurances, error: null });
  } catch (error) {
    res.render('insurance-guide', {
      user: req.session.user,
      insurances: [],
      error: 'System failure while processing request: ' + error.message,
    });
  }
});

// 5.5: Ambulance Providence
app.get('/resources/ambulance', requireLoginEJS, (req, res) => {
  res.render('ambulance', { user: req.session.user, message: null, error: null });
});

app.post('/resources/ambulance', requireLoginEJS, (req, res) => {
  try {
    const { location } = req.body;
    if (!location) {
      return res.render('ambulance', { user: req.session.user, message: null, error: 'Location is required' });
    }

    res.render('ambulance', { user: req.session.user, message: `Ambulance request sent at ${location}`, error: null });
  } catch (error) {
    res.render('ambulance', {
      user: req.session.user,
      message: null,
      error: 'System failure while processing request: ' + error.message,
    });
  }
});

// UC06: Drugs and Supplements Function (EJS)
app.get('/buy-medicine', requireLoginEJS, async (req, res) => {
  try {
    const { type, illness } = req.query;
    let query = { status: 'available', stock: { $gt: 0 } };
    if (type) query.type = { $regex: type, $options: 'i' };
    if (illness) query.illness = { $regex: illness, $options: 'i' };

    const medicines = await Medicine.find(query);
    const cart = req.session.cart || [];
    res.render('buy-medicine', { user: req.session.user, medicines, cart, error: null });
  } catch (error) {
    res.render('buy-medicine', {
      user: req.session.user,
      medicines: [],
      cart: [],
      error: 'Unable to load drug data: ' + error.message,
    });
  }
});

app.post('/buy-medicine/add-to-cart', requireLoginEJS, async (req, res) => {
  try {
    const { medicine_id, quantity } = req.body;
    const medicine = await Medicine.findById(medicine_id);
    if (!medicine) {
      return res.render('buy-medicine', {
        user: req.session.user,
        medicines: await Medicine.find({ status: 'available', stock: { $gt: 0 } }),
        cart: req.session.cart || [],
        error: 'Medicine not found',
      });
    }

    if (medicine.stock < quantity) {
      return res.render('buy-medicine', {
        user: req.session.user,
        medicines: await Medicine.find({ status: 'available', stock: { $gt: 0 } }),
        cart: req.session.cart || [],
        error: `Medicine ${medicine.name} is out of stock`,
      });
    }

    if (!req.session.cart) req.session.cart = [];
    req.session.cart.push({ medicine, quantity });

    res.redirect('/buy-medicine');
  } catch (error) {
    res.render('buy-medicine', {
      user: req.session.user,
      medicines: await Medicine.find({ status: 'available', stock: { $gt: 0 } }),
      cart: req.session.cart || [],
      error: 'Error adding to cart: ' + error.message,
    });
  }
});

// UC07: News and Experts Function (EJS)
app.get('/news', requireLoginEJS, async (req, res) => {
  try {
    const news = await News.find({ status: 'published' }).sort({ priority: -1, created_at: -1 });
    res.render('news', { user: req.session.user, news, error: null });
  } catch (error) {
    res.render('news', { user: req.session.user, news: [], error: 'Unable to load news: ' + error.message });
  }
});

app.get('/experts/book', requireLoginEJS, async (req, res) => {
  try {
    const { doctor_id } = req.query;
    res.render('book-appointment', { user: req.session.user, doctor_id, error: null });
  } catch (error) {
    res.render('book-appointment', { user: req.session.user, doctor_id: null, error: 'Error: ' + error.message });
  }
});

app.post('/experts/book', requireLoginEJS, async (req, res) => {
  try {
    const { doctor_id, date_time, health_issue } = req.body;
    const user = req.session.user;

    const doctor = await Doctor.findById(doctor_id);
    if (!doctor || doctor.status !== 'active') {
      return res.render('book-appointment', { user, doctor_id, error: 'Expert is unavailable' });
    }

    const existingAppointment = await Appointment.findOne({ doctor_id, date_time });
    if (existingAppointment) {
      return res.render('book-appointment', {
        user,
        doctor_id,
        error: 'The appointment is fully booked. Please choose another time',
      });
    }

    const patient = await Patient.findOne({ user_id: user._id });
    const appointment = new Appointment({
      patient_id: patient._id,
      doctor_id,
      service_id: null,
      date_time,
      health_issue,
      status: 'scheduled',
    });
    await appointment.save();

    res.redirect('/find-doctor');
  } catch (error) {
    res.render('book-appointment', {
      user: req.session.user,
      doctor_id: req.body.doctor_id,
      error: 'Error during appointment booking: ' + error.message,
    });
  }
});

// UC08: Payment Function (EJS)
app.get('/payment', requireLoginEJS, (req, res) => {
  res.render('payment', { user: req.session.user, error: null });
});

app.post('/payment', requireLoginEJS, async (req, res) => {
  try {
    const { method, card_name, card_number, expiration, cvv, address } = req.body;
    const user = req.session.user;

    if (!['credit_card', 'paypal'].includes(method)) {
      return res.render('payment', { user, error: 'Invalid payment method' });
    }

    const amount = req.session.cart ? req.session.cart.reduce((total, item) => total + item.medicine.price * item.quantity, 0) : 0;
    const payment = new Payment({ user_id: user._id, amount, method, status: 'completed' });
    await payment.save();

    if (req.session.cart) {
      const order = new Order({
        user_id: user._id,
        items: req.session.cart.map((item) => ({ medicine_id: item.medicine._id, quantity: item.quantity })),
        total_amount: amount,
        payment_method: method,
        delivery_address: address,
      });
      await order.save();
      req.session.cart = [];
    }

    res.redirect('/');
  } catch (error) {
    res.render('payment', { user: req.session.user, error: 'Payment gateway connection error: ' + error.message });
  }
});

// UC09: Feedback Function (EJS)
app.get('/feedback', requireLoginEJS, (req, res) => {
  res.render('feedback', { user: req.session.user, error: null });
});

app.post('/feedback', requireLoginEJS, async (req, res) => {
  try {
    const { subject, content, attachment } = req.body;
    const user = req.session.user;

    if (!subject || !content) {
      return res.render('feedback', { user, error: 'Please complete all required fields' });
    }

    if (attachment && !attachment.match(/\.(pdf|jpg|png)$/i)) {
      return res.render('feedback', { user, error: 'Invalid file attachment. Please upload a file in PDF, JPG, or PNG format' });
    }

    const lastFeedback = await Feedback.findOne({
      user_id: user._id,
      content,
      last_submission: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (lastFeedback) {
      return res.render('feedback', { user, error: 'Your feedback has already been submitted. No need to resend' });
    }

    const feedback = new Feedback({ user_id: user._id, subject, content, attachment, last_submission: new Date() });
    await feedback.save();

    res.redirect('/');
  } catch (error) {
    res.render('feedback', { user: req.session.user, error: 'Unable to process feedback: ' + error.message });
  }
});

// Admin Dashboard
app.get('/admin/dashboard', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const totalAccounts = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const feedbacks = await Feedback.find().populate('user_id');
    const doctors = await Doctor.find().populate('user_id');
    const medicines = await Medicine.find();
    const news = await News.find();
    const healthinfos = await HealthInfo.find();
    const orders = await Order.find().populate('user_id').populate('items.medicine_id');
    const payments = await Payment.find().populate('user_id');

    res.render('admin-dashboard', {
      user: req.session.user,
      totalAccounts,
      totalDoctors,
      totalOrders,
      totalPayments,
      feedbacks,
      doctors,
      medicines,
      news,
      healthinfos,
      orders,
      payments,
      error: null,
    });
  } catch (error) {
    res.render('admin-dashboard', {
      user: req.session.user,
      totalAccounts: 0,
      totalDoctors: 0,
      totalOrders: 0,
      totalPayments: 0,
      feedbacks: [],
      doctors: [],
      medicines: [],
      news: [],
      healthinfos: [],
      orders: [],
      payments: [],
      error: 'Hệ thống gặp lỗi khi xử lý yêu cầu: ' + error.message,
    });
  }
});

// Quản lý bác sĩ (Doctors) - CRUD
// Quản lý bác sĩ (Doctors) - Thêm bác sĩ mới
// Quản lý bác sĩ (Doctors) - Thêm bác sĩ mới


// Quản lý bác sĩ (Doctors) - Thêm bác sĩ mới
app.get('/admin/doctors/add', requireLoginEJS, requireAdminEJS, (req, res) => {
  res.render('admin-doctors-add', { user: req.session.user, error: null });
});

app.post('/admin/doctors/add', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { name, email, phone, password, specialty, years_of_experience, location } = req.body;

    // Kiểm tra xem email hoặc số điện thoại đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.render('admin-doctors-add', {
        user: req.session.user,
        error: 'Email or phone number already registered',
      });
    }

    // Mã hóa mật khẩu (schema yêu cầu password không mã hóa, nhưng để bảo mật, tôi vẫn thêm bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới với role là 'doctor'
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword, // Lưu ý: Schema không yêu cầu mã hóa, nhưng tôi thêm để bảo mật
      role: 'doctor',
      status: 'active', // Theo schema, mặc định là 'pending_verification', nhưng tôi đặt 'active' cho bác sĩ
      created_at: new Date(),
      updated_at: new Date(),
    });
    await newUser.save();

    // Tạo doctor mới với user_id là _id của user vừa tạo
    const newDoctor = new Doctor({
      user_id: newUser._id,
      specialty,
      years_of_experience: parseInt(years_of_experience), // Chuyển thành số
      location,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    await newDoctor.save();

    res.redirect('/admin/dashboard');
  } catch (error) {
    res.render('admin-doctors-add', {
      user: req.session.user,
      error: 'Error adding doctor: ' + error.message,
    });
  }
});


app.get('/admin/doctors/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user_id');
    res.render('admin-doctors-edit', { user: req.session.user, doctor, error: null });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/doctors/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { specialty, location, status } = req.body;
    await Doctor.findByIdAndUpdate(req.params.id, { specialty, location, status });
    res.redirect('/admin/dashboard');
  } catch (error) {
    const doctor = await Doctor.findById(req.params.id).populate('user_id');
    res.render('admin-doctors-edit', { user: req.session.user, doctor, error: 'Lỗi khi sửa bác sĩ: ' + error.message });
  }
});

app.get('/admin/doctors/delete/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// Quản lý thuốc (Medicines) - CRUD
app.get('/admin/medicines/add', requireLoginEJS, requireAdminEJS, (req, res) => {
  res.render('admin-medicines-add', { user: req.session.user, error: null });
});

app.post('/admin/medicines/add', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { name, type, illness, price, stock, requires_prescription } = req.body;
    const newMedicine = new Medicine({
      name,
      type,
      illness,
      price,
      stock,
      requires_prescription: requires_prescription === 'on',
      status: stock > 0 ? 'available' : 'out_of_stock',
    });
    await newMedicine.save();
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.render('admin-medicines-add', { user: req.session.user, error: 'Lỗi khi thêm thuốc: ' + error.message });
  }
});

app.get('/admin/medicines/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    res.render('admin-medicines-edit', { user: req.session.user, medicine, error: null });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/medicines/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { name, type, illness, price, stock, requires_prescription } = req.body;
    await Medicine.findByIdAndUpdate(req.params.id, {
      name,
      type,
      illness,
      price,
      stock,
      requires_prescription: requires_prescription === 'on',
      status: stock > 0 ? 'available' : 'out_of_stock',
    });
    res.redirect('/admin/dashboard');
  } catch (error) {
    const medicine = await Medicine.findById(req.params.id);
    res.render('admin-medicines-edit', { user: req.session.user, medicine, error: 'Lỗi khi sửa thuốc: ' + error.message });
  }
});

app.get('/admin/medicines/delete/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// Quản lý tin tức (News) - CRUD
app.get('/admin/news/add', requireLoginEJS, requireAdminEJS, (req, res) => {
  res.render('admin-news-add', { user: req.session.user, error: null });
});

app.post('/admin/news/add', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { title, content, category, priority } = req.body;
    const newNews = new News({
      title,
      content,
      category,
      priority: priority || 0,
      status: 'published',
    });
    await newNews.save();
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.render('admin-news-add', { user: req.session.user, error: 'Lỗi khi thêm tin tức: ' + error.message });
  }
});

app.get('/admin/news/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    res.render('admin-news-edit', { user: req.session.user, news, error: null });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/news/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { title, content, category, priority, status } = req.body;
    await News.findByIdAndUpdate(req.params.id, {
      title,
      content,
      category,
      priority: priority || 0,
      status,
    });
    res.redirect('/admin/dashboard');
  } catch (error) {
    const news = await News.findById(req.params.id);
    res.render('admin-news-edit', { user: req.session.user, news, error: 'Lỗi khi sửa tin tức: ' + error.message });
  }
});

app.get('/admin/news/delete/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// Quản lý bệnh (HealthInfos) - CRUD
app.get('/admin/healthinfos/add', requireLoginEJS, requireAdminEJS, (req, res) => {
  res.render('admin-healthinfos-add', { user: req.session.user, error: null });
});

app.post('/admin/healthinfos/add', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { disease_name, symptoms, description, treatments } = req.body;
    const newHealthInfo = new HealthInfo({
      disease_name,
      symptoms,
      description,
      treatments,
    });
    await newHealthInfo.save();
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.render('admin-healthinfos-add', { user: req.session.user, error: 'Lỗi khi thêm bệnh: ' + error.message });
  }
});

app.get('/admin/healthinfos/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const healthinfo = await HealthInfo.findById(req.params.id);
    res.render('admin-healthinfos-edit', { user: req.session.user, healthinfo, error: null });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/healthinfos/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { disease_name, symptoms, description, treatments } = req.body;
    await HealthInfo.findByIdAndUpdate(req.params.id, {
      disease_name,
      symptoms,
      description,
      treatments,
    });
    res.redirect('/admin/dashboard');
  } catch (error) {
    const healthinfo = await HealthInfo.findById(req.params.id);
    res.render('admin-healthinfos-edit', { user: req.session.user, healthinfo, error: 'Lỗi khi sửa bệnh: ' + error.message });
  }
});

app.get('/admin/healthinfos/delete/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    await HealthInfo.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// Quản lý đơn hàng (Orders) - CRUD (Admin)
app.get('/admin/orders/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user_id').populate('items.medicine_id');
    res.render('admin-orders-edit', { user: req.session.user, order, error: null });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});


// Route để xem lịch sử mua hàng
app.get('/order-history', requireLoginEJS, async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.session.user._id })
      .populate({
        path: 'items.medicine_id',
        select: 'name price', // Chỉ lấy các trường cần thiết
      })
      .sort({ created_at: -1 }); // Sắp xếp theo thời gian tạo, mới nhất trước
    res.render('order-history', { user: req.session.user, orders, error: null });
  } catch (error) {
    res.render('order-history', { user: req.session.user, orders: [], error: 'Error fetching order history: ' + error.message });
  }
});

// Route để xem bệnh án
app.get('/medical-records', requireLoginEJS, async (req, res) => {
  try {
    const user = req.session.user;

    let records = [];
    if (user.role === 'patient') {
      // Tìm patient dựa trên user_id
      const patient = await Patient.findOne({ user_id: user._id });
      if (!patient) {
        return res.render('medical-records', { records: [], error: 'Patient profile not found' });
      }
      // Tìm tất cả bệnh án của bệnh nhân này
      records = await MedicalRecord.find({ patient_id: patient._id })
        .populate({
          path: 'patient_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'doctor_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'prescription_id',
          populate: { path: 'medicine_ids', select: 'name' }, // Populate danh sách thuốc trong đơn thuốc
        })
        .sort({ created_at: -1 });
    } else if (user.role === 'doctor') {
      // Tìm doctor dựa trên user_id
      const doctor = await Doctor.findOne({ user_id: user._id });
      if (!doctor) {
        return res.render('medical-records', { records: [], error: 'Doctor profile not found' });
      }
      // Tìm tất cả bệnh án của bác sĩ này
      records = await MedicalRecord.find({ doctor_id: doctor._id })
        .populate({
          path: 'patient_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'doctor_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'prescription_id',
          populate: { path: 'medicine_ids', select: 'name' },
        })
        .sort({ created_at: -1 });
    } else {
      return res.render('medical-records', { records: [], error: 'Access denied' });
    }

    res.render('medical-records', { records, error: null });
  } catch (error) {
    res.render('medical-records', { records: [], error: 'Error fetching medical records: ' + error.message });
  }
});

// Route để xem đơn thuốc
app.get('/prescriptions', requireLoginEJS, async (req, res) => {
  try {
    const user = req.session.user;

    let prescriptions = [];
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user_id: user._id });
      if (!patient) {
        return res.render('prescriptions', { user, prescriptions: [], error: 'Patient profile not found' });
      }
      prescriptions = await Prescription.find({ patient_id: patient._id })
        .populate({
          path: 'patient_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'doctor_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate('medicine_ids', 'name')
        .sort({ created_at: -1 });
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: user._id });
      if (!doctor) {
        return res.render('prescriptions', { user, prescriptions: [], error: 'Doctor profile not found' });
      }
      prescriptions = await Prescription.find({ doctor_id: doctor._id })
        .populate({
          path: 'patient_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate({
          path: 'doctor_id',
          populate: { path: 'user_id', select: 'name' },
        })
        .populate('medicine_ids', 'name')
        .sort({ created_at: -1 });
    } else {
      return res.render('prescriptions', { user, prescriptions: [], error: 'Access denied' });
    }

    res.render('prescriptions', { user, prescriptions, error: null });
  } catch (error) {
    res.render('prescriptions', { user: req.session.user, prescriptions: [], error: 'Error fetching prescriptions: ' + error.message });
  }
});

app.post('/admin/orders/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { status, delivery_address } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status, delivery_address });
    res.redirect('/admin/dashboard');
  } catch (error) {
    const order = await Order.findById(req.params.id).populate('user_id').populate('items.medicine_id');
    res.render('admin-orders-edit', { user: req.session.user, order, error: 'Lỗi khi sửa đơn hàng: ' + error.message });
  }
});

app.get('/admin/orders/delete/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// Quản lý thanh toán (Payments) - CRUD (Admin)
app.get('/admin/payments/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('user_id');
    res.render('admin-payments-edit', { user: req.session.user, payment, error: null });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/payments/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { amount, method, status } = req.body;
    await Payment.findByIdAndUpdate(req.params.id, { amount, method, status });
    res.redirect('/admin/dashboard');
  } catch (error) {
    const payment = await Payment.findById(req.params.id).populate('user_id');
    res.render('admin-payments-edit', { user: req.session.user, payment, error: 'Lỗi khi sửa thanh toán: ' + error.message });
  }
});

app.get('/admin/payments/delete/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// Quản lý phản hồi (Feedback) - CRUD (Admin)
app.get('/admin/feedbacks/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('user_id');
    res.render('admin-feedbacks-edit', { user: req.session.user, feedback, error: null });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/feedbacks/edit/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    const { subject, content, status } = req.body;
    await Feedback.findByIdAndUpdate(req.params.id, { subject, content, status });
    res.redirect('/admin/dashboard');
  } catch (error) {
    const feedback = await Feedback.findById(req.params.id).populate('user_id');
    res.render('admin-feedbacks-edit', { user: req.session.user, feedback, error: 'Lỗi khi sửa phản hồi: ' + error.message });
  }
});

app.get('/admin/feedbacks/delete/:id', requireLoginEJS, requireAdminEJS, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});