import mongoose from 'mongoose';


const agentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        mobile: { type: String, required: true },
        password: { type: String, required: true }
    },
    {   
        timestamps: true 
    }
);


export default mongoose.model('Agent', agentSchema);