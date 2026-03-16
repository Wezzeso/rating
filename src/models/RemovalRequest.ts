import mongoose from 'mongoose';

export interface IRemovalRequest extends mongoose.Document {
    professorName: string;
    officialEmail: string;
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved';
    acceptedTerms: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const RemovalRequestSchema = new mongoose.Schema<IRemovalRequest>(
    {
        professorName: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
        },
        officialEmail: {
            type: String,
            required: [true, 'Please provide your official email'],
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/i, 'Please provide a valid official email address'],
            trim: true,
            lowercase: true,
        },
        reason: {
            type: String,
            required: [true, 'Please provide a reason for removal'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved'],
            default: 'pending',
        },
        acceptedTerms: {
            type: Boolean,
            required: [true, 'You must accept the terms and conditions'],
            validate: {
                validator: (v: boolean) => v === true,
                message: 'You must accept the terms and conditions',
            },
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.RemovalRequest || mongoose.model<IRemovalRequest>('RemovalRequest', RemovalRequestSchema);
