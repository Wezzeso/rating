import mongoose from 'mongoose';

export interface IComment extends mongoose.Document {
    professorId: string;
    userFingerprint: string;
    text: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}

const CommentSchema = new mongoose.Schema<IComment>(
    {
        professorId: {
            type: String,
            required: [true, 'Please provide a professor ID'],
            index: true,
        },
        userFingerprint: {
            type: String,
            required: [true, 'Please provide a user fingerprint'],
        },
        text: {
            type: String,
            required: [true, 'Please provide comment text'],
            maxlength: [100, 'Comment cannot be more than 100 characters'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Enforce 1 comment per user per professor
CommentSchema.index({ professorId: 1, userFingerprint: 1 }, { unique: true });

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
