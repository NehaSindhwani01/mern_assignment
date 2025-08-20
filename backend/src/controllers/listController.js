import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import Agent from '../models/Agent.js';
import ListItem from '../models/ListItem.js';

const parseCsvFile = (filePath) =>
    new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', () => resolve(rows))
        .on('error', reject);
    }
);

const parseXlsxFile = (filePath) => {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws); // returns array of objects
};

const validateRow = (row) => {
    const FirstName = row.FirstName || row.firstName || row.firstname || row.FIRSTNAME;
    const Phone = row.Phone || row.phone || row.PHONE;
    const Notes = row.Notes || row.notes || row.NOTES || '';
    if (!FirstName || !Phone) return null;
    return { firstName: String(FirstName).trim(), phone: String(Phone).trim(), notes: String(Notes || '').trim() };
};

export const uploadAndDistribute = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
    let rawRows;
    try {
        if (ext === '.csv') rawRows = await parseCsvFile(req.file.path);
        else rawRows = parseXlsxFile(req.file.path);
    } catch (e) {
        return res.status(400).json({ message: 'Failed to parse file', error: e.message });
    } finally {
        // cleanup file
        fs.unlink(req.file.path, () => {});
    }

    const rows = rawRows.map(validateRow).filter(Boolean);
    if (!rows.length) return res.status(400).json({ message: 'No valid rows found. Expect columns: FirstName, Phone, Notes' });

    // ensure exactly 5-agent distribution as per spec
    const agents = await Agent.find().sort({ createdAt: 1 });
    if (agents.length < 5) return res.status(400).json({ message: 'At least 5 agents required to distribute the list' });

    const selectedAgents = agents.slice(0, 5); // first 5 agents

    // base equal distribution
    const n = rows.length;
    const perAgent = Math.floor(n / 5);
    let remainder = n % 5;

    const batches = [];
    let idx = 0;
    for (let i = 0; i < 5; i++) {
        const size = perAgent + (remainder > 0 ? 1 : 0);
        const slice = rows.slice(idx, idx + size);
        idx += size;
        remainder = Math.max(0, remainder - 1);
        batches.push(slice);
    }

    // Save to DB
    const ops = [];
    for (let i = 0; i < 5; i++) {
        const agentId = selectedAgents[i]._id;
        for (const item of batches[i]) {
        ops.push({ ...item, assignedTo: agentId });
        }
    }

    await ListItem.insertMany(ops);
    res.json({ message: `Distributed ${ops.length} items among 5 agents`, counts: batches.map((b) => b.length) });
};

export const getDistributedByAgent = async (req, res) => {
    const data = await ListItem.aggregate([
        { $group: { _id: '$assignedTo', items: { $push: { firstName: '$firstName', phone: '$phone', notes: '$notes' } }, count: { $sum: 1 } } },
        { $lookup: { from: 'agents', localField: '_id', foreignField: '_id', as: 'agent' } },
        { $unwind: '$agent' },
        { $project: { _id: 0, agent: { id: '$agent._id', name: '$agent.name', email: '$agent.email', mobile: '$agent.mobile' }, count: 1, items: 1 } },
        { $sort: { 'agent.name': 1 } }
    ]);
    res.json(data);
};