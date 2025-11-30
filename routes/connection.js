const express = require('express');
const router = express.Router();
const ConnectionRequest = require('../models/ConnectionRequest');
const Student = require('../models/Student');
const Alumni = require('../models/Alumni');
const mongoose = require('mongoose');

// Student sends connection request to alumni
router.post('/request', async (req, res) => {
  console.log('POST /api/connections/request body:', req.body); // Debug log
  const { fromStudent, toAlumni } = req.body;
  if (!fromStudent || !toAlumni) return res.status(400).json({ error: 'Missing fields' });
  // Prevent duplicate pending requests
  const exists = await ConnectionRequest.findOne({ fromStudent, toAlumni, status: 'pending' });
  if (exists) return res.status(409).json({ error: 'Request already sent' });
  const request = new ConnectionRequest({ fromStudent, toAlumni });
  await request.save();
  console.log('Saved new connection request:', request); // Debug log
  res.json({ success: true, request });
});

// Alumni fetches pending requests
router.get('/received/:alumniId', async (req, res) => {
  const { alumniId } = req.params;
  const requests = await ConnectionRequest.find({ toAlumni: alumniId, status: 'pending' })
    .populate('fromStudent', 'name email img');
  // Map to include student details in a flat structure
  const mapped = requests.map(r => ({
    _id: r._id,
    studentId: r.fromStudent?._id,
    studentName: r.fromStudent?.name || 'Unknown Student',
    studentImg: r.fromStudent?.img || '',
    studentEmail: r.fromStudent?.email || '',
    status: r.status,
    createdAt: r.createdAt,
    seenByAlumni: r.seenByAlumni || false
  }));
  res.json(mapped);
});

// Alumni responds to request
router.post('/respond', async (req, res) => {
  const { requestId, action } = req.body; // action: 'accept' or 'reject'
  const request = await ConnectionRequest.findById(requestId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  // Map action to status
  request.status = action === 'accept' ? 'accepted' : 'rejected';
  if (action === 'accept') request.notifiedStudent = false;
  await request.save();
  res.json({ success: true, request });
});

// Student fetches accepted connections
router.get('/my/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const connections = await ConnectionRequest.find({ fromStudent: studentId, status: 'accepted' })
    .populate('toAlumni', 'name email img company');
  res.json(connections);
});

// Student fetches notification for new accepted connections
router.get('/student/notifications/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const newConnections = await ConnectionRequest.find({ fromStudent: studentId, status: 'accepted', notifiedStudent: false })
    .populate('toAlumni', 'name email img company');
  res.json(newConnections);
});

// Alumni fetches notification for new requests
router.get('/alumni/notifications/:alumniId', async (req, res) => {
  const { alumniId } = req.params;
  const newRequests = await ConnectionRequest.find({ toAlumni: alumniId, status: 'pending', notified: false })
    .populate('fromStudent', 'name email img');
  res.json(newRequests);
});

// Mark alumni notifications as seen
router.post('/alumni/notifications/seen', async (req, res) => {
  const { alumniId } = req.body;
  await ConnectionRequest.updateMany({ toAlumni: alumniId, status: 'pending', notified: false }, { $set: { notified: true } });
  res.json({ success: true });
});

// Mark student notifications as seen
router.post('/student/notifications/seen', async (req, res) => {
  const { studentId } = req.body;
  await ConnectionRequest.updateMany({ fromStudent: studentId, status: 'accepted', notifiedStudent: false }, { $set: { notifiedStudent: true } });
  res.json({ success: true });
});

// Student fetches all requests sent (for dashboard button state)
router.get('/requested/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const requests = await ConnectionRequest.find({ fromStudent: studentId })
    .select('toAlumni status')
    .populate('toAlumni', '_id');
  console.log('Backend /requested/:studentId requests:', requests);
  // Return as array of { alumniId, status }
  res.json(requests.map(r => ({ alumniId: r.toAlumni?._id?.toString() || r.toAlumni?.toString(), status: r.status })));
});

module.exports = router;
