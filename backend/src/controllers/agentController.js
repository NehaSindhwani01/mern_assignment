import bcrypt from 'bcryptjs';
import Agent from '../models/Agent.js';
import { isValidEmail, isValidE164 } from '../utils/validators.js';

export const addAgent = async (req, res) => {
    const { name, email, mobile, password } = req.body;
    if (!name || !email || !mobile || !password) return res.status(400).json({ message: 'All fields required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (!isValidE164(mobile)) return res.status(400).json({ message: 'Mobile must be in +<country><number> (E.164) format' });

    const exists = await Agent.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Agent email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const agent = await Agent.create({ name, email: email.toLowerCase(), mobile, password: hash });
    res.status(201).json({ message: 'Agent created', agent: { id: agent._id, name: agent.name, email: agent.email, mobile: agent.mobile } });
};


export const getAgents = async (req, res) => {
    const agents = await Agent.find().select('-password').sort({ createdAt: -1 });
    res.json(agents);
};