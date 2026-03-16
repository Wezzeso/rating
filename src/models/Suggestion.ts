import mongoose from 'mongoose';

export interface ISuggestion extends mongoose.Document {
    userId: string;
    text: string;
    status: 'pending' | 'read' | 'archived';
    createdAt: Date;
}

const SuggestionSchema = new mongoose.Schema<ISuggestion>(
    {
        userId: {
            type: String,
            required: [true, 'Please provide a user ID'],
        },
        text: {
            type: String,
            required: [true, 'Please provide suggestion text'],
            maxlength: [500, 'Suggestion cannot be more than 500 characters'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'read', 'archived'],
            default: 'pending',
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Suggestion || mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
