import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { School } from '../models/School';
import { Class } from '../models/Class';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { Attendance } from '../models/Attendance';
import { Homework } from '../models/Homework';
import { Complaint } from '../models/Complaint';
import { Notice } from '../models/Notice';
import { Mark } from '../models/Mark';
import { authMiddleware, roleAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.post('/auth/register', async (req: any, res: Response): Promise<void> => {
  try {
    const { name, code, principalName, address, city, state, pincode, contactNumber, email, logo, adminPin } = req.body;
    if (!name || !code || !principalName || !address || !city || !state || !pincode || !contactNumber || !adminPin) {
      res.status(400).json({ error: 'All required fields must be filled' }); return;
    }
    const existing = await School.findOne({ $or: [{ code }, { email }] });
    if (existing) { res.status(409).json({ error: 'School already exists' }); return; }
    const schoolId = `SCH-${Date.now().toString(36).toUpperCase()}`;
    const hashedPin = await bcrypt.hash(adminPin, 10);
    const school = new School({ name, code, schoolId, principalName, address, city, state, pincode, contactNumber, email, logo, adminPin: hashedPin });
    await school.save();
    const token = jwt.sign({ userId: school._id.toString(), role: 'school_admin', schoolId: school.schoolId }, env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'School registered', token, school: { id: school._id, name: school.name, schoolId: school.schoolId } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/login', async (req: any, res: Response): Promise<void> => {
  try {
    const { schoolId, pin } = req.body;
    if (!schoolId || !pin) { res.status(400).json({ error: 'School ID and PIN required' }); return; }
    const school = await School.findOne({ schoolId });
    if (!school) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const isMatch = await bcrypt.compare(pin, school.adminPin);
    if (!isMatch) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = jwt.sign({ userId: school._id.toString(), role: 'school_admin', schoolId: school.schoolId }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: school._id, name: school.name, role: 'school_admin', schoolId: school.schoolId } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/teacher-login', async (req: any, res: Response): Promise<void> => {
  try {
    const { schoolId, teacherId, pin } = req.body;
    if (!schoolId || !teacherId || !pin) { res.status(400).json({ error: 'All fields required' }); return; }
    const school = await School.findOne({ schoolId });
    if (!school) { res.status(401).json({ error: 'Invalid school' }); return; }
    const teacher = await Teacher.findOne({ schoolId: school._id, teacherId });
    if (!teacher) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const isMatch = await bcrypt.compare(pin, teacher.pin);
    if (!isMatch) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = jwt.sign({ userId: teacher._id.toString(), role: 'teacher', schoolId: school.schoolId }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: teacher._id, name: teacher.name, role: 'teacher', teacherId: teacher.teacherId, schoolId: school.schoolId } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/student-login', async (req: any, res: Response): Promise<void> => {
  try {
    const { schoolId, admissionNumber, dob } = req.body;
    if (!schoolId || !admissionNumber || !dob) { res.status(400).json({ error: 'All fields required' }); return; }
    const school = await School.findOne({ schoolId });
    if (!school) { res.status(401).json({ error: 'Invalid school' }); return; }
    const student = await Student.findOne({ schoolId: school._id, admissionNumber });
    if (!student) { res.status(401).json({ error: 'Invalid admission number' }); return; }
    if (student.dob !== dob) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = jwt.sign({ userId: student._id.toString(), role: 'student', schoolId: school.schoolId }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: student._id, name: student.name, role: 'student', admissionNumber: student.admissionNumber, schoolId: school.schoolId } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const schoolAuthMiddleware = authMiddleware;

router.use(schoolAuthMiddleware);

router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId }).select('-adminPin');
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const stats = { teachers: await Teacher.countDocuments({ schoolId: school._id }), students: await Student.countDocuments({ schoolId: school._id }), classes: await Class.countDocuments({ schoolId: school._id }) };
    res.json({ school, stats });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/classes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const classes = await Class.find({ schoolId: school._id }).populate('classTeacher', 'name');
    const counts = await Promise.all(classes.map(async (c) => ({ classId: c._id, studentCount: await Student.countDocuments({ schoolId: school._id, classId: c._id }) })));
    res.json({ classes, counts });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/classes', roleAuth('school_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { name, sections } = req.body;
    if (!name) { res.status(400).json({ error: 'Class name required' }); return; }
    const cls = new Class({ schoolId: school._id, name, sections: sections || ['A'] });
    await cls.save();
    res.status(201).json({ message: 'Class created', class: cls });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/teachers', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const teachers = await Teacher.find({ schoolId: school._id }).populate('assignedClass', 'name');
    res.json({ teachers });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/teachers', roleAuth('school_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { name, email, phone, subjects, assignedClass, isClassTeacher } = req.body;
    if (!name || !phone) { res.status(400).json({ error: 'Name and phone required' }); return; }
    const teacherId = `TCH-${Date.now().toString(36).toUpperCase()}`;
    const defaultPin = phone.slice(-5);
    const hashedPin = await bcrypt.hash(defaultPin, 10);
    const teacher = new Teacher({ schoolId: school._id, teacherId, name, email, phone, subjects: subjects || [], assignedClass, isClassTeacher, pin: hashedPin });
    await teacher.save();
    res.status(201).json({ message: 'Teacher added', teacher, defaultPin });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/teachers/:teacherId', roleAuth('school_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Teacher.findByIdAndDelete(req.params.teacherId);
    res.json({ message: 'Teacher removed' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, section } = req.query;
    const filter: Record<string, unknown> = { schoolId: school._id };
    if (classId) filter.classId = classId;
    if (section) filter.section = section;
    const students = await Student.find(filter).populate('classId', 'name');
    res.json({ students });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/students', roleAuth('school_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, section, name, fatherName, motherName, dob, gender, phone, address, bloodGroup } = req.body;
    if (!classId || !section || !name || !dob) { res.status(400).json({ error: 'Class, section, name, and DOB required' }); return; }
    const count = await Student.countDocuments({ schoolId: school._id });
    const admissionNumber = `STU-${String(count + 1).padStart(4, '0')}`;
    const student = new Student({ schoolId: school._id, classId, section, admissionNumber, name, fatherName, motherName, dob, gender, phone, address, bloodGroup });
    await student.save();
    res.status(201).json({ message: 'Student added', student });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/students/:studentId', roleAuth('school_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Student.findByIdAndDelete(req.params.studentId);
    res.json({ message: 'Student removed' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/attendance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, section, date, records } = req.body;
    if (!classId || !section || !date || !records) { res.status(400).json({ error: 'All fields required' }); return; }
    await Attendance.findOneAndUpdate(
      { schoolId: school._id, classId, section, date },
      { schoolId: school._id, classId, section, date, records, takenBy: req.user!.userId },
      { upsert: true, new: true }
    );
    res.json({ message: 'Attendance saved' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/attendance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, section, date, month, studentId } = req.query;
    const filter: Record<string, unknown> = { schoolId: school._id };
    if (classId) filter.classId = classId;
    if (section) filter.section = section;
    if (date) filter.date = date;
    if (month) filter.date = { $regex: `^${month}` };
    if (studentId) filter['records.studentId'] = studentId;
    const records = await Attendance.find(filter).sort({ date: -1 }).populate('takenBy', 'name').populate('classId', 'name');
    res.json({ records });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/attendance/analytics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, studentId, month } = req.query;
    const filter: Record<string, unknown> = { schoolId: school._id };
    if (classId) filter.classId = classId;
    if (month) filter.date = { $regex: `^${month}` };
    const records = await Attendance.find(filter);
    let present = 0, absent = 0, leave = 0, late = 0;
    for (const rec of records) {
      for (const r of rec.records) {
        if (studentId && r.studentId.toString() !== studentId) continue;
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'leave') leave++;
        else if (r.status === 'late') late++;
      }
    }
    const total = present + absent + leave + late;
    res.json({ present, absent, leave, late, total, percentage: total ? Math.round((present / total) * 100) : 0 });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/homework', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, section, subject, title, description, attachments, deadline } = req.body;
    if (!classId || !section || !subject || !title) { res.status(400).json({ error: 'All fields required' }); return; }
    const hw = new Homework({ schoolId: school._id, classId, section, subject, title, description, attachments: attachments || [], deadline, uploadedBy: req.user!.userId });
    await hw.save();
    res.status(201).json({ message: 'Homework uploaded', homework: hw });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/homework', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, section } = req.query;
    const filter: Record<string, unknown> = { schoolId: school._id };
    if (classId) filter.classId = classId;
    if (section) filter.section = section;
    const homework = await Homework.find(filter).sort({ createdAt: -1 }).populate('uploadedBy', 'name').populate('classId', 'name');
    res.json({ homework });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/notices', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { title, content, attachments, type, targetClasses } = req.body;
    if (!title || !content) { res.status(400).json({ error: 'Title and content required' }); return; }
    const notice = new Notice({
      schoolId: school._id, title, content, attachments: attachments || [], type: type || 'general',
      targetClasses: targetClasses || [], postedBy: req.user!.userId, postedByRole: req.user?.role === 'teacher' ? 'teacher' : 'admin',
    });
    await notice.save();
    res.status(201).json({ message: 'Notice posted', notice });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/notices', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const notices = await Notice.find({ schoolId: school._id }).sort({ createdAt: -1 }).populate('postedBy', 'name');
    res.json({ notices });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/complaints', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { studentId, classId, title, description, type } = req.body;
    if (!studentId || !classId || !title) { res.status(400).json({ error: 'Student, class, and title required' }); return; }
    const complaint = new Complaint({
      schoolId: school._id, studentId, classId, title, description, type,
      filedBy: req.user!.userId, filedByRole: req.user?.role === 'teacher' ? 'teacher' : 'admin',
    });
    await complaint.save();
    res.status(201).json({ message: 'Complaint filed', complaint });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/complaints', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, studentId } = req.query;
    const filter: Record<string, unknown> = { schoolId: school._id };
    if (classId) filter.classId = classId;
    if (studentId) filter.studentId = studentId;
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).populate('studentId', 'name admissionNumber');
    res.json({ complaints });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/marks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { classId, section, studentId, subject, examType, marksObtained, totalMarks, grade, term, academicYear } = req.body;
    if (!classId || !section || !studentId || !subject || marksObtained === undefined || !totalMarks) {
      res.status(400).json({ error: 'All mark fields required' }); return;
    }
    const mark = new Mark({ schoolId: school._id, classId, section, studentId, subject, examType, marksObtained, totalMarks, grade, term, academicYear });
    await mark.save();
    res.status(201).json({ message: 'Marks added', mark });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/marks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const { studentId } = req.query;
    const filter: Record<string, unknown> = { schoolId: school._id };
    if (studentId) filter.studentId = studentId;
    const marks = await Mark.find(filter).sort({ createdAt: -1 }).populate('studentId', 'name admissionNumber');
    res.json({ marks });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/dashboard', roleAuth('school_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findOne({ schoolId: req.user?.schoolId });
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    const totalStudents = await Student.countDocuments({ schoolId: school._id });
    const totalTeachers = await Teacher.countDocuments({ schoolId: school._id });
    const totalClasses = await Class.countDocuments({ schoolId: school._id });
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.find({ schoolId: school._id, date: today });
    let present = 0, absent = 0;
    for (const rec of todayAttendance) {
      for (const r of rec.records) {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
      }
    }
    const recentHomework = await Homework.find({ schoolId: school._id }).sort({ createdAt: -1 }).limit(5).populate('uploadedBy', 'name').populate('classId', 'name');
    const recentNotices = await Notice.find({ schoolId: school._id }).sort({ createdAt: -1 }).limit(5);
    res.json({ stats: { totalStudents, totalTeachers, totalClasses, presentToday: present, absentToday: absent }, recentHomework, recentNotices });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/list', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schools = await School.find({}).select('name city state code schoolId');
    res.json({ schools });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
